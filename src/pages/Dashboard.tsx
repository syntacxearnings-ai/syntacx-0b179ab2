import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { DashboardFiltersBar } from '@/components/dashboard/DashboardFilters';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { MarginChart } from '@/components/dashboard/MarginChart';
import { TopProductsChart } from '@/components/dashboard/TopProductsChart';
import { OrdersTable } from '@/components/dashboard/OrdersTable';
import { ProfitBreakdownPanel } from '@/components/dashboard/ProfitBreakdownPanel';
import { mockOrders, mockFixedCosts } from '@/lib/mockData';
import { calculateAggregatedMetrics } from '@/lib/profitCalculator';
import { DashboardFilters } from '@/lib/types';
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  ShoppingCart,
  Percent,
  Receipt,
  Truck,
  ArrowDownRight,
  RotateCcw
} from 'lucide-react';

export default function Dashboard() {
  const [filters, setFilters] = useState<DashboardFilters>({ period: 'month' });

  const filteredOrders = useMemo(() => {
    let orders = [...mockOrders];

    // Filter by period
    const now = new Date();
    let startDate: Date;

    switch (filters.period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    orders = orders.filter(o => o.date >= startDate);

    // Filter by status
    if (filters.status?.length) {
      orders = orders.filter(o => filters.status!.includes(o.status));
    }

    // Filter by category
    if (filters.category) {
      orders = orders.filter(o => 
        o.items.some(item => {
          // Simplified category matching based on product name
          const name = item.productName.toLowerCase();
          if (filters.category === 'Eletrônicos') {
            return name.includes('fone') || name.includes('carregador') || name.includes('power') || name.includes('alto-falante');
          }
          if (filters.category === 'Acessórios') {
            return name.includes('capinha') || name.includes('película') || name.includes('suporte');
          }
          if (filters.category === 'Cabos') {
            return name.includes('cabo');
          }
          return true;
        })
      );
    }

    // Filter by SKU
    if (filters.sku) {
      orders = orders.filter(o => 
        o.items.some(item => item.sku.toLowerCase().includes(filters.sku!.toLowerCase()))
      );
    }

    return orders;
  }, [filters]);

  const metrics = useMemo(() => {
    return calculateAggregatedMetrics(filteredOrders, mockFixedCosts);
  }, [filteredOrders]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Dashboard"
        description="Visão executiva do seu negócio no Mercado Livre"
      />

      {/* Filters */}
      <DashboardFiltersBar filters={filters} onFiltersChange={setFilters} />

      {/* KPI Cards - Row 1: Revenue & Costs */}
      <div className="kpi-grid">
        <MetricCard
          title="Faturamento Bruto"
          value={metrics.totals.grossRevenue}
          icon={DollarSign}
          variant="neutral"
        />
        <MetricCard
          title="Receita Líquida"
          value={metrics.totals.netRevenue}
          icon={ArrowDownRight}
          variant="neutral"
        />
        <MetricCard
          title="COGS"
          value={metrics.totals.cogs}
          icon={Package}
        />
        <MetricCard
          title="Taxas ML (brutas)"
          value={metrics.totals.mlFeesGross}
          icon={Receipt}
        />
        <MetricCard
          title="Desconto Taxas ML"
          value={metrics.totals.mlFeeDiscount}
          icon={Percent}
          variant="profit"
        />
      </div>

      {/* KPI Cards - Row 2: More Costs */}
      <div className="kpi-grid">
        <MetricCard
          title="Taxas ML (líquidas)"
          value={metrics.totals.mlFeesNet}
          icon={Receipt}
        />
        <MetricCard
          title="Frete Vendedor"
          value={metrics.totals.shippingSeller}
          icon={Truck}
        />
        <MetricCard
          title="Custos Variáveis"
          value={metrics.totals.variableCosts}
          icon={Package}
        />
        <MetricCard
          title="Custos Fixos (rateio)"
          value={metrics.totals.fixedCostsAllocation}
          icon={Package}
        />
        <MetricCard
          title="Lucro Líquido"
          value={metrics.totals.netProfit}
          icon={TrendingUp}
          variant={metrics.totals.netProfit >= 0 ? 'profit' : 'loss'}
        />
      </div>

      {/* KPI Cards - Row 3: Operations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Margem Líquida"
          value={metrics.totals.netMarginPercent}
          format="percentage"
          icon={Percent}
          variant={metrics.totals.netMarginPercent >= 10 ? 'profit' : metrics.totals.netMarginPercent >= 0 ? 'neutral' : 'loss'}
        />
        <MetricCard
          title="Pedidos"
          value={metrics.ordersCount}
          format="number"
          icon={ShoppingCart}
        />
        <MetricCard
          title="Itens Vendidos"
          value={metrics.itemsSold}
          format="number"
          icon={Package}
        />
        <MetricCard
          title="Ticket Médio"
          value={metrics.avgTicket}
          icon={DollarSign}
        />
        <MetricCard
          title="Devoluções/Cancelamentos"
          value={metrics.returns + metrics.cancellations}
          format="number"
          icon={RotateCcw}
          variant={metrics.returns + metrics.cancellations > 5 ? 'loss' : 'neutral'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart orders={filteredOrders} daysBack={30} />
        <MarginChart orders={filteredOrders} daysBack={30} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProductsChart orders={filteredOrders} metric="profit" />
        <TopProductsChart orders={filteredOrders} metric="revenue" />
      </div>

      {/* Profit Breakdown Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4">Breakdown do Período</h3>
          <ProfitBreakdownPanel breakdown={metrics.totals} />
        </div>
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Pedidos Recentes</h3>
          <OrdersTable orders={filteredOrders.slice(0, 20)} />
        </div>
      </div>
    </div>
  );
}
