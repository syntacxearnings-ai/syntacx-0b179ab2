import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Order, FixedCost } from '@/lib/types';
import { calculateNetProfit } from '@/lib/profitCalculator';
import { formatCurrency } from '@/lib/formatters';

interface RevenueChartProps {
  orders: Order[];
  fixedCosts: FixedCost[];
  daysBack?: number;
}

export function RevenueChart({ orders, fixedCosts, daysBack = 30 }: RevenueChartProps) {
  const chartData = useMemo(() => {
    const data: Record<string, { date: string; revenue: number; profit: number; orders: number }> = {};
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Initialize all days
    for (let i = 0; i <= daysBack; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const key = date.toISOString().split('T')[0];
      data[key] = { date: key, revenue: 0, profit: 0, orders: 0 };
    }

    // Aggregate order data
    const validOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'returned');
    
    validOrders.forEach(order => {
      const key = order.date.toISOString().split('T')[0];
      if (data[key]) {
        const breakdown = calculateNetProfit(order, fixedCosts, validOrders.length);
        data[key].revenue += breakdown.netRevenue;
        data[key].profit += breakdown.netProfit;
        data[key].orders += 1;
      }
    });

    return Object.values(data)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        revenue: Math.round(d.revenue * 100) / 100,
        profit: Math.round(d.profit * 100) / 100,
      }));
  }, [orders, fixedCosts, daysBack]);

  return (
    <div className="chart-container">
      <h3 className="text-base font-semibold mb-4">Receita vs Lucro (últimos {daysBack} dias)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            fontSize={11} 
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            fontSize={11} 
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number) => formatCurrency(value)}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Receita"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
          <Area
            type="monotone"
            dataKey="profit"
            name="Lucro"
            stroke="hsl(var(--success))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorProfit)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
