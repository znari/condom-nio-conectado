import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function AdminDashboard() {
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

  const cards = [
    {
      title: 'Total de Condomínios',
      value: stats?.total || 0,
      icon: Building2,
      color: 'text-foreground',
      bgColor: 'bg-muted',
    },
    {
      title: 'Aguardando Aprovação',
      value: stats?.pending || 0,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Aprovados',
      value: stats?.approved || 0,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Rejeitados',
      value: stats?.rejected || 0,
      icon: XCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.title} className="border-border/50">
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
