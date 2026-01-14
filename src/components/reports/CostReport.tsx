import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ServiceCall, SERVICE_CATEGORY_LABELS, ServiceCategory } from '@/types/database';
import { FilterValues } from './AdvancedFilters';

interface CostReportProps {
  calls: ServiceCall[];
  filters: FilterValues;
}

export function CostReport({ calls, filters }: CostReportProps) {
  const completedCalls = calls.filter(c => c.status === 'completed');
  
  // Monthly cost data
  const monthlyData = completedCalls.reduce((acc, call) => {
    const monthKey = format(new Date(call.created_at), 'yyyy-MM');
    if (!acc[monthKey]) {
      acc[monthKey] = { estimated: 0, actual: 0, count: 0 };
    }
    acc[monthKey].estimated += Number(call.estimated_value) || 0;
    acc[monthKey].actual += Number(call.actual_value) || 0;
    acc[monthKey].count++;
    return acc;
  }, {} as Record<string, { estimated: number; actual: number; count: number }>);

  const monthlyChartData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      const date = new Date(key + '-01');
      return {
        month: format(date, 'MMM', { locale: ptBR }),
        orçado: value.estimated,
        realizado: value.actual,
        economia: value.estimated - value.actual,
      };
    });

  // Category cost data
  const categoryData = completedCalls.reduce((acc, call) => {
    if (!acc[call.category]) {
      acc[call.category] = { estimated: 0, actual: 0, count: 0 };
    }
    acc[call.category].estimated += Number(call.estimated_value) || 0;
    acc[call.category].actual += Number(call.actual_value) || 0;
    acc[call.category].count++;
    return acc;
  }, {} as Record<string, { estimated: number; actual: number; count: number }>);

  const categoryChartData = Object.entries(categoryData)
    .map(([category, value]) => ({
      category,
      name: SERVICE_CATEGORY_LABELS[category as ServiceCategory] || category,
      orçado: value.estimated,
      realizado: value.actual,
      diferenca: value.estimated - value.actual,
      percentual: value.estimated > 0 
        ? ((value.estimated - value.actual) / value.estimated) * 100 
        : 0,
      count: value.count,
    }))
    .sort((a, b) => b.realizado - a.realizado);

  // Totals
  const totalEstimated = completedCalls.reduce((sum, c) => sum + (Number(c.estimated_value) || 0), 0);
  const totalActual = completedCalls.reduce((sum, c) => sum + (Number(c.actual_value) || 0), 0);
  const totalDifference = totalEstimated - totalActual;
  const differencePercent = totalEstimated > 0 ? (totalDifference / totalEstimated) * 100 : 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getDifferenceIcon = (diff: number) => {
    if (diff > 0) return <TrendingDown className="h-4 w-4 text-success" />;
    if (diff < 0) return <TrendingUp className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  if (completedCalls.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhum chamado concluído no período selecionado.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Os dados de custo são baseados em chamados finalizados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orçado</p>
                <p className="text-2xl font-bold">{formatCurrency(totalEstimated)}</p>
              </div>
              <div className="rounded-lg p-3 bg-muted">
                <DollarSign className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Realizado</p>
                <p className="text-2xl font-bold">{formatCurrency(totalActual)}</p>
              </div>
              <div className="rounded-lg p-3 bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={totalDifference >= 0 ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {totalDifference >= 0 ? 'Economia' : 'Excedente'}
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(Math.abs(totalDifference))}
                </p>
                <p className="text-sm text-muted-foreground">
                  ({Math.abs(differencePercent).toFixed(1)}% {totalDifference >= 0 ? 'abaixo' : 'acima'})
                </p>
              </div>
              <div className={`rounded-lg p-3 ${totalDifference >= 0 ? 'bg-success/20' : 'bg-destructive/20'}`}>
                {getDifferenceIcon(totalDifference)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Evolution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evolução Mensal de Custos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
              <YAxis 
                className="text-xs fill-muted-foreground"
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="orçado" fill="hsl(var(--muted-foreground))" name="Orçado" />
              <Bar dataKey="realizado" fill="hsl(var(--primary))" name="Realizado" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Cost Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Custos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center">Chamados</TableHead>
                <TableHead className="text-right">Orçado</TableHead>
                <TableHead className="text-right">Realizado</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
                <TableHead className="text-center">Variação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryChartData.map(cat => (
                <TableRow key={cat.category}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-center">{cat.count}</TableCell>
                  <TableCell className="text-right">{formatCurrency(cat.orçado)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(cat.realizado)}</TableCell>
                  <TableCell className="text-right">
                    <span className={cat.diferenca >= 0 ? 'text-success' : 'text-destructive'}>
                      {formatCurrency(cat.diferenca)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline"
                      className={
                        cat.percentual > 0 
                          ? 'bg-success/10 text-success' 
                          : cat.percentual < 0 
                            ? 'bg-destructive/10 text-destructive' 
                            : ''
                      }
                    >
                      {cat.percentual >= 0 ? '+' : ''}{cat.percentual.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cost Alerts */}
      {categoryChartData.filter(c => c.percentual < -10).length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Categorias Acima do Orçado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categoryChartData
                .filter(c => c.percentual < -10)
                .map(cat => (
                  <div 
                    key={cat.category}
                    className="flex items-center justify-between p-3 rounded-lg border bg-background"
                  >
                    <div>
                      <p className="font-medium">{cat.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(Math.abs(cat.diferenca))} acima do orçado
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {cat.percentual.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
