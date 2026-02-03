import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Trash2, 
  DollarSign, 
  Calculator,
  Percent,
  Package,
  Link2,
  Loader2
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { useIntegration } from '@/hooks/useIntegration';
import { useCosts, CreateFixedCostInput } from '@/hooks/useCosts';
import { useIsMobile } from '@/hooks/use-mobile';

const COST_CATEGORIES = ['Infraestrutura', 'Serviços', 'Ferramentas', 'Pessoal', 'Outros'];

export default function Costs() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isConnected, isLoading: isLoadingIntegration } = useIntegration();
  const { 
    fixedCosts, 
    variableCostsConfig, 
    totalFixedCosts,
    isLoading,
    createFixedCost,
    deleteFixedCost,
    updateVariableCostsConfig,
    isCreating,
    isDeleting,
  } = useCosts();

  const [showAddCost, setShowAddCost] = useState(false);
  const [newCost, setNewCost] = useState<CreateFixedCostInput>({
    name: '',
    category: 'Outros',
    amount_monthly: 0,
  });

  // Variable costs form state
  const [variableForm, setVariableForm] = useState({
    packaging_per_order: 2,
    packaging_per_item: 0.5,
    processing_per_order: 1.5,
    ads_percentage: 3,
    tax_percentage: 5,
  });

  // Update form when config loads
  useEffect(() => {
    if (variableCostsConfig) {
      setVariableForm({
        packaging_per_order: Number(variableCostsConfig.packaging_per_order),
        packaging_per_item: Number(variableCostsConfig.packaging_per_item),
        processing_per_order: Number(variableCostsConfig.processing_per_order),
        ads_percentage: Number(variableCostsConfig.ads_percentage),
        tax_percentage: Number(variableCostsConfig.tax_percentage),
      });
    }
  }, [variableCostsConfig]);

  const handleAddCost = () => {
    if (!newCost.name || newCost.amount_monthly <= 0) return;
    createFixedCost(newCost);
    setShowAddCost(false);
    setNewCost({ name: '', category: 'Outros', amount_monthly: 0 });
  };

  const handleDeleteCost = (id: string) => {
    deleteFixedCost(id);
  };

  const handleSaveVariableCosts = () => {
    updateVariableCostsConfig(variableForm);
  };

  if (isLoading || isLoadingIntegration) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Custos" description="Gerencie seus custos fixos e variáveis" />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Custos" description="Gerencie seus custos fixos e variáveis" />
        <EmptyState
          icon={Link2}
          title="Conecte sua conta do Mercado Livre"
          description="Conecte sua conta para configurar seus custos."
          action={{ label: 'Conectar Mercado Livre', onClick: () => navigate('/integrations') }}
          className="min-h-[400px] border rounded-xl bg-card"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Custos"
        description="Gerencie seus custos fixos e variáveis para cálculo de lucro"
        actions={
          <Button onClick={() => setShowAddCost(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Custo Fixo
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Custos Fixos/Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalFixedCosts)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4" />
              Embalagem/Pedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(variableForm.packaging_per_order)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Impostos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatPercentage(variableForm.tax_percentage)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fixed Costs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Custos Fixos Mensais
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fixedCosts.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title="Nenhum custo fixo"
                description="Adicione seus custos fixos mensais"
                action={{ label: 'Adicionar Custo', onClick: () => setShowAddCost(true) }}
              />
            ) : (
              <div className="space-y-3">
                {fixedCosts.map((cost) => (
                  <div 
                    key={cost.id} 
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{cost.name}</p>
                      <Badge variant="outline" className="text-xs mt-1">{cost.category}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatCurrency(Number(cost.amount_monthly))}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteCost(cost.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t flex justify-between">
                  <span className="font-medium">Total Mensal</span>
                  <span className="font-bold text-lg">{formatCurrency(totalFixedCosts)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Variable Costs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Custos Variáveis (por pedido)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Embalagem/Pedido (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={variableForm.packaging_per_order}
                  onChange={(e) => setVariableForm(prev => ({ ...prev, packaging_per_order: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Embalagem/Item (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={variableForm.packaging_per_item}
                  onChange={(e) => setVariableForm(prev => ({ ...prev, packaging_per_item: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Processamento/Pedido (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={variableForm.processing_per_order}
                  onChange={(e) => setVariableForm(prev => ({ ...prev, processing_per_order: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Ads (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={variableForm.ads_percentage}
                  onChange={(e) => setVariableForm(prev => ({ ...prev, ads_percentage: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Impostos (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={variableForm.tax_percentage}
                  onChange={(e) => setVariableForm(prev => ({ ...prev, tax_percentage: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <Button onClick={handleSaveVariableCosts} className="w-full">
              Salvar Custos Variáveis
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Add Cost Dialog */}
      <Dialog open={showAddCost} onOpenChange={setShowAddCost}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Custo Fixo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Aluguel, Contador, Internet..."
                value={newCost.name}
                onChange={(e) => setNewCost(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select 
                value={newCost.category} 
                onValueChange={(v) => setNewCost(prev => ({ ...prev, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COST_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor Mensal (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={newCost.amount_monthly || ''}
                onChange={(e) => setNewCost(prev => ({ ...prev, amount_monthly: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCost(false)}>Cancelar</Button>
            <Button onClick={handleAddCost} disabled={isCreating}>
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
