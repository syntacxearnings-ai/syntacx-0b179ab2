import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Order, FixedCost } from '@/lib/types';
import { calculateNetProfit } from '@/lib/profitCalculator';
import { formatPercentage } from '@/lib/formatters';

interface MarginChartProps {
  orders: Order[];
  fixedCosts: FixedCost[];
  daysBack?: number;
}

export function MarginChart({ orders, fixedCosts, daysBack = 30 }: MarginChartProps) {
  const chartData = useMemo(() => {
    const data: Record<string, { date: string; netRevenue: number; netProfit: number }> = {};
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    for (let i = 0; i <= daysBack; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const key = date.toISOString().split('T')[0];
      data[key] = { date: key, netRevenue: 0, netProfit: 0 };
    }

    const validOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'returned');
    
    validOrders.forEach(order => {
      const key = order.date.toISOString().split('T')[0];
      if (data[key]) {
        const breakdown = calculateNetProfit(order, fixedCosts, validOrders.length);
        data[key].netRevenue += breakdown.netRevenue;
        data[key].netProfit += breakdown.netProfit;
      }
    });

    return Object.values(data)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        date: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        margin: d.netRevenue > 0 ? (d.netProfit / d.netRevenue) * 100 : 0,
      }));
  }, [orders, fixedCosts, daysBack]);

  const avgMargin = useMemo(() => {
    const margins = chartData.filter(d => d.margin !== 0);
    return margins.length > 0 
      ? margins.reduce((sum, d) => sum + d.margin, 0) / margins.length 
      : 0;
  }, [chartData]);

  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Margem Líquida por Dia</h3>
        <span className="text-sm text-muted-foreground">
          Média: <span className="font-medium text-foreground">{formatPercentage(avgMargin)}</span>
        </span>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            tickFormatter={(value) => `${value.toFixed(0)}%`}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number) => formatPercentage(value)}
          />
          <ReferenceLine 
            y={avgMargin} 
            stroke="hsl(var(--muted-foreground))" 
            strokeDasharray="5 5"
            label={{
              value: 'Média',
              position: 'right',
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 10,
            }}
          />
          <ReferenceLine 
            y={0} 
            stroke="hsl(var(--destructive))" 
            strokeWidth={1}
          />
          <Line
            type="monotone"
            dataKey="margin"
            name="Margem"
            stroke="hsl(var(--accent))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--accent))', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
