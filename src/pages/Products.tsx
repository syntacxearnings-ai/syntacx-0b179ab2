import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { useIsMobile } from '@/hooks/use-mobile';

export default function Products() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const isMobile = useIsMobile();

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
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <PageHeader 
        title="Produtos & Estoque"
        description="Gerencie seu catálogo de produtos e controle de estoque"
        actions={
          <div className="flex gap-2 w-full sm:w-auto">
            <Dialog open={showMovement} onOpenChange={setShowMovement}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 sm:flex-none">
                  <History className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Movimentação</span>
                  <span className="sm:hidden">Mov.</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
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
                <Button className="flex-1 sm:flex-none">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Novo Produto</span>
                  <span className="sm:hidden">Novo</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {criticalItems.length > 0 && (
            <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-destructive/30 bg-destructive/5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-destructive text-sm sm:text-base">Estoque Crítico</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {criticalItems.length} produto(s) abaixo de 50% do mínimo
                </p>
              </div>
            </div>
          )}
          {lowStockItems.length > 0 && (
            <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-warning/30 bg-warning/5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-warning-foreground text-sm sm:text-base">Estoque Baixo</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {lowStockItems.length} produto(s) no nível mínimo ou abaixo
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="products" className="gap-2 flex-1 sm:flex-none">
            <Package className="w-4 h-4" />
            <span>Produtos</span>
          </TabsTrigger>
          <TabsTrigger value="stock" className="gap-2 flex-1 sm:flex-none">
            <TrendingDown className="w-4 h-4" />
            <span>Estoque</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
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

          {/* Products - Mobile: Cards, Desktop: Table */}
          {isMobile ? (
            <div className="space-y-3">
              {filteredProducts.map(product => {
                const inventory = getInventoryBySku(product.sku);
                const stockLevel = inventory ? inventory.available : 0;
                const minStock = inventory ? inventory.minStock : 0;
                const isCritical = stockLevel <= minStock * 0.5;
                const isLow = stockLevel <= minStock;

                return (
                  <Card key={product.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                        </div>
                        {isCritical ? (
                          <Badge variant="destructive" className="gap-1 flex-shrink-0">
                            <AlertTriangle className="w-3 h-3" />
                            Crítico
                          </Badge>
                        ) : isLow ? (
                          <Badge variant="outline" className="gap-1 border-warning text-warning-foreground flex-shrink-0">
                            Baixo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-success text-success flex-shrink-0">
                            OK
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Categoria</span>
                          <p className="font-medium truncate">{product.category}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Custo</span>
                          <p className="font-medium">{formatCurrency(product.costUnit)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Estoque</span>
                          <p className={cn(
                            "font-medium",
                            isCritical && "text-destructive",
                            isLow && !isCritical && "text-warning-foreground"
                          )}>
                            {stockLevel}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2 border-t">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
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
          )}
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          {/* Stock Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="metric-card">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total de Produtos</p>
              <p className="text-lg sm:text-2xl font-bold">{mockProducts.length}</p>
            </div>
            <div className="metric-card">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Unidades em Estoque</p>
              <p className="text-lg sm:text-2xl font-bold">
                {mockInventory.reduce((sum, inv) => sum + inv.available, 0)}
              </p>
            </div>
            <div className="metric-card">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Valor em Estoque</p>
              <p className="text-lg sm:text-2xl font-bold">
                {formatCurrency(
                  mockProducts.reduce((sum, prod) => {
                    const inv = getInventoryBySku(prod.sku);
                    return sum + (inv ? inv.available * prod.costUnit : 0);
                  }, 0)
                )}
              </p>
            </div>
          </div>

          {/* Stock - Mobile: Cards, Desktop: Table */}
          {isMobile ? (
            <div className="space-y-3">
              {mockInventory.map(inv => {
                const product = mockProducts.find(p => p.sku === inv.sku);
                const avgDailySales = 2.5;
                const coverageDays = Math.round(inv.available / avgDailySales);
                const isCritical = inv.available <= inv.minStock * 0.5;
                const isLow = inv.available <= inv.minStock;

                return (
                  <Card key={inv.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{product?.name || '-'}</p>
                          <p className="text-xs text-muted-foreground font-mono">{inv.sku}</p>
                        </div>
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
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Disp.</span>
                          <p className={cn(
                            "font-medium",
                            isCritical && "text-destructive",
                            isLow && !isCritical && "text-warning-foreground"
                          )}>
                            {inv.available}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Res.</span>
                          <p className="font-medium">{inv.reserved}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Mín.</span>
                          <p className="font-medium">{inv.minStock}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Cobert.</span>
                          <p className={cn(
                            "font-medium",
                            coverageDays < 7 && "text-destructive",
                            coverageDays < 14 && coverageDays >= 7 && "text-warning-foreground"
                          )}>
                            {coverageDays}d
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
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
                    const avgDailySales = 2.5;
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
