import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Star, Award } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { ServiceCall, ServiceProvider } from '@/types/database';

interface ProviderReportProps {
  calls: ServiceCall[];
  providers: ServiceProvider[];
}

export function ProviderReport({ calls, providers }: ProviderReportProps) {
  // Group calls by provider
  const providerStats = calls.reduce((acc, call) => {
    const providerId = call.provider_id || 'unassigned';
    if (!acc[providerId]) {
      acc[providerId] = {
        total: 0,
        completed: 0,
        totalCost: 0,
        totalDays: 0,
        totalRating: 0,
        ratedCount: 0,
      };
    }
    
    acc[providerId].total++;
    
    if (call.status === 'completed') {
      acc[providerId].completed++;
      acc[providerId].totalCost += Number(call.actual_value) || 0;
      acc[providerId].totalDays += differenceInDays(
        new Date(call.updated_at),
        new Date(call.created_at)
      ) || 1;
      
      if (call.rating !== null) {
        acc[providerId].totalRating += call.rating;
        acc[providerId].ratedCount++;
      }
    }
    
    return acc;
  }, {} as Record<string, { total: number; completed: number; totalCost: number; totalDays: number; totalRating: number; ratedCount: number }>);

  const providerData = Object.entries(providerStats).map(([providerId, stats]) => {
    const provider = providers.find(p => p.id === providerId);
    return {
      id: providerId,
      name: provider?.name || (providerId === 'unassigned' ? 'Não atribuído' : 'Prestador removido'),
      total: stats.total,
      completed: stats.completed,
      completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
      totalCost: stats.totalCost,
      avgCost: stats.completed > 0 ? stats.totalCost / stats.completed : 0,
      avgDays: stats.completed > 0 ? stats.totalDays / stats.completed : 0,
      avgRating: stats.ratedCount > 0 ? stats.totalRating / stats.ratedCount : 0,
      ratedCount: stats.ratedCount,
    };
  });

  // Sort by total calls descending
  providerData.sort((a, b) => b.total - a.total);

  // Chart data (top 10)
  const chartData = providerData.slice(0, 10).map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    chamados: p.total,
    concluídos: p.completed,
  }));

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating ? 'text-warning fill-warning' : 'text-muted'
            }`}
          />
        ))}
        <span className="ml-1 text-sm">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (calls.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhum chamado encontrado para o período selecionado.</p>
        </CardContent>
      </Card>
    );
  }

  // Top performer
  const topPerformer = providerData
    .filter(p => p.id !== 'unassigned' && p.completed >= 3)
    .sort((a, b) => b.avgRating - a.avgRating)[0];

  return (
    <div className="space-y-6">
      {/* Top Performer Card */}
      {topPerformer && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/20 p-3">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Melhor Avaliado no Período</p>
                <p className="text-xl font-bold">{topPerformer.name}</p>
                <div className="flex items-center gap-4 mt-1">
                  {renderStars(topPerformer.avgRating)}
                  <span className="text-sm text-muted-foreground">
                    ({topPerformer.ratedCount} avaliações)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Chamados por Prestador</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs fill-muted-foreground" />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={120} 
                className="text-xs fill-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="chamados" fill="hsl(var(--primary))" name="Total" />
              <Bar dataKey="concluídos" fill="hsl(var(--success))" name="Concluídos" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhamento por Prestador</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prestador</TableHead>
                <TableHead className="text-center">Chamados</TableHead>
                <TableHead className="text-center">Concluídos</TableHead>
                <TableHead className="text-center">Taxa</TableHead>
                <TableHead className="text-center">Tempo Médio</TableHead>
                <TableHead className="text-right">Custo Total</TableHead>
                <TableHead className="text-center">Avaliação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providerData.map(provider => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">{provider.name}</TableCell>
                  <TableCell className="text-center">{provider.total}</TableCell>
                  <TableCell className="text-center">{provider.completed}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={provider.completionRate} 
                        className="w-16 h-2"
                      />
                      <span className="text-xs text-muted-foreground">
                        {provider.completionRate.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {provider.avgDays > 0 ? `${provider.avgDays.toFixed(1)}d` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(provider.totalCost)}
                  </TableCell>
                  <TableCell className="text-center">
                    {provider.ratedCount > 0 ? renderStars(provider.avgRating) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
