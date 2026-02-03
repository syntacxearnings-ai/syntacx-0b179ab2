import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { mockFixedCosts, mockVariableCostConfig, mockFeeDiscounts } from '@/lib/mockData';
import { formatCurrency } from '@/lib/formatters';
import { Plus, Edit, Trash2, Building2, Package, Receipt, Percent, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Costs() {
  const [showAddFixed, setShowAddFixed] = useState(false);
  const [showAddDiscount, setShowAddDiscount] = useState(false);

  const totalFixedCosts = mockFixedCosts.reduce((sum, cost) => sum + cost.amountMonthly, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Custos"
        description="Configure custos fixos, variáveis e regras de taxas do Mercado Livre"
      />

      <Tabs defaultValue="fixed" className="space-y-6">
        <TabsList>
          <TabsTrigger value="fixed" className="gap-2">
            <Building2 className="w-4 h-4" />
            Custos Fixos
          </TabsTrigger>
          <TabsTrigger value="variable" className="gap-2">
            <Package className="w-4 h-4" />
            Custos Variáveis
          </TabsTrigger>
          <TabsTrigger value="fees" className="gap-2">
            <Receipt className="w-4 h-4" />
            Taxas ML
          </TabsTrigger>
          <TabsTrigger value="discounts" className="gap-2">
            <Percent className="w-4 h-4" />
            Descontos de Taxa
          </TabsTrigger>
        </TabsList>

        {/* Fixed Costs Tab */}
        <TabsContent value="fixed" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Total mensal: <span className="font-semibold text-foreground">{formatCurrency(totalFixedCosts)}</span>
              </p>
            </div>
            <Dialog open={showAddFixed} onOpenChange={setShowAddFixed}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Custo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Custo Fixo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input placeholder="Ex: Aluguel, Software, Contador..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                        <SelectItem value="Serviços">Serviços</SelectItem>
                        <SelectItem value="Ferramentas">Ferramentas</SelectItem>
                        <SelectItem value="Pessoal">Pessoal</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Mensal (R$)</Label>
                    <Input type="number" step="0.01" placeholder="0,00" />
                  </div>
                  <Button className="w-full">Adicionar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {mockFixedCosts.map(cost => (
              <Card key={cost.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{cost.name}</p>
                      <Badge variant="secondary" className="mt-1">{cost.category}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-xl font-bold">{formatCurrency(cost.amountMonthly)}</p>
                    <span className="text-sm text-muted-foreground">/mês</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Variable Costs Tab */}
        <TabsContent value="variable" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações de Custos Variáveis
              </CardTitle>
              <CardDescription>
                Configure os custos que variam por pedido ou percentual da receita
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Embalagem</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Por Pedido (R$)</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        defaultValue={mockVariableCostConfig.packagingPerOrder}
                        className="w-24 text-right"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Por Item Adicional (R$)</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        defaultValue={mockVariableCostConfig.packagingPerItem}
                        className="w-24 text-right"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Processamento</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Por Pedido (R$)</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        defaultValue={mockVariableCostConfig.processingPerOrder}
                        className="w-24 text-right"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Marketing/Ads</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>% sobre Receita Líquida</Label>
                      <div className="flex items-center gap-1">
                        <Input 
                          type="number" 
                          step="0.1" 
                          defaultValue={mockVariableCostConfig.adsPercentage}
                          className="w-20 text-right"
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Impostos</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>% sobre Receita</Label>
                      <div className="flex items-center gap-1">
                        <Input 
                          type="number" 
                          step="0.1" 
                          defaultValue={mockVariableCostConfig.taxPercentage}
                          className="w-20 text-right"
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button>Salvar Configurações</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ML Fees Tab */}
        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Taxas do Mercado Livre</CardTitle>
              <CardDescription>
                Configure regras de taxas por categoria e tipo de anúncio (usado quando não há valor importado do pedido)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th>Tipo Anúncio</th>
                      <th>Taxa (%)</th>
                      <th className="text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Eletrônicos</td>
                      <td><Badge variant="secondary">Clássico</Badge></td>
                      <td>12%</td>
                      <td className="text-right">
                        <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                    <tr>
                      <td>Eletrônicos</td>
                      <td><Badge variant="outline">Premium</Badge></td>
                      <td>16%</td>
                      <td className="text-right">
                        <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                    <tr>
                      <td>Acessórios</td>
                      <td><Badge variant="secondary">Clássico</Badge></td>
                      <td>11%</td>
                      <td className="text-right">
                        <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                    <tr>
                      <td>Cabos</td>
                      <td><Badge variant="secondary">Clássico</Badge></td>
                      <td>10%</td>
                      <td className="text-right">
                        <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <Button variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Regra
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fee Discounts Tab */}
        <TabsContent value="discounts" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Descontos aplicados às taxas do ML (reputação, campanhas, etc.)
            </p>
            <Dialog open={showAddDiscount} onOpenChange={setShowAddDiscount}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Desconto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Desconto de Taxa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input placeholder="Ex: Desconto Reputação Verde" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentual (%)</SelectItem>
                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input type="number" step="0.01" placeholder="0" />
                  </div>
                  <Button className="w-full">Adicionar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {mockFeeDiscounts.map(discount => (
              <Card key={discount.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      discount.isActive ? "bg-success/10" : "bg-muted"
                    )}>
                      <Percent className={cn(
                        "w-5 h-5",
                        discount.isActive ? "text-success" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <p className="font-medium">{discount.name}</p>
                      <Badge variant={discount.isActive ? "default" : "secondary"} className="mt-1">
                        {discount.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-xl font-bold">
                      {discount.type === 'percentage' ? `${discount.value}%` : formatCurrency(discount.value)}
                    </p>
                    <Switch checked={discount.isActive} />
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
