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
import { User, Building2, Bell, Shield, Database } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Configurações"
        description="Gerencie as configurações do seu workspace"
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input defaultValue="Usuário Demo" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue="demo@syntacx.io" type="email" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fuso Horário</Label>
                <Select defaultValue="America/Sao_Paulo">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                    <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                    <SelectItem value="America/Fortaleza">Fortaleza (GMT-3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button>Salvar Alterações</Button>
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
                <Label>Nome do Workspace</Label>
                <Input defaultValue="Minha Loja ML" />
              </div>

              <div className="space-y-2">
                <Label>Moeda</Label>
                <Select defaultValue="BRL">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                    <SelectItem value="USD">Dólar (US$)</SelectItem>
                  </SelectContent>
                </Select>
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

              <Button>Salvar Configurações</Button>
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
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Resumo Diário</p>
                  <p className="text-sm text-muted-foreground">
                    Email com resumo de vendas e lucro do dia anterior
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alerta de Margem Negativa</p>
                  <p className="text-sm text-muted-foreground">
                    Notificar quando um pedido tiver margem negativa
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Progresso de Metas</p>
                  <p className="text-sm text-muted-foreground">
                    Alertas sobre progresso das metas semanais/mensais
                  </p>
                </div>
                <Switch />
              </div>

              <Button>Salvar Preferências</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Exportação de Dados</CardTitle>
                <CardDescription>
                  Exporte seus dados para análise externa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline">
                    Exportar Pedidos (CSV)
                  </Button>
                  <Button variant="outline">
                    Exportar Produtos (CSV)
                  </Button>
                  <Button variant="outline">
                    Exportar Custos (CSV)
                  </Button>
                  <Button variant="outline">
                    Relatório Completo (PDF)
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Zona de Perigo
                </CardTitle>
                <CardDescription>
                  Ações irreversíveis que afetam todos os dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                  <div>
                    <p className="font-medium">Resetar Dados de Demo</p>
                    <p className="text-sm text-muted-foreground">
                      Regenerar todos os dados simulados
                    </p>
                  </div>
                  <Button variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10">
                    Resetar
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                  <div>
                    <p className="font-medium">Excluir Workspace</p>
                    <p className="text-sm text-muted-foreground">
                      Remover permanentemente todos os dados
                    </p>
                  </div>
                  <Button variant="destructive">
                    Excluir
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
