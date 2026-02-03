import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useListings, MLListing } from '@/hooks/useListings';
import { useIntegration } from '@/hooks/useIntegration';
import { useSync } from '@/hooks/useSync';
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
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Listings() {
  const navigate = useNavigate();
  const { listings, variations, getVariationsForListing, isLoading, stats, refetch } = useListings();
  const { isConnected, isLoading: isLoadingIntegration } = useIntegration();
  const { sync, isLoading: isSyncing, progress } = useSync();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [selectedListing, setSelectedListing] = useState<MLListing | null>(null);

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

  const handleSync = () => {
    sync(false);
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

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
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
        </CardContent>
      </Card>

      {/* Listings Grid/Table */}
      <div className="hidden md:block">
        <Card>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Anúncio</th>
                  <th>Status</th>
                  <th>Estoque</th>
                  <th>Vendidos</th>
                  <th>Preço</th>
                  <th>Tipo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.map((listing) => (
                  <tr 
                    key={listing.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedListing(listing)}
                  >
                    <td>
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
                    <td>{getStatusBadge(listing.status)}</td>
                    <td>{getStockBadge(listing.available_quantity)}</td>
                    <td className="text-muted-foreground">{listing.sold_quantity}</td>
                    <td className="font-medium">{formatCurrency(listing.price)}</td>
                    <td className="text-xs text-muted-foreground">{listing.listing_type || '-'}</td>
                    <td>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (listing.permalink) window.open(listing.permalink, '_blank');
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
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
            className="cursor-pointer"
            onClick={() => setSelectedListing(listing)}
          >
            <CardContent className="p-4">
              <div className="flex gap-3">
                {listing.thumbnail && (
                  <img 
                    src={listing.thumbnail} 
                    alt="" 
                    className="w-16 h-16 rounded-lg object-cover bg-muted flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium line-clamp-2">{listing.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{listing.item_id}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getStatusBadge(listing.status)}
                    {getStockBadge(listing.available_quantity)}
                  </div>
                  <p className="font-bold text-lg mt-2">{formatCurrency(listing.price)}</p>
                </div>
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
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      if (selectedListing.permalink) window.open(selectedListing.permalink, '_blank');
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver no Mercado Livre
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
