import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data: condominiums } = await supabase
        .from('condominiums')
        .select('status');

      const total = condominiums?.length || 0;
      const pending = condominiums?.filter((c) => c.status === 'pending').length || 0;
      const approved = condominiums?.filter((c) => c.status === 'approved').length || 0;
      const rejected = condominiums?.filter((c) => c.status === 'rejected').length || 0;

      return { total, pending, approved, rejected };
    },
  });

  const { data: recentPending = [] } = useQuery({
    queryKey: ['recent-pending'],
    queryFn: async () => {
      const { data } = await supabase
        .from('condominiums')
        .select('id, name, cnpj, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const formatCNPJ = (cnpj: string) => {
    return cnpj
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const cards = [
    {
      title: 'Total de Condomínios',
      value: stats?.total || 0,
      icon: Building2,
      color: 'text-foreground',
      bgColor: 'bg-muted',
      onClick: () => navigate('/admin/condominios'),
    },
    {
      title: 'Aguardando Aprovação',
      value: stats?.pending || 0,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      onClick: () => navigate('/admin/condominios?status=pending'),
      highlight: (stats?.pending || 0) > 0,
    },
    {
      title: 'Aprovados',
      value: stats?.approved || 0,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
      onClick: () => navigate('/admin/condominios?status=approved'),
    },
    {
      title: 'Rejeitados',
      value: stats?.rejected || 0,
      icon: XCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      onClick: () => navigate('/admin/condominios?status=rejected'),
    },
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Card 
              key={card.title} 
              className={`border-border/50 cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${
                card.highlight ? 'ring-2 ring-warning ring-offset-2 ring-offset-background' : ''
              }`}
              onClick={card.onClick}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${card.bgColor}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Pending Condominiums */}
        {recentPending.length > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-warning">
                <Clock className="h-5 w-5" />
                Aguardando Aprovação
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/admin/condominios?status=pending')}
                className="border-warning text-warning hover:bg-warning hover:text-warning-foreground"
              >
                Ver todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {recentPending.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-3">
                    <div className="space-y-1">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCNPJ(c.cnpj)} • Cadastrado{' '}
                        {formatDistanceToNow(new Date(c.created_at), { 
                          locale: ptBR, 
                          addSuffix: true 
                        })}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/condominios?id=${c.id}`);
                      }}
                    >
                      Revisar
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Welcome Card */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Bem-vindo ao ZelaSync</h2>
              <p className="mt-2 text-muted-foreground">
                Gerencie todos os condomínios cadastrados na plataforma.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
