import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Order, FixedCost } from '@/lib/types';
import { calculateNetProfit } from '@/lib/profitCalculator';
import { formatCurrency, formatDate, formatDateTime, getStatusColor, statusLabels } from '@/lib/formatters';
import { ProfitBreakdownPanel } from '@/components/dashboard/ProfitBreakdownPanel';
import { useOrders } from '@/hooks/useOrders';
import { useCosts, FixedCost as DbFixedCost } from '@/hooks/useCosts';
import { useIntegration } from '@/hooks/useIntegration';
import { Search, Filter, Eye, Package, Truck, Receipt, Calendar, ChevronDown, ChevronUp, Link2, Loader2, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

function transformFixedCosts(dbCosts: DbFixedCost[]): FixedCost[] {
  return dbCosts.map(cost => ({
    id: cost.id,
    name: cost.name,
    category: cost.category,
    amountMonthly: Number(cost.amount_monthly),
    createdAt: new Date(cost.created_at),
  }));
}

export default function Orders() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const { isConnected, isLoading: isLoadingIntegration } = useIntegration();
  const { orders, isLoading: isLoadingOrders } = useOrders();
  const { fixedCosts: dbFixedCosts, isLoading: isLoadingCosts } = useCosts();

  const fixedCosts = useMemo(() => transformFixedCosts(dbFixedCosts), [dbFixedCosts]);

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(o => 
        o.orderIdMl.toLowerCase().includes(searchLower) ||
        o.items.some(item => 
          item.sku.toLowerCase().includes(searchLower) ||
          item.productName.toLowerCase().includes(searchLower)
        )
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === statusFilter);
    }

    return filtered;
  }, [orders, search, statusFilter]);

  const validOrdersCount = orders.filter(o => o.status !== 'cancelled' && o.status !== 'returned').length;

  const isLoading = isLoadingIntegration || isLoadingOrders || isLoadingCosts;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Pedidos" description="Gerencie e analise todos os pedidos do Mercado Livre" />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Pedidos" description="Gerencie e analise todos os pedidos do Mercado Livre" />
        <EmptyState
          icon={Link2}
          title="Conecte sua conta do Mercado Livre"
          description="Conecte sua conta para visualizar seus pedidos."
          action={{ label: 'Conectar Mercado Livre', onClick: () => navigate('/integrations') }}
          className="min-h-[400px] border rounded-xl bg-card"
        />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Pedidos" description="Gerencie e analise todos os pedidos do Mercado Livre" />
        <EmptyState
          icon={ShoppingCart}
          title="Nenhum pedido sincronizado"
          description="Sincronize seus pedidos do Mercado Livre para visualizá-los aqui."
          action={{ label: 'Ir para Integrações', onClick: () => navigate('/integrations') }}
          className="min-h-[400px] border rounded-xl bg-card"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <PageHeader 
        title="Pedidos"
        description="Gerencie e analise todos os pedidos do Mercado Livre"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, SKU ou produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="shipped">Enviado</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
            <SelectItem value="returned">Devolvido</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile: Cards View */}
      {isMobile ? (
        <div className="space-y-3">
          {filteredOrders.map(order => {
            const breakdown = calculateNetProfit(order, fixedCosts, validOrdersCount);
            const isExpanded = expandedOrder === order.id;
            
            return (
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
                      <span className="text-muted-foreground text-xs">Data</span>
                      <p className="font-medium">{formatDate(order.date)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Itens</span>
                      <p className="font-medium">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Faturamento</span>
                      <p className="font-medium">{formatCurrency(order.grossTotal)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Lucro</span>
                      <p className={cn(
                        "font-semibold",
                        breakdown.netProfit >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {formatCurrency(breakdown.netProfit)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t gap-2">
                    <span className={cn(
                      "text-sm font-medium",
                      breakdown.netMarginPercent >= 0 ? "text-success" : "text-destructive"
                    )}>
                      Margem: {breakdown.netMarginPercent.toFixed(1)}%
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="pt-3 border-t">
                      <ProfitBreakdownPanel breakdown={breakdown} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Desktop: Table View */
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Produtos</th>
                  <th>Faturamento</th>
                  <th>Taxas ML</th>
                  <th>Lucro Líquido</th>
                  <th>Margem</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const breakdown = calculateNetProfit(order, fixedCosts, validOrdersCount);
                  return (
                    <tr key={order.id}>
                      <td className="font-medium">{order.orderIdMl}</td>
                      <td className="text-muted-foreground">{formatDate(order.date)}</td>
                      <td>
                        <Badge variant="outline" className={cn("status-badge", getStatusColor(order.status))}>
                          {statusLabels[order.status]}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          {order.items.slice(0, 2).map(item => (
                            <span key={item.id} className="text-sm truncate max-w-[200px]">
                              {item.quantity}x {item.productName}
                            </span>
                          ))}
                          {order.items.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{order.items.length - 2} mais
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="font-medium">{formatCurrency(order.grossTotal)}</td>
                      <td className="text-muted-foreground">
                        <div className="flex flex-col">
                          <span>{formatCurrency(breakdown.mlFeesNet)}</span>
                          {breakdown.mlFeeDiscount > 0 && (
                            <span className="text-xs text-success">
                              -{formatCurrency(breakdown.mlFeeDiscount)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={cn(
                          "font-semibold",
                          breakdown.netProfit >= 0 ? "text-success" : "text-destructive"
                        )}>
                          {formatCurrency(breakdown.netProfit)}
                        </span>
                      </td>
                      <td>
                        <span className={cn(
                          breakdown.netMarginPercent >= 0 ? "text-success" : "text-destructive"
                        )}>
                          {breakdown.netMarginPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Detalhar
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span>Pedido {selectedOrder.orderIdMl}</span>
                  <Badge variant="outline" className={cn("status-badge", getStatusColor(selectedOrder.status))}>
                    {statusLabels[selectedOrder.status]}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 sm:space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-muted-foreground">Data:</span>
                      <p className="font-medium truncate">{formatDateTime(selectedOrder.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-muted-foreground">Frete:</span>
                      <p className="font-medium">{formatCurrency(selectedOrder.shippingTotal)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Receipt className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-muted-foreground">Taxas:</span>
                      <p className="font-medium">{formatCurrency(selectedOrder.feesTotal)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-muted-foreground">Itens:</span>
                      <p className="font-medium">{selectedOrder.items.reduce((s, i) => s + i.quantity, 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Items - Mobile: Cards, Desktop: Table */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm sm:text-base">Itens do Pedido</h4>
                  {isMobile ? (
                    <div className="space-y-2">
                      {selectedOrder.items.map(item => (
                        <Card key={item.id}>
                          <CardContent className="p-3 space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{item.productName}</p>
                                <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                              </div>
                              <span className="font-medium text-sm">x{item.quantity}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Preço</span>
                                <p className="font-medium">{formatCurrency(item.unitPrice)}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Custo</span>
                                <p className="font-medium">{formatCurrency(item.unitCost)}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Total</span>
                                <p className="font-medium">{formatCurrency((item.unitPrice - item.unitDiscount) * item.quantity)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>SKU</th>
                            <th>Produto</th>
                            <th>Qtd</th>
                            <th>Preço Unit.</th>
                            <th>Desconto</th>
                            <th>Custo Unit.</th>
                            <th>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items.map(item => (
                            <tr key={item.id}>
                              <td className="font-mono text-sm">{item.sku}</td>
                              <td>{item.productName}</td>
                              <td>{item.quantity}</td>
                              <td>{formatCurrency(item.unitPrice)}</td>
                              <td className="text-destructive">
                                {item.unitDiscount > 0 ? `-${formatCurrency(item.unitDiscount)}` : '-'}
                              </td>
                              <td className="text-muted-foreground">{formatCurrency(item.unitCost)}</td>
                              <td className="font-medium">
                                {formatCurrency((item.unitPrice - item.unitDiscount) * item.quantity)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Profit Breakdown */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm sm:text-base">Cálculo do Lucro</h4>
                  <ProfitBreakdownPanel 
                    breakdown={calculateNetProfit(selectedOrder, fixedCosts, validOrdersCount)} 
                  />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
