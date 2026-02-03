import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Order } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';

interface TopProductsChartProps {
  orders: Order[];
  metric: 'profit' | 'revenue';
  limit?: number;
}

export function TopProductsChart({ orders, metric, limit = 10 }: TopProductsChartProps) {
  const chartData = useMemo(() => {
    const productStats: Record<string, { name: string; revenue: number; profit: number; qty: number }> = {};

    const validOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'returned');

    validOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productStats[item.sku]) {
          productStats[item.sku] = { name: item.productName, revenue: 0, profit: 0, qty: 0 };
        }
        const itemRevenue = item.unitPrice * item.quantity;
        const itemDiscount = item.unitDiscount * item.quantity;
        const itemCost = item.unitCost * item.quantity;
        const itemProfit = itemRevenue - itemDiscount - itemCost;

        productStats[item.sku].revenue += itemRevenue;
        productStats[item.sku].profit += itemProfit;
        productStats[item.sku].qty += item.quantity;
      });
    });

    return Object.entries(productStats)
      .map(([sku, stats]) => ({
        sku,
        name: stats.name.length > 20 ? stats.name.substring(0, 20) + '...' : stats.name,
        fullName: stats.name,
        revenue: Math.round(stats.revenue * 100) / 100,
        profit: Math.round(stats.profit * 100) / 100,
        qty: stats.qty,
      }))
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, limit);
  }, [orders, metric, limit]);

  // Purple scale colors
  const colors = [
    'hsl(256, 87%, 60%)',   // Primary purple
    'hsl(256, 70%, 70%)',   // Lighter
    'hsl(256, 60%, 45%)',   // Darker
    'hsl(256, 50%, 80%)',   // Very light
    'hsl(256, 40%, 55%)',   // Muted
  ];

  return (
    <div className="chart-container">
      <h3 className="text-base font-semibold mb-4">
        Top {limit} Produtos por {metric === 'profit' ? 'Lucro' : 'Faturamento'}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis 
            type="number" 
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={120}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
          />
          <Bar dataKey={metric} radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
