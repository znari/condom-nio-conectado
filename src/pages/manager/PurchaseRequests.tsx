import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { PurchaseRequestCard } from '@/components/purchases/PurchaseRequestCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  Package,
} from 'lucide-react';
import type { PurchaseRequest, PurchaseRequestStatus, PurchaseCategory, PurchasePriority } from '@/types/database';

export default function PurchaseRequests() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('all');
  const isZelador = profile?.position === 'zelador';

  const { data: requests, isLoading } = useQuery({
    queryKey: ['purchase-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as PurchaseRequest[];
    },
  });

  const statusCounts = {
    all: requests?.length || 0,
    pending: requests?.filter((r) => r.status === 'pending').length || 0,
    approved: requests?.filter((r) => r.status === 'approved').length || 0,
    purchased: requests?.filter((r) => r.status === 'purchased').length || 0,
    rejected: requests?.filter((r) => r.status === 'rejected').length || 0,
  };

  const filteredRequests =
    activeTab === 'all'
      ? requests
      : requests?.filter((r) => r.status === activeTab);

  return (
    <DashboardLayout title="Solicitações de Compras">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Solicitações de Compras</h1>
            <p className="text-muted-foreground">
              Gerencie as solicitações de produtos e equipamentos
            </p>
          </div>
          {isZelador && (
            <Button asChild>
              <Link to="/compras/nova">
                <Plus className="h-4 w-4 mr-2" />
                Nova Solicitação
              </Link>
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compradas</CardTitle>
              <Package className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.purchased}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs and List */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todas ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="pending">
              Pendentes ({statusCounts.pending})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Aprovadas ({statusCounts.approved})
            </TabsTrigger>
            <TabsTrigger value="purchased">
              Compradas ({statusCounts.purchased})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredRequests?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Nenhuma solicitação encontrada
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {isZelador
                      ? 'Clique no botão acima para criar uma nova solicitação de compra.'
                      : 'Não há solicitações de compra nesta categoria.'}
                  </p>
                  {isZelador && (
                    <Button asChild>
                      <Link to="/compras/nova">
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Solicitação
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredRequests?.map((request) => (
                  <PurchaseRequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
