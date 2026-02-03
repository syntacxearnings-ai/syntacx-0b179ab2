import { useState, useMemo } from 'react';
import { Eye, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { Order, FixedCost } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatDate, getStatusColor, statusLabels } from '@/lib/formatters';
import { calculateNetProfit } from '@/lib/profitCalculator';
import { ProfitBreakdownPanel } from './ProfitBreakdownPanel';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface OrdersTableProps {
  orders: Order[];
  fixedCosts: FixedCost[];
  onViewOrder?: (order: Order) => void;
}

type SortField = 'date' | 'grossTotal' | 'netProfit';
type SortDirection = 'asc' | 'desc';

export function OrdersTable({ orders, fixedCosts, onViewOrder }: OrdersTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const isMobile = useIsMobile();
  const pageSize = isMobile ? 5 : 10;

  const ordersWithProfit = useMemo(() => {
    const validOrdersCount = orders.filter(o => o.status !== 'cancelled' && o.status !== 'returned').length;
    
    return orders.map(order => ({
      order,
      breakdown: calculateNetProfit(order, fixedCosts, validOrdersCount),
    }));
  }, [orders, fixedCosts]);

  const sortedOrders = useMemo(() => {
    return [...ordersWithProfit].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = a.order.date.getTime() - b.order.date.getTime();
          break;
        case 'grossTotal':
          comparison = a.order.grossTotal - b.order.grossTotal;
          break;
        case 'netProfit':
          comparison = a.breakdown.netProfit - b.breakdown.netProfit;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [ordersWithProfit, sortField, sortDirection]);

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedOrders.slice(start, start + pageSize);
  }, [sortedOrders, page, pageSize]);

  const totalPages = Math.ceil(sortedOrders.length / pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th 
      className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider text-xs bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={cn(
          "w-3 h-3",
          sortField === field && "text-primary"
        )} />
      </div>
    </th>
  );

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-3">
        {paginatedOrders.map(({ order, breakdown }) => (
          <Card key={order.id} className="overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{order.orderIdMl}</span>
                <Badge variant="outline" className={cn("status-badge text-xs", getStatusColor(order.status))}>
                  {statusLabels[order.status]}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Data</span>
                  <p className="font-medium">{formatDate(order.date)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Itens</span>
                  <p className="font-medium">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Faturamento</span>
                  <p className="font-medium">{formatCurrency(order.grossTotal)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Lucro</span>
                  <p className={cn(
                    "font-semibold",
                    breakdown.netProfit >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {formatCurrency(breakdown.netProfit)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className={cn(
                  "text-sm font-medium",
                  breakdown.netMarginPercent >= 0 ? "text-success" : "text-destructive"
                )}>
                  Margem: {breakdown.netMarginPercent.toFixed(1)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  {expandedOrder === order.id ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Fechar
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Detalhes
                    </>
                  )}
                </Button>
              </div>

              {expandedOrder === order.id && (
                <div className="pt-3 border-t">
                  <ProfitBreakdownPanel breakdown={breakdown} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Pagination */}
        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-muted-foreground">
            {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, sortedOrders.length)} de {sortedOrders.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Próximo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider text-xs bg-muted/50 w-10"></th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider text-xs bg-muted/50">Pedido</th>
              <SortHeader field="date">Data</SortHeader>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider text-xs bg-muted/50">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider text-xs bg-muted/50">Itens</th>
              <SortHeader field="grossTotal">Faturamento</SortHeader>
              <SortHeader field="netProfit">Lucro Líquido</SortHeader>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider text-xs bg-muted/50">Margem</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground uppercase tracking-wider text-xs bg-muted/50">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map(({ order, breakdown }) => (
              <>
                <tr key={order.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3.5 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                      {expandedOrder === order.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </td>
                  <td className="px-4 py-3.5 border-t border-border font-medium">{order.orderIdMl}</td>
                  <td className="px-4 py-3.5 border-t border-border text-muted-foreground">{formatDate(order.date)}</td>
                  <td className="px-4 py-3.5 border-t border-border">
                    <Badge variant="outline" className={cn("status-badge", getStatusColor(order.status))}>
                      {statusLabels[order.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 border-t border-border text-muted-foreground">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} itens
                  </td>
                  <td className="px-4 py-3.5 border-t border-border font-medium">
                    {formatCurrency(order.grossTotal)}
                  </td>
                  <td className="px-4 py-3.5 border-t border-border">
                    <span className={cn(
                      "font-semibold",
                      breakdown.netProfit >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {formatCurrency(breakdown.netProfit)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 border-t border-border">
                    <span className={cn(
                      "text-sm",
                      breakdown.netMarginPercent >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {breakdown.netMarginPercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3.5 border-t border-border text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewOrder?.(order)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
                {expandedOrder === order.id && (
                  <tr>
                    <td colSpan={9} className="p-4 bg-muted/20 border-t border-border">
                      <div className="max-w-lg">
                        <ProfitBreakdownPanel breakdown={breakdown} />
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Mostrando {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, sortedOrders.length)} de {sortedOrders.length} pedidos
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
