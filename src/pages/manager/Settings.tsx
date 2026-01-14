import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LogoUpload } from '@/components/settings/LogoUpload';
import { CondominiumForm } from '@/components/settings/CondominiumForm';
import { ResolutionAlertSettings } from '@/components/settings/ResolutionAlertSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { UserManagement } from '@/components/settings/UserManagement';
import { CategorySettings } from '@/components/settings/CategorySettings';
import { IntegrationSettings } from '@/components/settings/IntegrationSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  Building2, 
  Image, 
  AlertTriangle, 
  Bell, 
  Users, 
  FolderCog, 
  Plug 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Condominium, CondominiumStatus } from '@/types/database';
import { CONDOMINIUM_STATUSES } from '@/types/database';

export default function Settings() {
  const { profile } = useAuth();
  const [condominium, setCondominium] = useState<Condominium | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.condominium_id) {
      fetchCondominium();
    }
  }, [profile?.condominium_id]);

  const fetchCondominium = async () => {
    try {
      const { data, error } = await supabase
        .from('condominiums')
        .select('*')
        .eq('id', profile!.condominium_id)
        .single();

      if (error) throw error;
      setCondominium(data as Condominium);
    } catch (error) {
      console.error('Erro ao buscar condomínio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (url: string | null) => {
    if (condominium) {
      setCondominium({ ...condominium, logo_url: url });
    }
  };

  const handleDataUpdate = (data: Partial<Condominium>) => {
    if (condominium) {
      setCondominium({ ...condominium, ...data });
    }
  };

  const getStatusBadge = (status: CondominiumStatus) => {
    const statusConfig = CONDOMINIUM_STATUSES.find(s => s.value === status);
    return (
      <Badge className={statusConfig?.color || 'bg-muted'}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout title="Configurações">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!condominium) {
    return (
      <DashboardLayout title="Configurações">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Condomínio não encontrado.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Configurações">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie os dados e preferências do seu condomínio.
          </p>
        </div>

        {/* Status e Datas */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Status:</span>
                {getStatusBadge(condominium.status)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Cadastrado em:</span>
                <span>{format(new Date(condominium.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Última atualização:</span>
                <span>{format(new Date(condominium.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="dados" className="space-y-6">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="dados" className="gap-2">
                <Building2 className="w-4 h-4 hidden sm:inline" />
                Dados
              </TabsTrigger>
              <TabsTrigger value="logo" className="gap-2">
                <Image className="w-4 h-4 hidden sm:inline" />
                Logo
              </TabsTrigger>
              <TabsTrigger value="alertas" className="gap-2">
                <AlertTriangle className="w-4 h-4 hidden sm:inline" />
                Alertas
              </TabsTrigger>
              <TabsTrigger value="notificacoes" className="gap-2">
                <Bell className="w-4 h-4 hidden sm:inline" />
                Notificações
              </TabsTrigger>
              <TabsTrigger value="usuarios" className="gap-2">
                <Users className="w-4 h-4 hidden sm:inline" />
                Usuários
              </TabsTrigger>
              <TabsTrigger value="categorias" className="gap-2">
                <FolderCog className="w-4 h-4 hidden sm:inline" />
                Categorias
              </TabsTrigger>
              <TabsTrigger value="integracoes" className="gap-2">
                <Plug className="w-4 h-4 hidden sm:inline" />
                Integrações
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Dados Cadastrais */}
          <TabsContent value="dados">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Dados Cadastrais
                </CardTitle>
                <CardDescription>
                  Informações básicas do condomínio. O CNPJ não pode ser alterado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CondominiumForm 
                  condominium={condominium} 
                  onUpdate={handleDataUpdate} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logo */}
          <TabsContent value="logo">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Logo e Identidade Visual
                </CardTitle>
                <CardDescription>
                  Personalize o condomínio com um logo que aparecerá em relatórios e comunicações.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LogoUpload 
                  condominiumId={condominium.id}
                  currentLogoUrl={condominium.logo_url || null}
                  onLogoChange={handleLogoChange}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alertas */}
          <TabsContent value="alertas">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Alertas de Tempo de Resolução
                </CardTitle>
                <CardDescription>
                  Configure limites de tempo para alertas automáticos quando chamados demorarem mais que o esperado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResolutionAlertSettings />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notificações */}
          <TabsContent value="notificacoes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Preferências de Notificação
                </CardTitle>
                <CardDescription>
                  Configure como e quando deseja receber notificações sobre chamados e orçamentos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationSettings />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usuários */}
          <TabsContent value="usuarios">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Gestão de Usuários
                </CardTitle>
                <CardDescription>
                  Gerencie síndicos e zeladores com acesso ao sistema do condomínio.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagement />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categorias */}
          <TabsContent value="categorias">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderCog className="w-5 h-5" />
                  Categorias de Serviço
                </CardTitle>
                <CardDescription>
                  Personalize as categorias de serviço disponíveis para os chamados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CategorySettings />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrações */}
          <TabsContent value="integracoes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plug className="w-5 h-5" />
                  Integrações Externas
                </CardTitle>
                <CardDescription>
                  Conecte serviços externos como WhatsApp e E-mail para expandir as funcionalidades.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IntegrationSettings />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
