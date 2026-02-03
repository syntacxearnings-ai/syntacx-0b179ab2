import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { mockOrders, mockFixedCosts } from '@/lib/mockData';
import { Order } from '@/lib/types';
import { calculateNetProfit } from '@/lib/profitCalculator';
import { formatCurrency, formatDate, formatDateTime, getStatusColor, statusLabels } from '@/lib/formatters';
import { ProfitBreakdownPanel } from '@/components/dashboard/ProfitBreakdownPanel';
import { Search, Filter, Eye, Package, Truck, Receipt, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Orders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = useMemo(() => {
    let orders = [...mockOrders];

    if (search) {
      const searchLower = search.toLowerCase();
      orders = orders.filter(o => 
        o.orderIdMl.toLowerCase().includes(searchLower) ||
        o.items.some(item => 
          item.sku.toLowerCase().includes(searchLower) ||
          item.productName.toLowerCase().includes(searchLower)
        )
      );
    }

    if (statusFilter !== 'all') {
      orders = orders.filter(o => o.status === statusFilter);
    }

    return orders;
  }, [search, statusFilter]);

  const validOrdersCount = mockOrders.filter(o => o.status !== 'cancelled' && o.status !== 'returned').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Pedidos"
        description="Gerencie e analise todos os pedidos do Mercado Livre"
      />

      {/* Filters */}
      <div className="filter-bar">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, SKU ou produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
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

      {/* Orders Table */}
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
                const breakdown = calculateNetProfit(order, mockFixedCosts, validOrdersCount);
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
                      <div className="flex flex-col gap-0.5">
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

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span>Pedido {selectedOrder.orderIdMl}</span>
                  <Badge variant="outline" className={cn("status-badge", getStatusColor(selectedOrder.status))}>
                    {statusLabels[selectedOrder.status]}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Data:</span>
                    <span className="font-medium">{formatDateTime(selectedOrder.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Frete:</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.shippingTotal)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Receipt className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Taxas:</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.feesTotal)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Itens:</span>
                    <span className="font-medium">{selectedOrder.items.reduce((s, i) => s + i.quantity, 0)}</span>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="font-semibold mb-3">Itens do Pedido</h4>
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
                </div>

                {/* Profit Breakdown */}
                <div>
                  <h4 className="font-semibold mb-3">Cálculo do Lucro</h4>
                  <ProfitBreakdownPanel 
                    breakdown={calculateNetProfit(selectedOrder, mockFixedCosts, validOrdersCount)} 
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
