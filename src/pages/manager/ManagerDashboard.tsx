import { useRef, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, Clock, CheckCircle, Users, AlertTriangle } from 'lucide-react';
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';
import { MonthlyEvolutionChart } from '@/components/dashboard/MonthlyEvolutionChart';
import { ProviderRankingChart } from '@/components/dashboard/ProviderRankingChart';
import { CostComparisonChart } from '@/components/dashboard/CostComparisonChart';
import { ResolutionTimeChart } from '@/components/dashboard/ResolutionTimeChart';
import { PeriodComparisonCard } from '@/components/dashboard/PeriodComparisonCard';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { ExportPDFButton } from '@/components/dashboard/ExportPDFButton';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { ForecastChart } from '@/components/dashboard/ForecastChart';
import { DemandForecastCard } from '@/components/dashboard/DemandForecastCard';
import { format, subMonths, startOfMonth, endOfMonth, subYears, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SERVICE_CATEGORY_LABELS, ServiceCategory } from '@/types/database';

export default function ManagerDashboard() {
  const { profile } = useAuth();
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  // Date range state
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(subMonths(new Date(), 5)),
    end: endOfMonth(new Date()),
  });

  const { data: condominium } = useQuery({
    queryKey: ['condominium', profile?.condominium_id],
    queryFn: async () => {
      if (!profile?.condominium_id) return null;
      const { data } = await supabase
        .from('condominiums')
        .select('*')
        .eq('id', profile.condominium_id)
        .single();
      return data;
    },
    enabled: !!profile?.condominium_id,
  });

  const { data: stats } = useQuery({
    queryKey: ['manager-stats', profile?.condominium_id, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      if (!profile?.condominium_id) return null;

      const { data: calls } = await supabase
        .from('service_calls')
        .select('status')
        .eq('condominium_id', profile.condominium_id)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      const { data: providers } = await supabase
        .from('service_providers')
        .select('id')
        .eq('condominium_id', profile.condominium_id);

      const openCalls = calls?.filter((c) => ['open', 'sent', 'awaiting_approval'].includes(c.status)).length || 0;
      const inProgressCalls = calls?.filter((c) => c.status === 'in_progress').length || 0;
      const completedCalls = calls?.filter((c) => c.status === 'completed').length || 0;
      const totalProviders = providers?.length || 0;

      return { openCalls, inProgressCalls, completedCalls, totalProviders };
    },
    enabled: !!profile?.condominium_id,
  });

  // Query for calls by category with date filter
  const { data: categoryData = [] } = useQuery({
    queryKey: ['calls-by-category', profile?.condominium_id, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      if (!profile?.condominium_id) return [];
      const { data } = await supabase
        .from('service_calls')
        .select('category')
        .eq('condominium_id', profile.condominium_id)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (!data) return [];

      const counts: Record<string, number> = {};
      data.forEach((call) => {
        counts[call.category] = (counts[call.category] || 0) + 1;
      });

      return Object.entries(counts).map(([category, count]) => ({
        category,
        count,
      }));
    },
    enabled: !!profile?.condominium_id,
  });

  // Query for monthly evolution with date filter
  const { data: monthlyData = [] } = useQuery({
    queryKey: ['monthly-evolution', profile?.condominium_id, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      if (!profile?.condominium_id) return [];

      const { data } = await supabase
        .from('service_calls')
        .select('created_at, status')
        .eq('condominium_id', profile.condominium_id)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (!data) return [];

      // Group by month within the selected range
      const monthsMap: Record<string, { opened: number; completed: number }> = {};
      
      data.forEach((call) => {
        const callDate = new Date(call.created_at);
        const monthKey = format(callDate, 'yyyy-MM');
        const monthLabel = format(callDate, 'MMM', { locale: ptBR });
        const formattedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
        
        if (!monthsMap[monthKey]) {
          monthsMap[monthKey] = { opened: 0, completed: 0 };
        }
        
        monthsMap[monthKey].opened++;
        if (call.status === 'completed') {
          monthsMap[monthKey].completed++;
        }
      });

      // Sort by month key and format
      return Object.entries(monthsMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => {
          const date = new Date(key + '-01');
          const label = format(date, 'MMM', { locale: ptBR });
          return {
            month: label.charAt(0).toUpperCase() + label.slice(1),
            opened: value.opened,
            completed: value.completed,
          };
        });
    },
    enabled: !!profile?.condominium_id,
  });

  // Query for cost comparison with date filter
  const { data: costData = [] } = useQuery({
    queryKey: ['cost-comparison', profile?.condominium_id, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      if (!profile?.condominium_id) return [];

      const { data } = await supabase
        .from('service_calls')
        .select('created_at, estimated_value, actual_value, status')
        .eq('condominium_id', profile.condominium_id)
        .eq('status', 'completed')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (!data) return [];

      // Group by month
      const monthsMap: Record<string, { estimated: number; actual: number }> = {};
      
      data.forEach((call) => {
        const callDate = new Date(call.created_at);
        const monthKey = format(callDate, 'yyyy-MM');
        
        if (!monthsMap[monthKey]) {
          monthsMap[monthKey] = { estimated: 0, actual: 0 };
        }
        
        monthsMap[monthKey].estimated += Number(call.estimated_value) || 0;
        monthsMap[monthKey].actual += Number(call.actual_value) || 0;
      });

      // Sort by month key and format
      return Object.entries(monthsMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => {
          const date = new Date(key + '-01');
          const label = format(date, 'MMM', { locale: ptBR });
          return {
            month: label.charAt(0).toUpperCase() + label.slice(1),
            estimated: value.estimated,
            actual: value.actual,
          };
        });
    },
    enabled: !!profile?.condominium_id,
  });

  // Query for provider ranking
  const { data: providerRanking = [] } = useQuery({
    queryKey: ['provider-ranking', profile?.condominium_id],
    queryFn: async () => {
      if (!profile?.condominium_id) return [];
      const { data } = await supabase
        .from('service_providers')
        .select('name, average_rating, total_ratings')
        .eq('condominium_id', profile.condominium_id)
        .gt('total_ratings', 0)
        .order('average_rating', { ascending: false })
        .limit(5);

      return data || [];
    },
    enabled: !!profile?.condominium_id,
  });

  // Query for resolution time by category
  const { data: resolutionData = [] } = useQuery({
    queryKey: ['resolution-time', profile?.condominium_id, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      if (!profile?.condominium_id) return [];

      const { data } = await supabase
        .from('service_calls')
        .select('category, created_at, updated_at')
        .eq('condominium_id', profile.condominium_id)
        .eq('status', 'completed')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (!data || data.length === 0) return [];

      // Group by category and calculate average resolution time
      const categoryMap: Record<string, { totalDays: number; count: number }> = {};
      
      data.forEach((call) => {
        const createdAt = new Date(call.created_at);
        const updatedAt = new Date(call.updated_at);
        const days = differenceInDays(updatedAt, createdAt) || 1; // Minimum 1 day
        
        if (!categoryMap[call.category]) {
          categoryMap[call.category] = { totalDays: 0, count: 0 };
        }
        
        categoryMap[call.category].totalDays += days;
        categoryMap[call.category].count++;
      });

      return Object.entries(categoryMap).map(([category, stats]) => ({
        category,
        categoryLabel: SERVICE_CATEGORY_LABELS[category as ServiceCategory] || category,
        averageDays: stats.totalDays / stats.count,
        totalCalls: stats.count,
      }));
    },
    enabled: !!profile?.condominium_id,
  });

  // Calculate previous period dates for comparison
  const periodDurationDays = differenceInDays(dateRange.end, dateRange.start);
  const previousPeriodEnd = new Date(dateRange.start);
  previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
  const previousPeriodStart = new Date(previousPeriodEnd);
  previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDurationDays);

  // Query for period comparison
  const { data: periodComparison } = useQuery({
    queryKey: ['period-comparison', profile?.condominium_id, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      if (!profile?.condominium_id) return null;

      // Fetch current period data
      const { data: currentCalls } = await supabase
        .from('service_calls')
        .select('status, created_at, updated_at, actual_value')
        .eq('condominium_id', profile.condominium_id)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      // Fetch previous period data
      const { data: previousCalls } = await supabase
        .from('service_calls')
        .select('status, created_at, updated_at, actual_value')
        .eq('condominium_id', profile.condominium_id)
        .gte('created_at', previousPeriodStart.toISOString())
        .lte('created_at', previousPeriodEnd.toISOString());

      const calculateStats = (calls: typeof currentCalls) => {
        if (!calls || calls.length === 0) {
          return { totalCalls: 0, completedCalls: 0, avgResolutionDays: 0, totalCost: 0 };
        }

        const completed = calls.filter(c => c.status === 'completed');
        let totalDays = 0;
        let totalCost = 0;

        completed.forEach(call => {
          const days = differenceInDays(new Date(call.updated_at), new Date(call.created_at)) || 1;
          totalDays += days;
          totalCost += Number(call.actual_value) || 0;
        });

        return {
          totalCalls: calls.length,
          completedCalls: completed.length,
          avgResolutionDays: completed.length > 0 ? totalDays / completed.length : 0,
          totalCost,
        };
      };

      return {
        current: calculateStats(currentCalls),
        previous: calculateStats(previousCalls),
        currentLabel: `${format(dateRange.start, 'dd/MM/yy')} - ${format(dateRange.end, 'dd/MM/yy')}`,
        previousLabel: `${format(previousPeriodStart, 'dd/MM/yy')} - ${format(previousPeriodEnd, 'dd/MM/yy')}`,
      };
    },
    enabled: !!profile?.condominium_id,
  });

  const handleDateRangeChange = (start: Date, end: Date) => {
    setDateRange({ start, end });
  };

  if (condominium?.status === 'pending') {
    return (
      <DashboardLayout title="Dashboard">
        <Alert className="border-warning bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle>Aguardando Aprovação</AlertTitle>
          <AlertDescription>
            Seu cadastro está em análise. Você receberá uma notificação assim que for aprovado.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  if (condominium?.status === 'rejected') {
    return (
      <DashboardLayout title="Dashboard">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Cadastro Rejeitado</AlertTitle>
          <AlertDescription>
            Infelizmente seu cadastro foi rejeitado. Entre em contato com o suporte para mais informações.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const cards = [
    {
      title: 'Chamados Abertos',
      value: stats?.openCalls || 0,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Em Andamento',
      value: stats?.inProgressCalls || 0,
      icon: FileText,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      title: 'Concluídos',
      value: stats?.completedCalls || 0,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Prestadores',
      value: stats?.totalProviders || 0,
      icon: Users,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Filter and Export Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DateRangeFilter
            startDate={dateRange.start}
            endDate={dateRange.end}
            onRangeChange={handleDateRangeChange}
          />
          <ExportPDFButton
            dashboardRef={dashboardRef}
            condominiumName={condominium?.name || 'Condomínio'}
            dateRange={dateRange}
          />
        </div>

        {/* Dashboard content to export */}
        <div ref={dashboardRef} className="space-y-6">
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

          {/* Resolution Time Alerts */}
          <AlertsPanel />

          {/* Period Comparison */}
          {periodComparison && (
            <PeriodComparisonCard
              currentPeriod={periodComparison.current}
              previousPeriod={periodComparison.previous}
              currentLabel={periodComparison.currentLabel}
              previousLabel={periodComparison.previousLabel}
            />
          )}

          {/* Charts Row 1 */}
          <div className="grid gap-4 md:grid-cols-2">
            <CategoryPieChart data={categoryData} />
            <MonthlyEvolutionChart data={monthlyData} />
          </div>

          {/* Charts Row 2 */}
          <div className="grid gap-4 md:grid-cols-2">
            <CostComparisonChart data={costData} />
            <ResolutionTimeChart data={resolutionData} />
          </div>

          {/* Forecast Section */}
          <div className="grid gap-4 md:grid-cols-2">
            <ForecastChart 
              historicalData={monthlyData.map(m => ({ month: m.month, value: m.opened }))}
              title="Previsão de Demanda"
              valueLabel="Chamados"
            />
            <DemandForecastCard
              categoryData={categoryData}
              estimatedCost={
                costData.length > 0 && monthlyData.reduce((sum, m) => sum + m.opened, 0) > 0
                  ? costData.reduce((sum, m) => sum + m.actual, 0)
                  : undefined
              }
            />
          </div>

          {/* Provider Ranking */}
          <ProviderRankingChart data={providerRanking} />
        </div>
      </div>
    </DashboardLayout>
  );
}
