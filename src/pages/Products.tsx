import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/formatters';
import { useProducts, CreateProductInput } from '@/hooks/useProducts';
import { useIntegration } from '@/hooks/useIntegration';
import { Search, Plus, Package, AlertTriangle, TrendingDown, Edit, History, Link2, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const CATEGORIES = ['Eletrônicos', 'Acessórios', 'Cabos', 'Outros'];

export default function Products() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [editingProduct, setEditingProduct] = useState<{ id: string; sku: string; name: string; category: string; cost_unit: number; min_stock: number } | null>(null);
  const [movementForm, setMovementForm] = useState({ product_id: '', movement_type: 'entry' as 'entry' | 'exit' | 'adjustment', quantity: 0, note: '' });
  const [newProduct, setNewProduct] = useState<CreateProductInput>({ sku: '', name: '', category: 'Outros', cost_unit: 0 });
  const isMobile = useIsMobile();

  const { isConnected, isLoading: isLoadingIntegration } = useIntegration();
  const { 
    productsWithInventory, 
    products,
    isLoading, 
    createProduct, 
    updateProduct,
    deleteProduct,
    updateInventory,
    addMovement,
    isCreating, 
    isDeleting,
    isUpdating,
  } = useProducts();

  const filteredProducts = productsWithInventory.filter(product => {
    const matchesSearch = search === '' || 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = productsWithInventory.filter(p => p.inventory && p.inventory.available <= p.inventory.min_stock);
  const criticalItems = productsWithInventory.filter(p => p.inventory && p.inventory.available <= p.inventory.min_stock * 0.5);

  const handleAddProduct = () => {
    if (!newProduct.sku || !newProduct.name) return;
    createProduct(newProduct);
    setShowAddProduct(false);
    setNewProduct({ sku: '', name: '', category: 'Outros', cost_unit: 0 });
  };

  const handleEditProduct = (product: typeof productsWithInventory[0]) => {
    setEditingProduct({
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category || 'Outros',
      cost_unit: Number(product.cost_unit),
      min_stock: product.inventory?.min_stock || 10,
    });
    setShowEditProduct(true);
  };

  const handleSaveProduct = () => {
    if (!editingProduct) return;
    
    updateProduct({
      id: editingProduct.id,
      sku: editingProduct.sku,
      name: editingProduct.name,
      category: editingProduct.category,
      cost_unit: editingProduct.cost_unit,
    });

    // Update inventory min_stock if changed
    const existingProduct = productsWithInventory.find(p => p.id === editingProduct.id);
    if (existingProduct?.inventory && existingProduct.inventory.min_stock !== editingProduct.min_stock) {
      updateInventory({
        id: existingProduct.inventory.id,
        min_stock: editingProduct.min_stock,
      });
    }

    setShowEditProduct(false);
    setEditingProduct(null);
  };

  const handleAddMovement = () => {
    if (!movementForm.product_id || movementForm.quantity <= 0) return;
    addMovement(movementForm);
    setShowMovement(false);
    setMovementForm({ product_id: '', movement_type: 'entry', quantity: 0, note: '' });
  };

  if (isLoading || isLoadingIntegration) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Produtos & Estoque" description="Gerencie seu catálogo de produtos e controle de estoque" />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Produtos & Estoque" description="Gerencie seu catálogo de produtos e controle de estoque" />
        <EmptyState
          icon={Link2}
          title="Conecte sua conta do Mercado Livre"
          description="Conecte sua conta para gerenciar produtos."
          action={{ label: 'Conectar Mercado Livre', onClick: () => navigate('/integrations') }}
          className="min-h-[400px] border rounded-xl bg-card"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <PageHeader 
        title="Produtos & Estoque"
        description="Gerencie seu catálogo de produtos e controle de estoque"
        actions={
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setShowMovement(true)} className="flex-1 sm:flex-none">
              <History className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Movimentação</span>
              <span className="sm:hidden">Mov.</span>
            </Button>
            <Button onClick={() => setShowAddProduct(true)} className="flex-1 sm:flex-none">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Novo Produto</span>
              <span className="sm:hidden">Novo</span>
            </Button>
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
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Empty state */}
          {filteredProducts.length === 0 && (
            <EmptyState
              icon={Package}
              title="Nenhum produto cadastrado"
              description="Adicione produtos para gerenciar seu catálogo e estoque."
              action={{ label: 'Adicionar Produto', onClick: () => setShowAddProduct(true) }}
              className="border rounded-xl bg-card"
            />
          )}

          {/* Products - Mobile: Cards, Desktop: Table */}
          {filteredProducts.length > 0 && (
            isMobile ? (
              <div className="space-y-3">
                {filteredProducts.map(product => {
                  const stockLevel = product.inventory?.available || 0;
                  const minStock = product.inventory?.min_stock || 10;
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
                            <p className="font-medium truncate">{product.category || '-'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Custo</span>
                            <p className="font-medium">{formatCurrency(Number(product.cost_unit))}</p>
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

                        <div className="flex justify-end pt-2 border-t gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteProduct(product.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
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
                      <th className="text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(product => {
                      const stockLevel = product.inventory?.available || 0;
                      const minStock = product.inventory?.min_stock || 10;
                      const isCritical = stockLevel <= minStock * 0.5;
                      const isLow = stockLevel <= minStock;

                      return (
                        <tr key={product.id}>
                          <td className="font-mono text-sm">{product.sku}</td>
                          <td className="font-medium">{product.name}</td>
                          <td>
                            <Badge variant="secondary">{product.category || '-'}</Badge>
                          </td>
                          <td>{formatCurrency(Number(product.cost_unit))}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "font-medium",
                                isCritical && "text-destructive",
                                isLow && !isCritical && "text-warning-foreground"
                              )}>
                                {stockLevel}
                              </span>
                              {product.inventory?.reserved ? (
                                <span className="text-xs text-muted-foreground">
                                  ({product.inventory.reserved} reservado)
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
                          <td className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteProduct(product.id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          {/* Stock Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="metric-card">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total de Produtos</p>
              <p className="text-lg sm:text-2xl font-bold">{products.length}</p>
            </div>
            <div className="metric-card">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Unidades em Estoque</p>
              <p className="text-lg sm:text-2xl font-bold">
                {productsWithInventory.reduce((sum, p) => sum + (p.inventory?.available || 0), 0)}
              </p>
            </div>
            <div className="metric-card">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Valor em Estoque</p>
              <p className="text-lg sm:text-2xl font-bold">
                {formatCurrency(
                  productsWithInventory.reduce((sum, p) => {
                    const stock = p.inventory?.available || 0;
                    return sum + (stock * Number(p.cost_unit));
                  }, 0)
                )}
              </p>
            </div>
          </div>

          {/* Low stock items */}
          {lowStockItems.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Produtos com Estoque Baixo</h3>
                <div className="space-y-2">
                  {lowStockItems.map(product => (
                    <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-bold",
                          (product.inventory?.available || 0) <= (product.inventory?.min_stock || 10) * 0.5 
                            ? "text-destructive" 
                            : "text-warning-foreground"
                        )}>
                          {product.inventory?.available || 0} un.
                        </p>
                        <p className="text-xs text-muted-foreground">Mín: {product.inventory?.min_stock || 10}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Product Dialog */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar Produto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input 
                placeholder="Ex: PROD-001" 
                value={newProduct.sku}
                onChange={(e) => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Nome do Produto</Label>
              <Input 
                placeholder="Nome do produto" 
                value={newProduct.name}
                onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select 
                value={newProduct.category}
                onValueChange={(v) => setNewProduct(prev => ({ ...prev, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Custo Unitário (R$)</Label>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="0,00" 
                value={newProduct.cost_unit || ''}
                onChange={(e) => setNewProduct(prev => ({ ...prev, cost_unit: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProduct(false)}>Cancelar</Button>
            <Button onClick={handleAddProduct} disabled={isCreating}>
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={showMovement} onOpenChange={setShowMovement}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Movimentação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Produto (SKU)</Label>
              <Select 
                value={movementForm.product_id}
                onValueChange={(v) => setMovementForm(prev => ({ ...prev, product_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.sku} - {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select 
                value={movementForm.movement_type}
                onValueChange={(v: 'entry' | 'exit' | 'adjustment') => setMovementForm(prev => ({ ...prev, movement_type: v }))}
              >
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
              <Input 
                type="number" 
                placeholder="0" 
                value={movementForm.quantity || ''}
                onChange={(e) => setMovementForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Input 
                placeholder="Motivo da movimentação..."
                value={movementForm.note}
                onChange={(e) => setMovementForm(prev => ({ ...prev, note: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMovement(false)}>Cancelar</Button>
            <Button onClick={handleAddMovement}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditProduct} onOpenChange={(open) => { setShowEditProduct(open); if (!open) setEditingProduct(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input 
                  placeholder="Ex: PROD-001" 
                  value={editingProduct.sku}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, sku: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Nome do Produto</Label>
                <Input 
                  placeholder="Nome do produto" 
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select 
                  value={editingProduct.category}
                  onValueChange={(v) => setEditingProduct(prev => prev ? { ...prev, category: v } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Custo Unitário (R$)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0,00" 
                  value={editingProduct.cost_unit || ''}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, cost_unit: parseFloat(e.target.value) || 0 } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Estoque Mínimo</Label>
                <Input 
                  type="number"
                  placeholder="10" 
                  value={editingProduct.min_stock || ''}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, min_stock: parseInt(e.target.value) || 0 } : null)}
                />
                <p className="text-xs text-muted-foreground">Alerta quando o estoque atingir esse valor</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditProduct(false); setEditingProduct(null); }}>Cancelar</Button>
            <Button onClick={handleSaveProduct} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
