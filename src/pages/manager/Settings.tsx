import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LogoUpload } from '@/components/settings/LogoUpload';
import { CondominiumForm } from '@/components/settings/CondominiumForm';
import { ResolutionAlertSettings } from '@/components/settings/ResolutionAlertSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Image, Settings2, Bell, AlertTriangle } from 'lucide-react';
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
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
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
            <TabsTrigger value="preferencias" className="gap-2">
              <Settings2 className="w-4 h-4 hidden sm:inline" />
              Preferências
            </TabsTrigger>
          </TabsList>

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

          {/* Preferências */}
          <TabsContent value="preferencias">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Preferências de Notificação
                </CardTitle>
                <CardDescription>
                  Configure como deseja receber notificações sobre chamados e orçamentos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Settings2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Em breve</h3>
                  <p className="text-muted-foreground max-w-md">
                    Configurações de notificações por e-mail e WhatsApp estarão disponíveis em uma próxima atualização.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
