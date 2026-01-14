import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdvancedFilters, FilterValues } from '@/components/reports/AdvancedFilters';
import { ExecutiveSummary } from '@/components/reports/ExecutiveSummary';
import { CategoryReport } from '@/components/reports/CategoryReport';
import { ProviderReport } from '@/components/reports/ProviderReport';
import { CostReport } from '@/components/reports/CostReport';
import { EfficiencyReport } from '@/components/reports/EfficiencyReport';
import { PurchaseReport } from '@/components/reports/PurchaseReport';
import { ExportMultiFormat } from '@/components/reports/ExportMultiFormat';
import { 
  FileText, 
  PieChart, 
  Users, 
  DollarSign, 
  Clock, 
  Download,
  ShoppingCart,
} from 'lucide-react';
import { startOfMonth, subMonths, endOfMonth } from 'date-fns';
import { ServiceCall, ServiceProvider, PurchaseRequest } from '@/types/database';

export default function Reports() {
  const { profile } = useAuth();
  const [filters, setFilters] = useState<FilterValues>({
    startDate: startOfMonth(subMonths(new Date(), 5)),
    endDate: endOfMonth(new Date()),
    categories: [],
    statuses: [],
    providers: [],
    urgencies: [],
    minValue: undefined,
    maxValue: undefined,
  });

  // Fetch service calls with filters
  const { data: calls = [], isLoading: callsLoading } = useQuery({
    queryKey: ['reports-calls', profile?.condominium_id, filters],
    queryFn: async () => {
      if (!profile?.condominium_id) return [];

      let query = supabase
        .from('service_calls')
        .select('*, provider:service_providers(*)')
        .eq('condominium_id', profile.condominium_id)
        .gte('created_at', filters.startDate.toISOString())
        .lte('created_at', filters.endDate.toISOString());

      if (filters.categories.length > 0) {
        query = query.in('category', filters.categories);
      }
      if (filters.statuses.length > 0) {
        query = query.in('status', filters.statuses);
      }
      if (filters.providers.length > 0) {
        query = query.in('provider_id', filters.providers);
      }
      if (filters.urgencies.length > 0) {
        query = query.in('urgency', filters.urgencies);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredData = data as ServiceCall[];

      // Client-side value filtering
      if (filters.minValue !== undefined) {
        filteredData = filteredData.filter(c => 
          (c.actual_value || c.estimated_value || 0) >= filters.minValue!
        );
      }
      if (filters.maxValue !== undefined) {
        filteredData = filteredData.filter(c => 
          (c.actual_value || c.estimated_value || 0) <= filters.maxValue!
        );
      }

      return filteredData;
    },
    enabled: !!profile?.condominium_id,
  });

  // Fetch providers
  const { data: providers = [] } = useQuery({
    queryKey: ['reports-providers', profile?.condominium_id],
    queryFn: async () => {
      if (!profile?.condominium_id) return [];
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('condominium_id', profile.condominium_id);
      if (error) throw error;
      return data as ServiceProvider[];
    },
    enabled: !!profile?.condominium_id,
  });

  // Fetch purchase requests
  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ['reports-purchases', profile?.condominium_id, filters],
    queryFn: async () => {
      if (!profile?.condominium_id) return [];

      const { data, error } = await supabase
        .from('purchase_requests')
        .select('*')
        .eq('condominium_id', profile.condominium_id)
        .gte('created_at', filters.startDate.toISOString())
        .lte('created_at', filters.endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PurchaseRequest[];
    },
    enabled: !!profile?.condominium_id,
  });

  // Fetch condominium for export header
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

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  return (
    <DashboardLayout title="Relatórios">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Relatórios</h1>
            <p className="text-muted-foreground">
              Análise detalhada de chamados, custos e desempenho.
            </p>
          </div>
          <ExportMultiFormat 
            calls={calls}
            providers={providers}
            filters={filters}
            condominiumName={condominium?.name || 'Condomínio'}
          />
        </div>

        {/* Filters */}
        <AdvancedFilters
          filters={filters}
          providers={providers}
          onFilterChange={handleFilterChange}
        />

        {/* Results count */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <FileText className="h-3 w-3" />
            {calls.length} chamado{calls.length !== 1 ? 's' : ''} encontrado{calls.length !== 1 ? 's' : ''}
          </Badge>
          {callsLoading && (
            <Badge variant="secondary">Carregando...</Badge>
          )}
        </div>

        {/* Report Tabs */}
        <Tabs defaultValue="executive" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="executive" className="gap-2">
              <FileText className="w-4 h-4 hidden sm:inline" />
              Resumo
            </TabsTrigger>
            <TabsTrigger value="category" className="gap-2">
              <PieChart className="w-4 h-4 hidden sm:inline" />
              Categorias
            </TabsTrigger>
            <TabsTrigger value="provider" className="gap-2">
              <Users className="w-4 h-4 hidden sm:inline" />
              Prestadores
            </TabsTrigger>
            <TabsTrigger value="cost" className="gap-2">
              <DollarSign className="w-4 h-4 hidden sm:inline" />
              Custos
            </TabsTrigger>
            <TabsTrigger value="efficiency" className="gap-2">
              <Clock className="w-4 h-4 hidden sm:inline" />
              Eficiência
            </TabsTrigger>
            <TabsTrigger value="purchases" className="gap-2">
              <ShoppingCart className="w-4 h-4 hidden sm:inline" />
              Compras
            </TabsTrigger>
          </TabsList>

          <TabsContent value="executive">
            <ExecutiveSummary calls={calls} filters={filters} />
          </TabsContent>

          <TabsContent value="category">
            <CategoryReport calls={calls} />
          </TabsContent>

          <TabsContent value="provider">
            <ProviderReport calls={calls} providers={providers} />
          </TabsContent>

          <TabsContent value="cost">
            <CostReport calls={calls} filters={filters} />
          </TabsContent>

          <TabsContent value="efficiency">
            <EfficiencyReport calls={calls} />
          </TabsContent>

          <TabsContent value="purchases">
            <PurchaseReport purchases={purchases} filters={filters} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
