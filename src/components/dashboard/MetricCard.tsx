import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

interface MetricCardProps {
  title: string;
  value: number;
  format?: 'currency' | 'percentage' | 'number';
  trend?: number;
  trendLabel?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'profit' | 'loss' | 'neutral';
  className?: string;
}

export function MetricCard({
  title,
  value,
  format = 'currency',
  trend,
  trendLabel,
  icon: Icon,
  variant = 'default',
  className,
}: MetricCardProps) {
  const formattedValue = 
    format === 'currency' ? formatCurrency(value) :
    format === 'percentage' ? formatPercentage(value) :
    value.toLocaleString('pt-BR');

  const isPositiveTrend = trend !== undefined && trend >= 0;
  const isProfit = variant === 'profit' || (variant === 'default' && value >= 0);

  return (
    <div
      className={cn(
        "metric-card group",
        variant === 'profit' && "metric-card-profit",
        variant === 'loss' && "metric-card-loss",
        variant === 'neutral' && "metric-card-neutral",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {Icon && (
          <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
            variant === 'profit' ? "bg-success/10 text-success" :
            variant === 'loss' ? "bg-destructive/10 text-destructive" :
            "bg-primary/10 text-primary"
          )}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      
      <p className={cn(
        "stat-value",
        variant === 'profit' && "stat-value-profit",
        variant === 'loss' && "stat-value-loss"
      )}>
        {formattedValue}
      </p>

      {trend !== undefined && (
        <div className="flex items-center gap-1.5 mt-2">
          <span
            className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded",
              isPositiveTrend 
                ? "bg-success/10 text-success" 
                : "bg-destructive/10 text-destructive"
            )}
          >
            {isPositiveTrend ? '+' : ''}{formatPercentage(trend)}
          </span>
          {trendLabel && (
            <span className="text-xs text-muted-foreground">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
