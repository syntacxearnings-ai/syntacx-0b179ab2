import { useState } from 'react';
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
import { Link2, ShoppingBag, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Integrations() {
  const [showMlConnect, setShowMlConnect] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

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
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center",
                  isConnected ? "bg-success/10" : "bg-warning/10"
                )}>
                  <ShoppingBag className={cn(
                    "w-8 h-8",
                    isConnected ? "text-success" : "text-warning"
                  )} />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Mercado Livre
                    {isConnected ? (
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
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sincronizar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsConnected(false)}>
                    Desconectar
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setShowMlConnect(true)}>
                  <Link2 className="w-4 h-4 mr-2" />
                  Conectar
                </Button>
              )}
            </div>
          </CardHeader>
          {isConnected && (
            <CardContent className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">85</p>
                  <p className="text-xs text-muted-foreground">Pedidos Sincronizados</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-xs text-muted-foreground">Produtos</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">Há 5 min</p>
                  <p className="text-xs text-muted-foreground">Última Sincronização</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-success">Ativo</p>
                  <p className="text-xs text-muted-foreground">Status do Token</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Demo Mode Notice */}
        {!isConnected && (
          <Card className="border-dashed">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Modo Demo Ativo</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  O app está funcionando com dados simulados. Conecte sua conta do Mercado Livre para ver dados reais.
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowMlConnect(true)}>
                Sair do Modo Demo
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              Autorize o Syntacx Ops a acessar sua conta do Mercado Livre
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted/50 text-sm">
              <p className="font-medium mb-2">Permissões necessárias:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Leitura de pedidos e vendas</li>
                <li>• Leitura de produtos e anúncios</li>
                <li>• Leitura de taxas e comissões</li>
                <li>• Leitura de estoque</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label>Client ID (opcional para demo)</Label>
              <Input placeholder="App ID do Mercado Livre" />
            </div>
            
            <div className="space-y-2">
              <Label>Client Secret (opcional para demo)</Label>
              <Input type="password" placeholder="Secret do Mercado Livre" />
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                className="flex-1" 
                onClick={() => {
                  setIsConnected(true);
                  setShowMlConnect(false);
                }}
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
