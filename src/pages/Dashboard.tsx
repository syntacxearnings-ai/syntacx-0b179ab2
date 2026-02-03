import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { DashboardFiltersBar } from '@/components/dashboard/DashboardFilters';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { MarginChart } from '@/components/dashboard/MarginChart';
import { TopProductsChart } from '@/components/dashboard/TopProductsChart';
import { OrdersTable } from '@/components/dashboard/OrdersTable';
import { ProfitBreakdownPanel } from '@/components/dashboard/ProfitBreakdownPanel';
import { EmptyState } from '@/components/ui/empty-state';
import { calculateAggregatedMetrics } from '@/lib/profitCalculator';
import { DashboardFilters, FixedCost } from '@/lib/types';
import { useIntegration } from '@/hooks/useIntegration';
import { useOrders } from '@/hooks/useOrders';
import { useCosts, FixedCost as DbFixedCost } from '@/hooks/useCosts';
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  ShoppingCart,
  Percent,
  Receipt,
  Truck,
  ArrowDownRight,
  RotateCcw,
  Link2,
  Loader2
} from 'lucide-react';

// Transform DB fixed costs to app format
function transformFixedCosts(dbCosts: DbFixedCost[]): FixedCost[] {
  return dbCosts.map(cost => ({
    id: cost.id,
    name: cost.name,
    category: cost.category,
    amountMonthly: Number(cost.amount_monthly),
    createdAt: new Date(cost.created_at),
  }));
}

export default function Dashboard() {
  const [filters, setFilters] = useState<DashboardFilters>({ period: 'month' });
  const { isConnected, isLoading: isLoadingIntegration } = useIntegration();
  const { orders, isLoading: isLoadingOrders } = useOrders();
  const { fixedCosts: dbFixedCosts, isLoading: isLoadingCosts } = useCosts();
  const navigate = useNavigate();

  const fixedCosts = useMemo(() => transformFixedCosts(dbFixedCosts), [dbFixedCosts]);

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

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

    filtered = filtered.filter(o => o.date >= startDate);

    if (filters.status?.length) {
      filtered = filtered.filter(o => filters.status!.includes(o.status));
    }

    if (filters.category) {
      filtered = filtered.filter(o => 
        o.items.some(item => {
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

    if (filters.sku) {
      filtered = filtered.filter(o => 
        o.items.some(item => item.sku.toLowerCase().includes(filters.sku!.toLowerCase()))
      );
    }

    return filtered;
  }, [orders, filters]);

  const metrics = useMemo(() => {
    return calculateAggregatedMetrics(filteredOrders, fixedCosts);
  }, [filteredOrders, fixedCosts]);

  const isLoading = isLoadingIntegration || isLoadingOrders || isLoadingCosts;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader 
          title="Dashboard"
          description="Visão executiva do seu negócio no Mercado Livre"
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Show empty state if not connected
  if (!isConnected) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader 
          title="Dashboard"
          description="Visão executiva do seu negócio no Mercado Livre"
        />
        
        <EmptyState
          icon={Link2}
          title="Conecte sua conta do Mercado Livre"
          description="Para visualizar seus dados reais de vendas, pedidos e lucro, conecte sua conta do Mercado Livre."
          action={{
            label: 'Conectar Mercado Livre',
            onClick: () => navigate('/integrations'),
          }}
          className="min-h-[400px] border rounded-xl bg-card"
        />
      </div>
    );
  }

  // Show empty state if no orders
  if (orders.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader 
          title="Dashboard"
          description="Visão executiva do seu negócio no Mercado Livre"
        />
        
        <EmptyState
          icon={ShoppingCart}
          title="Nenhum pedido sincronizado"
          description="Sincronize seus pedidos do Mercado Livre para ver os dados do dashboard."
          action={{
            label: 'Ir para Integrações',
            onClick: () => navigate('/integrations'),
          }}
          className="min-h-[400px] border rounded-xl bg-card"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Dashboard"
        description="Visão executiva do seu negócio no Mercado Livre"
      />

      {/* Filters */}
      <DashboardFiltersBar filters={filters} onFiltersChange={setFilters} />

      {/* KPI Cards - Row 1: Revenue & Costs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
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
          title="Taxas ML"
          value={metrics.totals.mlFeesGross}
          icon={Receipt}
        />
        <MetricCard
          title="Desc. Taxas"
          value={metrics.totals.mlFeeDiscount}
          icon={Percent}
          variant="profit"
        />
      </div>

      {/* KPI Cards - Row 2: More Costs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <MetricCard
          title="Taxas Líquidas"
          value={metrics.totals.mlFeesNet}
          icon={Receipt}
        />
        <MetricCard
          title="Frete Vendedor"
          value={metrics.totals.shippingSeller}
          icon={Truck}
        />
        <MetricCard
          title="Custos Var."
          value={metrics.totals.variableCosts}
          icon={Package}
        />
        <MetricCard
          title="Custos Fixos"
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
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
          title="Devoluções"
          value={metrics.returns + metrics.cancellations}
          format="number"
          icon={RotateCcw}
          variant={metrics.returns + metrics.cancellations > 5 ? 'loss' : 'neutral'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <RevenueChart orders={filteredOrders} fixedCosts={fixedCosts} daysBack={30} />
        <MarginChart orders={filteredOrders} fixedCosts={fixedCosts} daysBack={30} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <TopProductsChart orders={filteredOrders} metric="profit" />
        <TopProductsChart orders={filteredOrders} metric="revenue" />
      </div>

      {/* Profit Breakdown Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4">Breakdown do Período</h3>
          <ProfitBreakdownPanel breakdown={metrics.totals} />
        </div>
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Pedidos Recentes</h3>
          <OrdersTable orders={filteredOrders.slice(0, 20)} fixedCosts={fixedCosts} />
        </div>
      </div>
    </div>
  );
}
