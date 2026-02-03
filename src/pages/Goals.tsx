import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockGoals, mockOrders, mockFixedCosts } from '@/lib/mockData';
import { calculateAggregatedMetrics } from '@/lib/profitCalculator';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { Plus, Target, TrendingUp, DollarSign, ShoppingCart, Percent, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Goals() {
  const [showAddGoal, setShowAddGoal] = useState(false);

  // Calculate current progress
  const currentDate = new Date();
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const daysInMonth = monthEnd.getDate();
  const daysPassed = currentDate.getDate();

  const monthlyOrders = mockOrders.filter(o => o.date >= monthStart && o.date <= currentDate);
  const monthlyMetrics = calculateAggregatedMetrics(monthlyOrders, mockFixedCosts);

  const monthlyGoal = mockGoals.find(g => g.period === 'monthly');
  const weeklyGoal = mockGoals.find(g => g.period === 'weekly');

  const calculateProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const calculateProjection = (current: number, daysPassed: number, totalDays: number) => {
    if (daysPassed === 0) return current;
    return (current / daysPassed) * totalDays;
  };

  interface GoalCardProps {
    title: string;
    current: number;
    target: number;
    format: 'currency' | 'percentage' | 'number';
    icon: React.ElementType;
    daysPassed: number;
    totalDays: number;
  }

  const GoalCard = ({ title, current, target, format, icon: Icon, daysPassed, totalDays }: GoalCardProps) => {
    const progress = calculateProgress(current, target);
    const projection = calculateProjection(current, daysPassed, totalDays);
    const isOnTrack = projection >= target;
    const expectedProgress = (daysPassed / totalDays) * 100;
    const isAhead = progress > expectedProgress;

    const formatValue = (val: number) => {
      if (format === 'currency') return formatCurrency(val);
      if (format === 'percentage') return formatPercentage(val);
      return val.toLocaleString('pt-BR');
    };

    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                isOnTrack ? "bg-success/10" : "bg-warning/10"
              )}>
                <Icon className={cn(
                  "w-5 h-5",
                  isOnTrack ? "text-success" : "text-warning"
                )} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className="text-2xl font-bold">{formatValue(current)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Meta</p>
              <p className="font-semibold">{formatValue(target)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className={cn(
                "font-medium",
                isAhead ? "text-success" : "text-warning-foreground"
              )}>
                {progress.toFixed(1)}% completo
              </span>
              <span className="text-muted-foreground">
                Esperado: {expectedProgress.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={progress} 
              className="h-2"
            />
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Projeção</span>
              <span className={cn(
                "font-medium",
                isOnTrack ? "text-success" : "text-warning-foreground"
              )}>
                {formatValue(projection)}
                {isOnTrack ? ' ✓' : ' ⚠'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Metas"
        description="Acompanhe o progresso das suas metas de vendas e lucro"
        actions={
          <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Definir Nova Meta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Meta de Faturamento (R$)</Label>
                  <Input type="number" step="100" placeholder="0,00" />
                </div>
                <div className="space-y-2">
                  <Label>Meta de Lucro (R$)</Label>
                  <Input type="number" step="100" placeholder="0,00" />
                </div>
                <div className="space-y-2">
                  <Label>Meta de Margem (%)</Label>
                  <Input type="number" step="0.5" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Meta de Pedidos</Label>
                  <Input type="number" placeholder="0" />
                </div>
                <Button className="w-full">Salvar Meta</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Period Info */}
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="font-medium">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
            <p className="text-sm text-muted-foreground">
              Dia {daysPassed} de {daysInMonth} ({((daysPassed / daysInMonth) * 100).toFixed(0)}% do mês)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Goals */}
      {monthlyGoal && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5" />
            Metas Mensais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <GoalCard
              title="Faturamento"
              current={monthlyMetrics.totals.grossRevenue}
              target={monthlyGoal.revenueGoal}
              format="currency"
              icon={DollarSign}
              daysPassed={daysPassed}
              totalDays={daysInMonth}
            />
            <GoalCard
              title="Lucro Líquido"
              current={monthlyMetrics.totals.netProfit}
              target={monthlyGoal.profitGoal}
              format="currency"
              icon={TrendingUp}
              daysPassed={daysPassed}
              totalDays={daysInMonth}
            />
            <GoalCard
              title="Margem Líquida"
              current={monthlyMetrics.totals.netMarginPercent}
              target={monthlyGoal.marginGoal}
              format="percentage"
              icon={Percent}
              daysPassed={daysPassed}
              totalDays={daysInMonth}
            />
            <GoalCard
              title="Pedidos"
              current={monthlyMetrics.ordersCount}
              target={monthlyGoal.ordersGoal}
              format="number"
              icon={ShoppingCart}
              daysPassed={daysPassed}
              totalDays={daysInMonth}
            />
          </div>
        </div>
      )}

      {/* Weekly Goals */}
      {weeklyGoal && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5" />
            Metas Semanais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <GoalCard
              title="Faturamento"
              current={monthlyMetrics.totals.grossRevenue * 0.25}
              target={weeklyGoal.revenueGoal}
              format="currency"
              icon={DollarSign}
              daysPassed={Math.min(daysPassed, 7)}
              totalDays={7}
            />
            <GoalCard
              title="Lucro Líquido"
              current={monthlyMetrics.totals.netProfit * 0.25}
              target={weeklyGoal.profitGoal}
              format="currency"
              icon={TrendingUp}
              daysPassed={Math.min(daysPassed, 7)}
              totalDays={7}
            />
            <GoalCard
              title="Margem Líquida"
              current={monthlyMetrics.totals.netMarginPercent}
              target={weeklyGoal.marginGoal}
              format="percentage"
              icon={Percent}
              daysPassed={Math.min(daysPassed, 7)}
              totalDays={7}
            />
            <GoalCard
              title="Pedidos"
              current={Math.round(monthlyMetrics.ordersCount * 0.25)}
              target={weeklyGoal.ordersGoal}
              format="number"
              icon={ShoppingCart}
              daysPassed={Math.min(daysPassed, 7)}
              totalDays={7}
            />
          </div>
        </div>
      )}

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Performance</CardTitle>
          <CardDescription>
            Análise do período atual comparado com as metas definidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Média Diária (Faturamento)</p>
              <p className="text-2xl font-bold">
                {formatCurrency(monthlyMetrics.totals.grossRevenue / daysPassed)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Necessário: {formatCurrency(monthlyGoal ? (monthlyGoal.revenueGoal - monthlyMetrics.totals.grossRevenue) / (daysInMonth - daysPassed) : 0)}/dia
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Média Diária (Lucro)</p>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(monthlyMetrics.totals.netProfit / daysPassed)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Necessário: {formatCurrency(monthlyGoal ? (monthlyGoal.profitGoal - monthlyMetrics.totals.netProfit) / (daysInMonth - daysPassed) : 0)}/dia
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Pedidos por Dia</p>
              <p className="text-2xl font-bold">
                {(monthlyMetrics.ordersCount / daysPassed).toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Necessário: {monthlyGoal ? ((monthlyGoal.ordersGoal - monthlyMetrics.ordersCount) / (daysInMonth - daysPassed)).toFixed(1) : 0}/dia
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
