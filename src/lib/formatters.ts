/**
 * Format currency in BRL
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Format percentage with sign
 */
export function formatPercentage(value: number, showSign = false): string {
  const formatted = `${Math.abs(value).toFixed(1)}%`;
  if (showSign && value !== 0) {
    return value > 0 ? `+${formatted}` : `-${formatted}`;
  }
  return formatted;
}

/**
 * Format number with thousands separator
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Format date in Brazilian format
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format relative date
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
  return formatDate(date);
}

/**
 * Status label mapping
 */
export const statusLabels: Record<string, string> = {
  paid: 'Pago',
  shipped: 'Enviado',
  delivered: 'Entregue',
  returned: 'Devolvido',
  cancelled: 'Cancelado',
};

/**
 * Get status color class
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    paid: 'bg-chart-4/10 text-chart-4',
    shipped: 'bg-chart-1/10 text-chart-1',
    delivered: 'bg-success/10 text-success',
    returned: 'bg-warning/10 text-warning-foreground',
    cancelled: 'bg-destructive/10 text-destructive',
  };
  return colors[status] || 'bg-muted text-muted-foreground';
}

/**
 * Category labels
 */
export const categoryLabels: Record<string, string> = {
  Eletrônicos: 'Eletrônicos',
  Acessórios: 'Acessórios',
  Cabos: 'Cabos',
};
