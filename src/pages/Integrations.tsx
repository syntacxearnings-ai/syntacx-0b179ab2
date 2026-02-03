import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Link2, ShoppingBag, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIntegration } from '@/hooks/useIntegration';
import { useToast } from '@/hooks/use-toast';

export default function Integrations() {
  const [showMlConnect, setShowMlConnect] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const { integration, isConnected, isLoading, disconnect, isDisconnecting } = useIntegration();
  const { toast } = useToast();

  useEffect(() => {
    const err = searchParams.get('ml_error');
    const desc = searchParams.get('ml_error_description');
    const success = searchParams.get('ml_success');

    if (success === '1') {
      toast({
        title: 'Conectado',
        description: 'Integração com Mercado Livre conectada com sucesso',
      });
      searchParams.delete('ml_success');
      setSearchParams(searchParams, { replace: true });
      return;
    }

    if (err) {
      toast({
        variant: 'destructive',
        title: 'Falha no OAuth',
        description: desc ? `${err}: ${desc}` : err,
      });
      searchParams.delete('ml_error');
      searchParams.delete('ml_error_description');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, toast]);

  const handleConnect = () => {
    if (!clientId || !clientSecret) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Preencha o Client ID e Client Secret',
      });
      return;
    }

    // Build OAuth URL
    const redirectUri = `${window.location.origin}/api/integrations/meli/callback`;
    const state = crypto.randomUUID();
    
    // Store state for verification
    sessionStorage.setItem('ml_oauth_state', state);
    sessionStorage.setItem('ml_client_id', clientId);
    sessionStorage.setItem('ml_client_secret', clientSecret);
    sessionStorage.setItem('ml_redirect_uri', redirectUri);

    // Redirect to Mercado Livre OAuth - scope is REQUIRED
    const authUrl = new URL('https://auth.mercadolivre.com.br/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    // Never send read/write scopes here.
    // Option A (recommended): do not send scope at all.
    // If you ever need refresh_token explicitly, you can add: scope=offline_access

    console.log('[ML OAuth] authorize_url', authUrl.toString());
    console.log('[ML OAuth] redirect_uri(authorize)', redirectUri);

    window.location.href = authUrl.toString();
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: 'Desconectado',
      description: 'Integração com Mercado Livre removida',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Integrações"
        description="Conecte sua conta do Mercado Livre para sincronizar pedidos e produtos"
      />

      <div className="grid gap-6">
        {/* Mercado Livre Integration */}
        <Card className={cn(
          "border-2 transition-all",
          isConnected ? "border-success/30" : "border-border"
        )}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0",
                  isConnected ? "bg-success/10" : "bg-warning/10"
                )}>
                  <ShoppingBag className={cn(
                    "w-6 h-6 sm:w-8 sm:h-8",
                    isConnected ? "text-success" : "text-warning"
                  )} />
                </div>
                <div>
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    Mercado Livre
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isConnected ? (
                      <Badge variant="outline" className="border-success text-success">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Conectado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-warning text-warning-foreground">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Não conectado
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Sincronize pedidos, produtos e taxas automaticamente
                  </CardDescription>
                </div>
              </div>
              {isConnected ? (
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sincronizar
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                  >
                    {isDisconnecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Desconectar'
                    )}
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setShowMlConnect(true)} className="w-full sm:w-auto">
                  <Link2 className="w-4 h-4 mr-2" />
                  Conectar
                </Button>
              )}
            </div>
          </CardHeader>
          {isConnected && integration && (
            <CardContent className="border-t pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-lg sm:text-2xl font-bold">{integration.nickname || '-'}</p>
                  <p className="text-xs text-muted-foreground">Usuário ML</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-lg sm:text-2xl font-bold">{integration.site_id}</p>
                  <p className="text-xs text-muted-foreground">Site</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-lg sm:text-2xl font-bold">
                    {integration.last_sync_at 
                      ? new Date(integration.last_sync_at).toLocaleDateString('pt-BR')
                      : 'Nunca'}
                  </p>
                  <p className="text-xs text-muted-foreground">Última Sincronização</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-lg sm:text-2xl font-bold text-success">Ativo</p>
                  <p className="text-xs text-muted-foreground">Status</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Not Connected Notice */}
        {!isConnected && !isLoading && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col sm:flex-row items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h4 className="font-semibold">Conecte sua conta</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Conecte sua conta do Mercado Livre para ver dados reais de vendas, pedidos e lucro.
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowMlConnect(true)} className="w-full sm:w-auto">
                Conectar agora
              </Button>
            </CardContent>
          </Card>
        )}

        {/* What's synced */}
        <Card>
          <CardHeader>
            <CardTitle>O que é sincronizado</CardTitle>
            <CardDescription>
              Dados importados automaticamente do Mercado Livre
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Pedidos', desc: 'ID, data, status, itens, valores' },
                { title: 'Taxas', desc: 'Comissão, frete, custos de envio' },
                { title: 'Produtos', desc: 'Anúncios ativos e estoque' },
                { title: 'Descontos', desc: 'Cupons e promoções aplicadas' },
              ].map(item => (
                <div key={item.title} className="p-4 rounded-lg border border-border">
                  <CheckCircle2 className="w-5 h-5 text-success mb-2" />
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connect Dialog */}
      <Dialog open={showMlConnect} onOpenChange={setShowMlConnect}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Conectar Mercado Livre
            </DialogTitle>
            <DialogDescription>
              Você precisa criar um app no Mercado Livre Developers para obter as credenciais
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted/50 text-sm">
              <p className="font-medium mb-2">Como obter as credenciais:</p>
              <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
                <li>Acesse <a href="https://developers.mercadolibre.com.br/apps" target="_blank" rel="noopener noreferrer" className="text-primary underline">Mercado Livre Developers</a></li>
                <li>Crie uma nova aplicação</li>
                <li>Copie o App ID (Client ID) e Secret</li>
                <li>Configure a Redirect URI como:<br/>
                  <code className="text-xs bg-muted p-1 rounded">{window.location.origin}/api/integrations/meli/callback</code>
                </li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-id">Client ID (App ID)</Label>
              <Input 
                id="client-id"
                placeholder="Ex: 1234567890123456" 
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client-secret">Client Secret</Label>
              <Input 
                id="client-secret"
                type="password" 
                placeholder="Secret do Mercado Livre"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                className="flex-1" 
                onClick={handleConnect}
                disabled={!clientId || !clientSecret}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Autorizar com OAuth
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Seus dados são criptografados e armazenados com segurança
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
