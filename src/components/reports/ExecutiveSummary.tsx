import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle 
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ServiceCall, CALL_STATUS_LABELS } from '@/types/database';
import { FilterValues } from './AdvancedFilters';

interface ExecutiveSummaryProps {
  calls: ServiceCall[];
  filters: FilterValues;
}

export function ExecutiveSummary({ calls, filters }: ExecutiveSummaryProps) {
  // Calculate statistics
  const totalCalls = calls.length;
  const completedCalls = calls.filter(c => c.status === 'completed');
  const openCalls = calls.filter(c => ['open', 'sent', 'awaiting_approval', 'in_progress'].includes(c.status));
  const cancelledCalls = calls.filter(c => c.status === 'cancelled');

  // Financial metrics
  const totalEstimated = calls.reduce((sum, c) => sum + (Number(c.estimated_value) || 0), 0);
  const totalActual = completedCalls.reduce((sum, c) => sum + (Number(c.actual_value) || 0), 0);
  const savings = totalEstimated - totalActual;
  const savingsPercent = totalEstimated > 0 ? (savings / totalEstimated) * 100 : 0;

  // Resolution time
  const resolutionTimes = completedCalls.map(c => 
    differenceInDays(new Date(c.updated_at), new Date(c.created_at)) || 1
  );
  const avgResolutionTime = resolutionTimes.length > 0
    ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
    : 0;

  // Completion rate
  const completionRate = totalCalls > 0 
    ? (completedCalls.length / (totalCalls - cancelledCalls.length)) * 100 
    : 0;

  // Ratings
  const ratedCalls = completedCalls.filter(c => c.rating !== null);
  const avgRating = ratedCalls.length > 0
    ? ratedCalls.reduce((sum, c) => sum + (c.rating || 0), 0) / ratedCalls.length
    : 0;

  // Status distribution
  const statusDistribution = calls.reduce((acc, call) => {
    acc[call.status] = (acc[call.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resumo Executivo
          </CardTitle>
          <CardDescription>
            Período: {format(filters.startDate, "dd 'de' MMMM", { locale: ptBR })} a{' '}
            {format(filters.endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Chamados</p>
                <p className="text-3xl font-bold">{totalCalls}</p>
              </div>
              <div className="rounded-lg p-3 bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex gap-2 text-sm">
              <Badge variant="outline" className="bg-success/10 text-success">
                {completedCalls.length} concluídos
              </Badge>
              <Badge variant="outline" className="bg-warning/10 text-warning">
                {openCalls.length} em aberto
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
                <p className="text-3xl font-bold">{completionRate.toFixed(0)}%</p>
              </div>
              <div className="rounded-lg p-3 bg-success/10">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              {completedCalls.length} de {totalCalls - cancelledCalls.length} chamados
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio de Resolução</p>
                <p className="text-3xl font-bold">{avgResolutionTime.toFixed(1)}d</p>
              </div>
              <div className="rounded-lg p-3 bg-info/10">
                <Clock className="h-6 w-6 text-info" />
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Baseado em {completedCalls.length} chamados concluídos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Custo Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totalActual)}</p>
              </div>
              <div className="rounded-lg p-3 bg-accent/10">
                <DollarSign className="h-6 w-6 text-accent" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm">
              {savings >= 0 ? (
                <>
                  <TrendingDown className="h-4 w-4 text-success" />
                  <span className="text-success font-medium">
                    {formatCurrency(savings)} economizados ({savingsPercent.toFixed(1)}%)
                  </span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 text-destructive" />
                  <span className="text-destructive font-medium">
                    {formatCurrency(Math.abs(savings))} acima do orçado
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution & Ratings */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statusDistribution).map(([status, count]) => {
                const percentage = (count / totalCalls) * 100;
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{CALL_STATUS_LABELS[status as keyof typeof CALL_STATUS_LABELS]}</span>
                      <span className="text-muted-foreground">{count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-32">
              {ratedCalls.length > 0 ? (
                <>
                  <div className="text-4xl font-bold">{avgRating.toFixed(1)}</div>
                  <div className="flex items-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span 
                        key={star} 
                        className={`text-2xl ${star <= avgRating ? 'text-warning' : 'text-muted'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Baseado em {ratedCalls.length} avaliações
                  </p>
                </>
              ) : (
                <div className="text-center text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma avaliação no período</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
