import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Label } from '@/components/ui/label';
import { mockProducts, mockInventory, getInventoryBySku } from '@/lib/mockData';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Search, Plus, Package, AlertTriangle, TrendingDown, Edit, History } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Products() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showMovement, setShowMovement] = useState(false);

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = search === '' || 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = mockInventory.filter(inv => inv.available <= inv.minStock);
  const criticalItems = mockInventory.filter(inv => inv.available <= inv.minStock * 0.5);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Produtos & Estoque"
        description="Gerencie seu catálogo de produtos e controle de estoque"
        actions={
          <div className="flex gap-2">
            <Dialog open={showMovement} onOpenChange={setShowMovement}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <History className="w-4 h-4 mr-2" />
                  Movimentação
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Movimentação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Produto (SKU)</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockProducts.map(p => (
                          <SelectItem key={p.sku} value={p.sku}>
                            {p.sku} - {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de movimentação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entrada</SelectItem>
                        <SelectItem value="exit">Saída</SelectItem>
                        <SelectItem value="adjustment">Ajuste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Observação</Label>
                    <Input placeholder="Motivo da movimentação..." />
                  </div>
                  <Button className="w-full">Registrar</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastrar Produto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <Input placeholder="Ex: PROD-001" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome do Produto</Label>
                    <Input placeholder="Nome do produto" />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Eletrônicos">Eletrônicos</SelectItem>
                        <SelectItem value="Acessórios">Acessórios</SelectItem>
                        <SelectItem value="Cabos">Cabos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Custo Unitário (R$)</Label>
                    <Input type="number" step="0.01" placeholder="0,00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Estoque Mínimo</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <Button className="w-full">Cadastrar Produto</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Alerts */}
      {(lowStockItems.length > 0 || criticalItems.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {criticalItems.length > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-destructive">Estoque Crítico</p>
                <p className="text-sm text-muted-foreground">
                  {criticalItems.length} produto(s) abaixo de 50% do mínimo
                </p>
              </div>
            </div>
          )}
          {lowStockItems.length > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-warning/30 bg-warning/5">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="font-medium text-warning-foreground">Estoque Baixo</p>
                <p className="text-sm text-muted-foreground">
                  {lowStockItems.length} produto(s) no nível mínimo ou abaixo
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products" className="gap-2">
            <Package className="w-4 h-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="stock" className="gap-2">
            <TrendingDown className="w-4 h-4" />
            Estoque
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {/* Filters */}
          <div className="filter-bar">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Eletrônicos">Eletrônicos</SelectItem>
                <SelectItem value="Acessórios">Acessórios</SelectItem>
                <SelectItem value="Cabos">Cabos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Products Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Custo Unit.</th>
                  <th>Estoque</th>
                  <th>Status</th>
                  <th>Atualizado</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => {
                  const inventory = getInventoryBySku(product.sku);
                  const stockLevel = inventory ? inventory.available : 0;
                  const minStock = inventory ? inventory.minStock : 0;
                  const isCritical = stockLevel <= minStock * 0.5;
                  const isLow = stockLevel <= minStock;

                  return (
                    <tr key={product.id}>
                      <td className="font-mono text-sm">{product.sku}</td>
                      <td className="font-medium">{product.name}</td>
                      <td>
                        <Badge variant="secondary">{product.category}</Badge>
                      </td>
                      <td>{formatCurrency(product.costUnit)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-medium",
                            isCritical && "text-destructive",
                            isLow && !isCritical && "text-warning-foreground"
                          )}>
                            {stockLevel}
                          </span>
                          {inventory?.reserved ? (
                            <span className="text-xs text-muted-foreground">
                              ({inventory.reserved} reservado)
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        {isCritical ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Crítico
                          </Badge>
                        ) : isLow ? (
                          <Badge variant="outline" className="gap-1 border-warning text-warning-foreground">
                            <TrendingDown className="w-3 h-3" />
                            Baixo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 border-success text-success">
                            OK
                          </Badge>
                        )}
                      </td>
                      <td className="text-muted-foreground text-sm">
                        {formatDate(product.updatedAt)}
                      </td>
                      <td className="text-right">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          {/* Stock Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="metric-card">
              <p className="text-sm text-muted-foreground mb-1">Total de Produtos</p>
              <p className="stat-value">{mockProducts.length}</p>
            </div>
            <div className="metric-card">
              <p className="text-sm text-muted-foreground mb-1">Unidades em Estoque</p>
              <p className="stat-value">
                {mockInventory.reduce((sum, inv) => sum + inv.available, 0)}
              </p>
            </div>
            <div className="metric-card">
              <p className="text-sm text-muted-foreground mb-1">Valor em Estoque</p>
              <p className="stat-value">
                {formatCurrency(
                  mockProducts.reduce((sum, prod) => {
                    const inv = getInventoryBySku(prod.sku);
                    return sum + (inv ? inv.available * prod.costUnit : 0);
                  }, 0)
                )}
              </p>
            </div>
          </div>

          {/* Stock Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Produto</th>
                  <th>Disponível</th>
                  <th>Reservado</th>
                  <th>Mínimo</th>
                  <th>Cobertura (dias)</th>
                  <th>Giro Mensal</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mockInventory.map(inv => {
                  const product = mockProducts.find(p => p.sku === inv.sku);
                  const avgDailySales = 2.5; // Simplified calculation
                  const coverageDays = Math.round(inv.available / avgDailySales);
                  const isCritical = inv.available <= inv.minStock * 0.5;
                  const isLow = inv.available <= inv.minStock;

                  return (
                    <tr key={inv.id}>
                      <td className="font-mono text-sm">{inv.sku}</td>
                      <td className="font-medium">{product?.name || '-'}</td>
                      <td className={cn(
                        "font-medium",
                        isCritical && "text-destructive",
                        isLow && !isCritical && "text-warning-foreground"
                      )}>
                        {inv.available}
                      </td>
                      <td className="text-muted-foreground">{inv.reserved}</td>
                      <td className="text-muted-foreground">{inv.minStock}</td>
                      <td>
                        <span className={cn(
                          coverageDays < 7 && "text-destructive",
                          coverageDays < 14 && coverageDays >= 7 && "text-warning-foreground"
                        )}>
                          {coverageDays} dias
                        </span>
                      </td>
                      <td className="text-muted-foreground">~{Math.round(avgDailySales * 30)}</td>
                      <td>
                        {isCritical ? (
                          <Badge variant="destructive">Crítico</Badge>
                        ) : isLow ? (
                          <Badge variant="outline" className="border-warning text-warning-foreground">
                            Baixo
                          </Badge>
                        ) : coverageDays < 14 ? (
                          <Badge variant="outline" className="border-chart-4 text-chart-4">
                            Atenção
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-success text-success">
                            Saudável
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
