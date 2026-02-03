import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Building2, Bell, Database, Loader2, RefreshCw, Unlink } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useIntegration } from '@/hooks/useIntegration';
import { useSync } from '@/hooks/useSync';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    profile, 
    notificationSettings, 
    isLoading, 
    updateProfile, 
    updateNotificationSettings,
    isUpdatingProfile,
    isUpdatingNotifications,
  } = useProfile();
  const { integration, disconnect, isDisconnecting } = useIntegration();
  const { sync, isLoading: isSyncing } = useSync();

  // Local state for form
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [notifications, setNotifications] = useState({
    low_stock_alert: true,
    daily_summary: true,
    negative_margin_alert: true,
    goal_progress_alert: false,
  });

  // Initialize form values when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setCompanyName(profile.company_name || '');
      setTimezone(profile.timezone || 'America/Sao_Paulo');
    }
  }, [profile]);

  useEffect(() => {
    if (notificationSettings) {
      setNotifications({
        low_stock_alert: notificationSettings.low_stock_alert,
        daily_summary: notificationSettings.daily_summary,
        negative_margin_alert: notificationSettings.negative_margin_alert,
        goal_progress_alert: notificationSettings.goal_progress_alert,
      });
    }
  }, [notificationSettings]);

  const handleSaveProfile = () => {
    updateProfile({
      full_name: fullName,
      company_name: companyName,
      timezone,
    });
  };

  const handleSaveNotifications = () => {
    updateNotificationSettings(notifications);
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: 'Desconectado',
      description: 'Integração com Mercado Livre removida',
    });
  };

  const handleFullResync = () => {
    sync(true);
    toast({
      title: 'Re-sincronização iniciada',
      description: 'Importando todos os dados dos últimos 90 dias...',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader 
          title="Configurações"
          description="Gerencie as configurações do seu workspace"
        />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Configurações"
        description="Gerencie as configurações do seu workspace"
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="w-full sm:w-auto flex-wrap">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="workspace" className="gap-2">
            <Building2 className="w-4 h-4" />
            Workspace
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2">
            <Database className="w-4 h-4" />
            Avançado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    value={user?.email || ''} 
                    type="email" 
                    disabled 
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fuso Horário</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                    <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                    <SelectItem value="America/Fortaleza">Fortaleza (GMT-3)</SelectItem>
                    <SelectItem value="America/Cuiaba">Cuiabá (GMT-4)</SelectItem>
                    <SelectItem value="America/Recife">Recife (GMT-3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveProfile} disabled={isUpdatingProfile}>
                {isUpdatingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspace">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Workspace</CardTitle>
              <CardDescription>
                Configure as preferências do seu workspace Syntacx
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Nome da Empresa/Loja</Label>
                <Input 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Nome da sua empresa ou loja"
                />
              </div>

              <div className="space-y-2">
                <Label>Moeda</Label>
                <Select defaultValue="BRL">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Atualmente apenas BRL é suportado
                </p>
              </div>

              <div className="space-y-2">
                <Label>Rateio de Custos Fixos</Label>
                <Select defaultValue="orders">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orders">Por número de pedidos</SelectItem>
                    <SelectItem value="revenue">Proporcional à receita</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Define como os custos fixos são distribuídos entre os pedidos
                </p>
              </div>

              <Button onClick={handleSaveProfile} disabled={isUpdatingProfile}>
                {isUpdatingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificações</CardTitle>
              <CardDescription>
                Configure quando e como deseja receber alertas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alerta de Estoque Baixo</p>
                  <p className="text-sm text-muted-foreground">
                    Receba alertas quando produtos atingirem o estoque mínimo
                  </p>
                </div>
                <Switch 
                  checked={notifications.low_stock_alert} 
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, low_stock_alert: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Resumo Diário</p>
                  <p className="text-sm text-muted-foreground">
                    Email com resumo de vendas e lucro do dia anterior
                  </p>
                </div>
                <Switch 
                  checked={notifications.daily_summary}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, daily_summary: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alerta de Margem Negativa</p>
                  <p className="text-sm text-muted-foreground">
                    Notificar quando um pedido tiver margem negativa
                  </p>
                </div>
                <Switch 
                  checked={notifications.negative_margin_alert}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, negative_margin_alert: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Progresso de Metas</p>
                  <p className="text-sm text-muted-foreground">
                    Alertas sobre progresso das metas semanais/mensais
                  </p>
                </div>
                <Switch 
                  checked={notifications.goal_progress_alert}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, goal_progress_alert: checked }))}
                />
              </div>

              <Button onClick={handleSaveNotifications} disabled={isUpdatingNotifications}>
                {isUpdatingNotifications && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Preferências
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <div className="space-y-6">
            {/* Integration Actions */}
            {integration && (
              <Card>
                <CardHeader>
                  <CardTitle>Integração Mercado Livre</CardTitle>
                  <CardDescription>
                    Gerencie sua conexão com o Mercado Livre
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">Re-sincronização Completa</p>
                      <p className="text-sm text-muted-foreground">
                        Importar todos os dados dos últimos 90 dias novamente
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleFullResync}
                      disabled={isSyncing}
                    >
                      {isSyncing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Re-sincronizar
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                    <div>
                      <p className="font-medium">Desconectar Mercado Livre</p>
                      <p className="text-sm text-muted-foreground">
                        Remover conexão. Você precisará reconectar para sincronizar.
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="text-destructive border-destructive/50 hover:bg-destructive/10"
                      onClick={handleDisconnect}
                      disabled={isDisconnecting}
                    >
                      {isDisconnecting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Unlink className="w-4 h-4 mr-2" />
                      )}
                      Desconectar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Data Export */}
            <Card>
              <CardHeader>
                <CardTitle>Exportação de Dados</CardTitle>
                <CardDescription>
                  Exporte seus dados para análise externa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button variant="outline" onClick={() => toast({ title: 'Em breve', description: 'Funcionalidade em desenvolvimento' })}>
                    Exportar Pedidos (CSV)
                  </Button>
                  <Button variant="outline" onClick={() => toast({ title: 'Em breve', description: 'Funcionalidade em desenvolvimento' })}>
                    Exportar Produtos (CSV)
                  </Button>
                  <Button variant="outline" onClick={() => toast({ title: 'Em breve', description: 'Funcionalidade em desenvolvimento' })}>
                    Exportar Custos (CSV)
                  </Button>
                  <Button variant="outline" onClick={() => toast({ title: 'Em breve', description: 'Funcionalidade em desenvolvimento' })}>
                    Relatório Completo (PDF)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
