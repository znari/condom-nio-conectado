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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Clock, CheckCircle, AlertTriangle, Gauge } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { ServiceCall, SERVICE_CATEGORY_LABELS, ServiceCategory } from '@/types/database';

interface EfficiencyReportProps {
  calls: ServiceCall[];
}

// Efficiency thresholds (in days)
const FAST_THRESHOLD = 3;
const MEDIUM_THRESHOLD = 7;

export function EfficiencyReport({ calls }: EfficiencyReportProps) {
  const completedCalls = calls.filter(c => c.status === 'completed');

  // Calculate resolution time for each completed call
  const callsWithResolution = completedCalls.map(call => ({
    ...call,
    resolutionDays: differenceInDays(new Date(call.updated_at), new Date(call.created_at)) || 1,
  }));

  // Group by category
  const categoryStats = callsWithResolution.reduce((acc, call) => {
    if (!acc[call.category]) {
      acc[call.category] = {
        totalDays: 0,
        count: 0,
        fast: 0,
        medium: 0,
        slow: 0,
      };
    }
    
    acc[call.category].totalDays += call.resolutionDays;
    acc[call.category].count++;
    
    if (call.resolutionDays <= FAST_THRESHOLD) {
      acc[call.category].fast++;
    } else if (call.resolutionDays <= MEDIUM_THRESHOLD) {
      acc[call.category].medium++;
    } else {
      acc[call.category].slow++;
    }
    
    return acc;
  }, {} as Record<string, { totalDays: number; count: number; fast: number; medium: number; slow: number }>);

  const categoryData = Object.entries(categoryStats)
    .map(([category, stats]) => ({
      category,
      name: SERVICE_CATEGORY_LABELS[category as ServiceCategory] || category,
      avgDays: stats.count > 0 ? stats.totalDays / stats.count : 0,
      count: stats.count,
      fast: stats.fast,
      medium: stats.medium,
      slow: stats.slow,
      fastPercent: stats.count > 0 ? (stats.fast / stats.count) * 100 : 0,
    }))
    .sort((a, b) => a.avgDays - b.avgDays);

  // Chart data
  const chartData = categoryData.map(cat => ({
    name: cat.name.length > 12 ? cat.name.substring(0, 12) + '...' : cat.name,
    dias: cat.avgDays,
    category: cat.category,
  }));

  const getBarColor = (days: number) => {
    if (days <= FAST_THRESHOLD) return 'hsl(var(--success))';
    if (days <= MEDIUM_THRESHOLD) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  // Overall stats
  const totalResolutionDays = callsWithResolution.reduce((sum, c) => sum + c.resolutionDays, 0);
  const avgResolutionDays = callsWithResolution.length > 0 
    ? totalResolutionDays / callsWithResolution.length 
    : 0;
  const fastCount = callsWithResolution.filter(c => c.resolutionDays <= FAST_THRESHOLD).length;
  const mediumCount = callsWithResolution.filter(c => c.resolutionDays > FAST_THRESHOLD && c.resolutionDays <= MEDIUM_THRESHOLD).length;
  const slowCount = callsWithResolution.filter(c => c.resolutionDays > MEDIUM_THRESHOLD).length;

  if (completedCalls.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhum chamado concluído no período selecionado.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Os dados de eficiência são baseados em chamados finalizados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
                <p className="text-3xl font-bold">{avgResolutionDays.toFixed(1)}d</p>
              </div>
              <div className="rounded-lg p-3 bg-primary/10">
                <Gauge className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rápidos (≤{FAST_THRESHOLD}d)</p>
                <p className="text-3xl font-bold text-success">{fastCount}</p>
              </div>
              <div className="rounded-lg p-3 bg-success/10">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Médios ({FAST_THRESHOLD+1}-{MEDIUM_THRESHOLD}d)</p>
                <p className="text-3xl font-bold text-warning">{mediumCount}</p>
              </div>
              <div className="rounded-lg p-3 bg-warning/10">
                <Clock className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lentos ({'>'}{MEDIUM_THRESHOLD}d)</p>
                <p className="text-3xl font-bold text-destructive">{slowCount}</p>
              </div>
              <div className="rounded-lg p-3 bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Efficiency Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribuição de Eficiência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-success" />
                    Rápido (≤{FAST_THRESHOLD} dias)
                  </span>
                  <span>{fastCount} ({((fastCount / completedCalls.length) * 100).toFixed(0)}%)</span>
                </div>
                <Progress 
                  value={(fastCount / completedCalls.length) * 100} 
                  className="h-3"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-warning" />
                    Médio ({FAST_THRESHOLD+1}-{MEDIUM_THRESHOLD} dias)
                  </span>
                  <span>{mediumCount} ({((mediumCount / completedCalls.length) * 100).toFixed(0)}%)</span>
                </div>
                <Progress 
                  value={(mediumCount / completedCalls.length) * 100} 
                  className="h-3 [&>div]:bg-warning"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-destructive" />
                    Lento ({'>'}{MEDIUM_THRESHOLD} dias)
                  </span>
                  <span>{slowCount} ({((slowCount / completedCalls.length) * 100).toFixed(0)}%)</span>
                </div>
                <Progress 
                  value={(slowCount / completedCalls.length) * 100} 
                  className="h-3 [&>div]:bg-destructive"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tempo Médio por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                type="number" 
                className="text-xs fill-muted-foreground"
                tickFormatter={(v) => `${v}d`}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={100} 
                className="text-xs fill-muted-foreground"
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)} dias`, 'Tempo médio']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="dias" name="Dias">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.dias)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhamento por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center">Concluídos</TableHead>
                <TableHead className="text-center">Tempo Médio</TableHead>
                <TableHead className="text-center">Rápidos</TableHead>
                <TableHead className="text-center">Médios</TableHead>
                <TableHead className="text-center">Lentos</TableHead>
                <TableHead className="text-center">Eficiência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryData.map(cat => (
                <TableRow key={cat.category}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-center">{cat.count}</TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline"
                      className={
                        cat.avgDays <= FAST_THRESHOLD 
                          ? 'bg-success/10 text-success' 
                          : cat.avgDays <= MEDIUM_THRESHOLD 
                            ? 'bg-warning/10 text-warning' 
                            : 'bg-destructive/10 text-destructive'
                      }
                    >
                      {cat.avgDays.toFixed(1)}d
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-success">{cat.fast}</TableCell>
                  <TableCell className="text-center text-warning">{cat.medium}</TableCell>
                  <TableCell className="text-center text-destructive">{cat.slow}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Progress value={cat.fastPercent} className="w-16 h-2" />
                      <span className="text-xs text-muted-foreground">
                        {cat.fastPercent.toFixed(0)}%
                      </span>
                    </div>
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
