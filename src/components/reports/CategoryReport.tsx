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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { ServiceCall, SERVICE_CATEGORY_LABELS, ServiceCategory } from '@/types/database';

interface CategoryReportProps {
  calls: ServiceCall[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(var(--info))',
  'hsl(var(--accent))',
  'hsl(210, 50%, 50%)',
  'hsl(270, 50%, 50%)',
  'hsl(330, 50%, 50%)',
];

export function CategoryReport({ calls }: CategoryReportProps) {
  // Group by category
  const categoryStats = calls.reduce((acc, call) => {
    if (!acc[call.category]) {
      acc[call.category] = {
        total: 0,
        completed: 0,
        totalCost: 0,
        totalDays: 0,
        completedCount: 0,
      };
    }
    
    acc[call.category].total++;
    
    if (call.status === 'completed') {
      acc[call.category].completed++;
      acc[call.category].totalCost += Number(call.actual_value) || 0;
      acc[call.category].totalDays += differenceInDays(
        new Date(call.updated_at),
        new Date(call.created_at)
      ) || 1;
      acc[call.category].completedCount++;
    }
    
    return acc;
  }, {} as Record<string, { total: number; completed: number; totalCost: number; totalDays: number; completedCount: number }>);

  const categoryData = Object.entries(categoryStats).map(([category, stats]) => ({
    category,
    label: SERVICE_CATEGORY_LABELS[category as ServiceCategory] || category,
    total: stats.total,
    completed: stats.completed,
    completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
    totalCost: stats.totalCost,
    avgCost: stats.completedCount > 0 ? stats.totalCost / stats.completedCount : 0,
    avgDays: stats.completedCount > 0 ? stats.totalDays / stats.completedCount : 0,
  }));

  // Sort by total descending
  categoryData.sort((a, b) => b.total - a.total);

  // Pie chart data
  const pieData = categoryData.map(d => ({
    name: d.label,
    value: d.total,
  }));

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (calls.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <PieChartIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhum chamado encontrado para o período selecionado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} chamado${value !== 1 ? 's' : ''}`, 'Total']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Categorias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryData.slice(0, 5).map((cat, index) => (
              <div 
                key={cat.category}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div>
                    <p className="font-medium">{cat.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {cat.total} chamado{cat.total !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">
                  {cat.completionRate.toFixed(0)}% concluídos
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

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
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Concluídos</TableHead>
                <TableHead className="text-center">Taxa</TableHead>
                <TableHead className="text-right">Custo Total</TableHead>
                <TableHead className="text-right">Custo Médio</TableHead>
                <TableHead className="text-center">Tempo Médio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryData.map(cat => (
                <TableRow key={cat.category}>
                  <TableCell className="font-medium">{cat.label}</TableCell>
                  <TableCell className="text-center">{cat.total}</TableCell>
                  <TableCell className="text-center">{cat.completed}</TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline" 
                      className={
                        cat.completionRate >= 80 
                          ? 'bg-success/10 text-success' 
                          : cat.completionRate >= 50 
                            ? 'bg-warning/10 text-warning' 
                            : 'bg-muted'
                      }
                    >
                      {cat.completionRate.toFixed(0)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(cat.totalCost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(cat.avgCost)}</TableCell>
                  <TableCell className="text-center">
                    {cat.avgDays > 0 ? `${cat.avgDays.toFixed(1)} dias` : '-'}
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
