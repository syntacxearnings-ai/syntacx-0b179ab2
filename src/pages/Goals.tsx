import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/empty-state';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Target,
  TrendingUp,
  DollarSign,
  Percent,
  ShoppingCart,
  Trash2,
  Link2,
  Loader2
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { useIntegration } from '@/hooks/useIntegration';
import { useGoals, CreateGoalInput, Goal } from '@/hooks/useGoals';
import { useOrders } from '@/hooks/useOrders';
import { useCosts, FixedCost as DbFixedCost } from '@/hooks/useCosts';
import { calculateAggregatedMetrics } from '@/lib/profitCalculator';
import { FixedCost } from '@/lib/types';
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

export default function Goals() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isConnected, isLoading: isLoadingIntegration } = useIntegration();
  const { monthlyGoals, weeklyGoals, isLoading, createGoal, deleteGoal, isCreating, isDeleting } = useGoals();
  const { orders } = useOrders();
  const { fixedCosts: dbFixedCosts } = useCosts();

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState<CreateGoalInput>({
    period: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    revenue_goal: 0,
    profit_goal: 0,
    margin_goal: 0,
    orders_goal: 0,
  });

  const fixedCosts = useMemo(() => transformFixedCosts(dbFixedCosts), [dbFixedCosts]);

  // Calculate current progress
  const currentMetrics = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const monthlyOrders = orders.filter(o => o.date >= monthStart);
    const weeklyOrders = orders.filter(o => o.date >= weekStart);

    return {
      monthly: calculateAggregatedMetrics(monthlyOrders, fixedCosts),
      weekly: calculateAggregatedMetrics(weeklyOrders, fixedCosts),
    };
  }, [orders, fixedCosts]);

  const handleAddGoal = () => {
    if (newGoal.revenue_goal <= 0) return;
    createGoal(newGoal);
    setShowAddGoal(false);
    setNewGoal({
      period: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
      revenue_goal: 0,
      profit_goal: 0,
      margin_goal: 0,
      orders_goal: 0,
    });
  };

  const handleDeleteGoal = (id: string) => {
    deleteGoal(id);
  };

  const getProgress = (current: number, goal: number) => {
    if (goal <= 0) return 0;
    return Math.min(100, (current / goal) * 100);
  };

  const GoalCard = ({ goal, metrics }: { goal: Goal; metrics: typeof currentMetrics.monthly }) => {
    const revenueProgress = getProgress(metrics.totals.netRevenue, goal.revenue_goal);
    const profitProgress = getProgress(metrics.totals.netProfit, goal.profit_goal);
    const marginProgress = getProgress(metrics.totals.netMarginPercent, goal.margin_goal);
    const ordersProgress = getProgress(metrics.ordersCount, goal.orders_goal);

    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4" />
              {goal.period === 'monthly' ? 'Meta Mensal' : 'Meta Semanal'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => handleDeleteGoal(goal.id)} disabled={isDeleting}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Revenue */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Receita
              </span>
              <span>{formatCurrency(metrics.totals.netRevenue)} / {formatCurrency(goal.revenue_goal)}</span>
            </div>
            <Progress value={revenueProgress} className="h-2" />
          </div>

          {/* Profit */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Lucro
              </span>
              <span>{formatCurrency(metrics.totals.netProfit)} / {formatCurrency(goal.profit_goal)}</span>
            </div>
            <Progress value={profitProgress} className="h-2" />
          </div>

          {/* Margin */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <Percent className="w-3 h-3" /> Margem
              </span>
              <span>{formatPercentage(metrics.totals.netMarginPercent)} / {formatPercentage(goal.margin_goal)}</span>
            </div>
            <Progress value={marginProgress} className="h-2" />
          </div>

          {/* Orders */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <ShoppingCart className="w-3 h-3" /> Pedidos
              </span>
              <span>{metrics.ordersCount} / {goal.orders_goal}</span>
            </div>
            <Progress value={ordersProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading || isLoadingIntegration) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Metas" description="Defina e acompanhe suas metas de vendas" />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Metas" description="Defina e acompanhe suas metas de vendas" />
        <EmptyState
          icon={Link2}
          title="Conecte sua conta do Mercado Livre"
          description="Conecte sua conta para definir metas."
          action={{ label: 'Conectar Mercado Livre', onClick: () => navigate('/integrations') }}
          className="min-h-[400px] border rounded-xl bg-card"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Metas"
        description="Defina e acompanhe suas metas de vendas"
        actions={
          <Button onClick={() => setShowAddGoal(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Nova Meta
          </Button>
        }
      />

      {/* Monthly Goals */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Metas Mensais</h2>
        {monthlyGoals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Nenhuma meta mensal"
            description="Crie uma meta mensal para acompanhar seu progresso"
            action={{ label: 'Criar Meta', onClick: () => setShowAddGoal(true) }}
            className="border rounded-xl bg-card"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {monthlyGoals.map(goal => (
              <GoalCard key={goal.id} goal={goal} metrics={currentMetrics.monthly} />
            ))}
          </div>
        )}
      </div>

      {/* Weekly Goals */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Metas Semanais</h2>
        {weeklyGoals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Nenhuma meta semanal"
            description="Crie uma meta semanal para acompanhar seu progresso"
            action={{ label: 'Criar Meta', onClick: () => { setNewGoal(prev => ({ ...prev, period: 'weekly' })); setShowAddGoal(true); } }}
            className="border rounded-xl bg-card"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {weeklyGoals.map(goal => (
              <GoalCard key={goal.id} goal={goal} metrics={currentMetrics.weekly} />
            ))}
          </div>
        )}
      </div>

      {/* Add Goal Dialog */}
      <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select 
                value={newGoal.period} 
                onValueChange={(v: 'weekly' | 'monthly') => setNewGoal(prev => ({ ...prev, period: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={newGoal.start_date}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={newGoal.end_date}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Meta Receita (R$)</Label>
                <Input
                  type="number"
                  value={newGoal.revenue_goal || ''}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, revenue_goal: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Meta Lucro (R$)</Label>
                <Input
                  type="number"
                  value={newGoal.profit_goal || ''}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, profit_goal: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Meta Margem (%)</Label>
                <Input
                  type="number"
                  value={newGoal.margin_goal || ''}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, margin_goal: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Meta Pedidos</Label>
                <Input
                  type="number"
                  value={newGoal.orders_goal || ''}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, orders_goal: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddGoal(false)}>Cancelar</Button>
            <Button onClick={handleAddGoal} disabled={isCreating}>
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Criar Meta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
