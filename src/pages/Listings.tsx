import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useListings, MLListing } from '@/hooks/useListings';
import { useIntegration } from '@/hooks/useIntegration';
import { useSync } from '@/hooks/useSync';
import { useListingActions } from '@/hooks/useListingActions';
import { formatCurrency } from '@/lib/formatters';
import { 
  Package, 
  Search, 
  ExternalLink, 
  RefreshCw, 
  Link2, 
  Loader2,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Filter,
  MoreHorizontal,
  Play,
  Pause,
  Ban,
  DollarSign,
  Boxes,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Listings() {
  const navigate = useNavigate();
  const { listings, getVariationsForListing, isLoading, stats, refetch } = useListings();
  const { isConnected, isLoading: isLoadingIntegration } = useIntegration();
  const { sync, isLoading: isSyncing, progress } = useSync();
  const { pauseListings, activateListings, closeListings, updatePrice, updateStock, isLoading: isActioning } = useListingActions();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [selectedListing, setSelectedListing] = useState<MLListing | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Dialogs
  const [confirmAction, setConfirmAction] = useState<{ action: 'pause' | 'activate' | 'close'; itemIds: string[] } | null>(null);
  const [priceDialog, setPriceDialog] = useState<{ listing: MLListing } | null>(null);
  const [stockDialog, setStockDialog] = useState<{ listing: MLListing } | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');

  const filteredListings = useMemo(() => {
    return listings.filter(listing => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch = 
          listing.title.toLowerCase().includes(searchLower) ||
          listing.item_id.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && listing.status !== statusFilter) {
        return false;
      }

      // Stock filter
      if (stockFilter === 'with_stock' && listing.available_quantity === 0) {
        return false;
      }
      if (stockFilter === 'without_stock' && listing.available_quantity > 0) {
        return false;
      }

      return true;
    });
  }, [listings, search, statusFilter, stockFilter]);

  // Selection helpers
  const allFilteredSelected = filteredListings.length > 0 && filteredListings.every(l => selectedIds.has(l.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredListings.map(l => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Get ML item IDs for selected listings
  const getSelectedItemIds = (): string[] => {
    return listings
      .filter(l => selectedIds.has(l.id))
      .map(l => l.item_id);
  };

  const handleSync = () => {
    sync(false);
  };

  const handleBulkAction = (action: 'pause' | 'activate' | 'close') => {
    const itemIds = getSelectedItemIds();
    if (itemIds.length === 0) return;
    setConfirmAction({ action, itemIds });
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    
    const { action, itemIds } = confirmAction;
    
    try {
      if (action === 'pause') {
        await pauseListings(itemIds);
      } else if (action === 'activate') {
        await activateListings(itemIds);
      } else if (action === 'close') {
        await closeListings(itemIds);
      }
      setSelectedIds(new Set());
      refetch();
    } finally {
      setConfirmAction(null);
    }
  };

  const handleUpdatePrice = async () => {
    if (!priceDialog || !newPrice) return;
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) return;
    
    await updatePrice(priceDialog.listing.item_id, price);
    setPriceDialog(null);
    setNewPrice('');
    refetch();
  };

  const handleUpdateStock = async () => {
    if (!stockDialog || !newStock) return;
    const qty = parseInt(newStock);
    if (isNaN(qty) || qty < 0) return;
    
    await updateStock(stockDialog.listing.item_id, qty);
    setStockDialog(null);
    setNewStock('');
    refetch();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-primary/10 text-primary border-primary/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Ativo
          </Badge>
        );
      case 'paused':
        return (
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            <PauseCircle className="w-3 h-3 mr-1" />
            Pausado
          </Badge>
        );
      case 'closed':
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <XCircle className="w-3 h-3 mr-1" />
            Fechado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) {
      return (
        <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/30">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Sem estoque
        </Badge>
      );
    }
    if (quantity <= 5) {
      return (
        <Badge className="bg-warning/10 text-warning-foreground border-warning/30">
          {quantity} unid.
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-foreground">
        {quantity} unid.
      </Badge>
    );
  };

  const getActionLabel = (action: 'pause' | 'activate' | 'close') => {
    switch (action) {
      case 'pause': return 'Pausar';
      case 'activate': return 'Ativar';
      case 'close': return 'Encerrar';
    }
  };

  // Loading state
  if (isLoading || isLoadingIntegration) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader 
          title="Anúncios"
          description="Gerencie seus anúncios do Mercado Livre"
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Not connected
  if (!isConnected) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader 
          title="Anúncios"
          description="Gerencie seus anúncios do Mercado Livre"
        />
        <EmptyState
          icon={Link2}
          title="Conecte sua conta do Mercado Livre"
          description="Para visualizar seus anúncios, conecte sua conta do Mercado Livre."
          action={{
            label: 'Conectar Mercado Livre',
            onClick: () => navigate('/integrations'),
          }}
          className="min-h-[400px] border rounded-xl bg-card"
        />
      </div>
    );
  }

  // Empty state
  if (listings.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader 
          title="Anúncios"
          description="Gerencie seus anúncios do Mercado Livre"
        />
        <EmptyState
          icon={Package}
          title="Nenhum anúncio encontrado"
          description="Sincronize seus dados para importar os anúncios do Mercado Livre."
          action={{
            label: 'Sincronizar agora',
            onClick: handleSync,
          }}
          className="min-h-[400px] border rounded-xl bg-card"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Anúncios"
        description="Gerencie seus anúncios do Mercado Livre"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-primary">{stats.active}</p>
          <p className="text-xs text-muted-foreground">Ativos</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-muted-foreground">{stats.paused}</p>
          <p className="text-xs text-muted-foreground">Pausados</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold">{stats.closed}</p>
          <p className="text-xs text-muted-foreground">Fechados</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-primary">{stats.withStock}</p>
          <p className="text-xs text-muted-foreground">Com estoque</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-destructive">{stats.withoutStock}</p>
          <p className="text-xs text-muted-foreground">Sem estoque</p>
        </Card>
      </div>

      {/* Filters & Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            {/* Search and Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título ou ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="paused">Pausados</SelectItem>
                  <SelectItem value="closed">Fechados</SelectItem>
                </SelectContent>
              </Select>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Estoque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="with_stock">Com estoque</SelectItem>
                  <SelectItem value="without_stock">Sem estoque</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={handleSync}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {isSyncing ? progress || 'Sincronizando...' : 'Sincronizar'}
              </Button>
            </div>

            {/* Bulk Actions Row */}
            {someSelected && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                <span className="text-sm font-medium">
                  {selectedIds.size} selecionado(s)
                </span>
                <div className="flex gap-2 ml-auto">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkAction('activate')}
                    disabled={isActioning}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Ativar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkAction('pause')}
                    disabled={isActioning}
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Pausar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkAction('close')}
                    disabled={isActioning}
                    className="text-destructive hover:text-destructive"
                  >
                    <Ban className="w-4 h-4 mr-1" />
                    Encerrar
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Listings Table (Desktop) */}
      <div className="hidden md:block">
        <Card>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <Checkbox 
                      checked={allFilteredSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Selecionar todos"
                    />
                  </th>
                  <th>Anúncio</th>
                  <th>Status</th>
                  <th>Estoque</th>
                  <th>Vendidos</th>
                  <th>Preço</th>
                  <th>Tipo</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.map((listing) => (
                  <tr 
                    key={listing.id} 
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      selectedIds.has(listing.id) && "bg-muted/30"
                    )}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedIds.has(listing.id)}
                        onCheckedChange={() => toggleSelect(listing.id)}
                        aria-label={`Selecionar ${listing.title}`}
                      />
                    </td>
                    <td onClick={() => setSelectedListing(listing)}>
                      <div className="flex items-center gap-3">
                        {listing.thumbnail && (
                          <img 
                            src={listing.thumbnail} 
                            alt="" 
                            className="w-12 h-12 rounded-lg object-cover bg-muted"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[300px]">{listing.title}</p>
                          <p className="text-xs text-muted-foreground">{listing.item_id}</p>
                        </div>
                      </div>
                    </td>
                    <td onClick={() => setSelectedListing(listing)}>{getStatusBadge(listing.status)}</td>
                    <td onClick={() => setSelectedListing(listing)}>{getStockBadge(listing.available_quantity)}</td>
                    <td onClick={() => setSelectedListing(listing)} className="text-muted-foreground">{listing.sold_quantity}</td>
                    <td onClick={() => setSelectedListing(listing)} className="font-medium">{formatCurrency(listing.price)}</td>
                    <td onClick={() => setSelectedListing(listing)} className="text-xs text-muted-foreground">{listing.listing_type || '-'}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            if (listing.permalink) window.open(listing.permalink, '_blank');
                          }}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Ver no ML
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {listing.status !== 'active' && (
                            <DropdownMenuItem 
                              onClick={() => setConfirmAction({ action: 'activate', itemIds: [listing.item_id] })}
                              disabled={isActioning}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Ativar
                            </DropdownMenuItem>
                          )}
                          {listing.status === 'active' && (
                            <DropdownMenuItem 
                              onClick={() => setConfirmAction({ action: 'pause', itemIds: [listing.item_id] })}
                              disabled={isActioning}
                            >
                              <Pause className="w-4 h-4 mr-2" />
                              Pausar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setNewPrice(listing.price.toString());
                            setPriceDialog({ listing });
                          }}>
                            <DollarSign className="w-4 h-4 mr-2" />
                            Alterar preço
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setNewStock(listing.available_quantity.toString());
                            setStockDialog({ listing });
                          }}>
                            <Boxes className="w-4 h-4 mr-2" />
                            Alterar estoque
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {listing.status !== 'closed' && (
                            <DropdownMenuItem 
                              onClick={() => setConfirmAction({ action: 'close', itemIds: [listing.item_id] })}
                              disabled={isActioning}
                              className="text-destructive focus:text-destructive"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Encerrar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredListings.map((listing) => (
          <Card 
            key={listing.id} 
            className={cn(
              "cursor-pointer",
              selectedIds.has(listing.id) && "ring-2 ring-primary"
            )}
          >
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="flex items-start pt-1">
                  <Checkbox 
                    checked={selectedIds.has(listing.id)}
                    onCheckedChange={() => toggleSelect(listing.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {listing.thumbnail && (
                  <img 
                    src={listing.thumbnail} 
                    alt="" 
                    className="w-16 h-16 rounded-lg object-cover bg-muted flex-shrink-0"
                    onClick={() => setSelectedListing(listing)}
                  />
                )}
                <div className="flex-1 min-w-0" onClick={() => setSelectedListing(listing)}>
                  <p className="font-medium line-clamp-2">{listing.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{listing.item_id}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getStatusBadge(listing.status)}
                    {getStockBadge(listing.available_quantity)}
                  </div>
                  <p className="font-bold text-lg mt-2">{formatCurrency(listing.price)}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex-shrink-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      if (listing.permalink) window.open(listing.permalink, '_blank');
                    }}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver no ML
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {listing.status !== 'active' && (
                      <DropdownMenuItem 
                        onClick={() => setConfirmAction({ action: 'activate', itemIds: [listing.item_id] })}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Ativar
                      </DropdownMenuItem>
                    )}
                    {listing.status === 'active' && (
                      <DropdownMenuItem 
                        onClick={() => setConfirmAction({ action: 'pause', itemIds: [listing.item_id] })}
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Pausar
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                      setNewPrice(listing.price.toString());
                      setPriceDialog({ listing });
                    }}>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Alterar preço
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setNewStock(listing.available_quantity.toString());
                      setStockDialog({ listing });
                    }}>
                      <Boxes className="w-4 h-4 mr-2" />
                      Alterar estoque
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {listing.status !== 'closed' && (
                      <DropdownMenuItem 
                        onClick={() => setConfirmAction({ action: 'close', itemIds: [listing.item_id] })}
                        className="text-destructive focus:text-destructive"
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Encerrar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground text-center">
        Exibindo {filteredListings.length} de {listings.length} anúncios
      </p>

      {/* Listing Detail Dialog */}
      <Dialog open={!!selectedListing} onOpenChange={() => setSelectedListing(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedListing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-start gap-4">
                  {selectedListing.thumbnail && (
                    <img 
                      src={selectedListing.thumbnail.replace('-I.jpg', '-O.jpg')} 
                      alt="" 
                      className="w-20 h-20 rounded-lg object-cover bg-muted flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-lg font-semibold leading-tight">{selectedListing.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{selectedListing.item_id}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Status & Stock */}
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(selectedListing.status)}
                  {getStockBadge(selectedListing.available_quantity)}
                  {selectedListing.free_shipping && (
                    <Badge className="bg-primary/10 text-primary">Frete Grátis</Badge>
                  )}
                </div>

                {/* Price */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xl font-bold">{formatCurrency(selectedListing.price)}</p>
                    <p className="text-xs text-muted-foreground">Preço atual</p>
                  </div>
                  {selectedListing.original_price && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xl font-bold line-through text-muted-foreground">
                        {formatCurrency(selectedListing.original_price)}
                      </p>
                      <p className="text-xs text-muted-foreground">Preço original</p>
                    </div>
                  )}
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xl font-bold">{selectedListing.available_quantity}</p>
                    <p className="text-xs text-muted-foreground">Disponível</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xl font-bold">{selectedListing.sold_quantity}</p>
                    <p className="text-xs text-muted-foreground">Vendidos</p>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tipo de anúncio</p>
                    <p className="font-medium">{selectedListing.listing_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Logística</p>
                    <p className="font-medium">{selectedListing.logistic_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Condição</p>
                    <p className="font-medium">{selectedListing.condition || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Categoria</p>
                    <p className="font-medium">{selectedListing.category_id || '-'}</p>
                  </div>
                </div>

                {/* Variations */}
                {selectedListing.has_variations && (
                  <div>
                    <h4 className="font-semibold mb-3">Variações</h4>
                    <div className="space-y-2">
                      {getVariationsForListing(selectedListing.id).map((variation) => (
                        <div 
                          key={variation.id} 
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div>
                            <div className="flex flex-wrap gap-1">
                              {variation.attributes.map((attr, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {attr.name}: {attr.value_name}
                                </Badge>
                              ))}
                            </div>
                            {variation.sku && (
                              <p className="text-xs text-muted-foreground mt-1">SKU: {variation.sku}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(variation.price)}</p>
                            <p className="text-xs text-muted-foreground">
                              {variation.available_quantity} disponíveis
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      if (selectedListing.permalink) window.open(selectedListing.permalink, '_blank');
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver no ML
                  </Button>
                  {selectedListing.status !== 'active' && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setConfirmAction({ action: 'activate', itemIds: [selectedListing.item_id] });
                        setSelectedListing(null);
                      }}
                      disabled={isActioning}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Ativar
                    </Button>
                  )}
                  {selectedListing.status === 'active' && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setConfirmAction({ action: 'pause', itemIds: [selectedListing.item_id] });
                        setSelectedListing(null);
                      }}
                      disabled={isActioning}
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pausar
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNewPrice(selectedListing.price.toString());
                      setPriceDialog({ listing: selectedListing });
                      setSelectedListing(null);
                    }}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Alterar preço
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNewStock(selectedListing.available_quantity.toString());
                      setStockDialog({ listing: selectedListing });
                      setSelectedListing(null);
                    }}
                  >
                    <Boxes className="w-4 h-4 mr-2" />
                    Alterar estoque
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction ? `${getActionLabel(confirmAction.action)} anúncio(s)?` : ''}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === 'close' 
                ? `Esta ação não pode ser desfeita. ${confirmAction.itemIds.length} anúncio(s) serão encerrados permanentemente.`
                : `${confirmAction?.itemIds.length} anúncio(s) serão ${confirmAction?.action === 'pause' ? 'pausados' : 'ativados'}.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeAction}
              className={confirmAction?.action === 'close' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {isActioning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {confirmAction ? getActionLabel(confirmAction.action) : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Price Update Dialog */}
      <Dialog open={!!priceDialog} onOpenChange={() => { setPriceDialog(null); setNewPrice(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar preço</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {priceDialog?.listing.title}
            </p>
            <div>
              <label className="text-sm font-medium">Novo preço (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPriceDialog(null); setNewPrice(''); }}>
              Cancelar
            </Button>
            <Button onClick={handleUpdatePrice} disabled={isActioning || !newPrice}>
              {isActioning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Update Dialog */}
      <Dialog open={!!stockDialog} onOpenChange={() => { setStockDialog(null); setNewStock(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar estoque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {stockDialog?.listing.title}
            </p>
            <div>
              <label className="text-sm font-medium">Quantidade disponível</label>
              <Input
                type="number"
                min="0"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setStockDialog(null); setNewStock(''); }}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateStock} disabled={isActioning || !newStock}>
              {isActioning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
