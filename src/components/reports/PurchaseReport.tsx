import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Package,
  ShoppingBag,
} from 'lucide-react';
import { format, parseISO, startOfMonth, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PurchaseRequest, PURCHASE_CATEGORY_LABELS } from '@/types/database';
import type { FilterValues } from './AdvancedFilters';

interface PurchaseReportProps {
  purchases: PurchaseRequest[];
  filters: FilterValues;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(220, 70%, 50%)',
  'hsl(160, 60%, 45%)',
  'hsl(30, 80%, 55%)',
  'hsl(280, 60%, 55%)',
  'hsl(0, 70%, 50%)',
  'hsl(190, 70%, 45%)',
  'hsl(45, 80%, 50%)',
  'hsl(320, 60%, 50%)',
  'hsl(100, 50%, 45%)',
];

export function PurchaseReport({ purchases, filters }: PurchaseReportProps) {
  // Filter only purchased requests for cost analysis
  const purchasedRequests = useMemo(
    () => purchases.filter((p) => p.status === 'purchased'),
    [purchases]
  );

  // Monthly data
  const monthlyData = useMemo(() => {
    const months: Record<string, { estimated: number; actual: number; count: number }> = {};

    purchasedRequests.forEach((purchase) => {
      const date = parseISO(purchase.purchased_at || purchase.created_at);
      const monthKey = format(startOfMonth(date), 'yyyy-MM');

      if (!months[monthKey]) {
        months[monthKey] = { estimated: 0, actual: 0, count: 0 };
      }

      months[monthKey].estimated += Number(purchase.estimated_value) || 0;
      months[monthKey].actual += Number(purchase.actual_value) || 0;
      months[monthKey].count += 1;
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: format(parseISO(month + '-01'), 'MMM/yy', { locale: ptBR }),
        estimado: data.estimated,
        realizado: data.actual,
        quantidade: data.count,
      }));
  }, [purchasedRequests]);

  // Category data
  const categoryData = useMemo(() => {
    const categories: Record<string, { count: number; estimated: number; actual: number }> = {};

    purchasedRequests.forEach((purchase) => {
      if (!categories[purchase.category]) {
        categories[purchase.category] = { count: 0, estimated: 0, actual: 0 };
      }
      categories[purchase.category].count += 1;
      categories[purchase.category].estimated += Number(purchase.estimated_value) || 0;
      categories[purchase.category].actual += Number(purchase.actual_value) || 0;
    });

    return Object.entries(categories)
      .map(([category, data]) => ({
        category,
        label: PURCHASE_CATEGORY_LABELS[category as keyof typeof PURCHASE_CATEGORY_LABELS],
        ...data,
        difference: data.estimated - data.actual,
        percentDiff: data.estimated > 0 
          ? ((data.estimated - data.actual) / data.estimated) * 100 
          : 0,
      }))
      .sort((a, b) => b.actual - a.actual);
  }, [purchasedRequests]);

  // Pie chart data for category distribution
  const pieData = useMemo(() => {
    return categoryData.map((cat) => ({
      name: cat.label,
      value: cat.actual,
    }));
  }, [categoryData]);

  // Summary totals
  const totals = useMemo(() => {
    const estimated = purchasedRequests.reduce(
      (sum, p) => sum + (Number(p.estimated_value) || 0),
      0
    );
    const actual = purchasedRequests.reduce(
      (sum, p) => sum + (Number(p.actual_value) || 0),
      0
    );
    const difference = estimated - actual;
    const percentDiff = estimated > 0 ? (difference / estimated) * 100 : 0;

    return { estimated, actual, difference, percentDiff };
  }, [purchasedRequests]);

  // Status summary for all purchases
  const statusSummary = useMemo(() => {
    return {
      total: purchases.length,
      pending: purchases.filter((p) => p.status === 'pending').length,
      approved: purchases.filter((p) => p.status === 'approved').length,
      purchased: purchases.filter((p) => p.status === 'purchased').length,
      rejected: purchases.filter((p) => p.status === 'rejected').length,
    };
  }, [purchases]);

  // Categories exceeding budget
  const overBudgetCategories = categoryData.filter((cat) => cat.percentDiff < -10);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const getDifferenceIcon = (diff: number) => {
    if (diff > 0) return <TrendingDown className="h-4 w-4 text-success" />;
    if (diff < 0) return <TrendingUp className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  if (purchases.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Nenhuma solicitação de compra encontrada no período selecionado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-2xl font-bold">{statusSummary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Pendentes</div>
            <div className="text-2xl font-bold text-yellow-600">{statusSummary.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Aprovadas</div>
            <div className="text-2xl font-bold text-blue-600">{statusSummary.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Compradas</div>
            <div className="text-2xl font-bold text-green-600">{statusSummary.purchased}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Rejeitadas</div>
            <div className="text-2xl font-bold text-red-600">{statusSummary.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Summary Cards */}
      {purchasedRequests.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Estimado</span>
                </div>
                <div className="text-2xl font-bold mt-2">
                  {formatCurrency(totals.estimated)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {purchasedRequests.length} compra{purchasedRequests.length !== 1 ? 's' : ''} realizada{purchasedRequests.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Realizado</span>
                </div>
                <div className="text-2xl font-bold mt-2">
                  {formatCurrency(totals.actual)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  {getDifferenceIcon(totals.difference)}
                  <span className="text-sm text-muted-foreground">
                    {totals.difference >= 0 ? 'Economia' : 'Excedente'}
                  </span>
                </div>
                <div
                  className={`text-2xl font-bold mt-2 ${
                    totals.difference >= 0 ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {formatCurrency(Math.abs(totals.difference))}
                </div>
                <p
                  className={`text-sm mt-1 ${
                    totals.difference >= 0 ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {Math.abs(totals.percentDiff).toFixed(1)}%{' '}
                  {totals.difference >= 0 ? 'abaixo' : 'acima'} do orçado
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Chart */}
          {monthlyData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Evolução Mensal de Compras</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis
                        tickFormatter={(value) =>
                          new Intl.NumberFormat('pt-BR', {
                            notation: 'compact',
                            compactDisplay: 'short',
                          }).format(value)
                        }
                        className="text-xs"
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label) => `Período: ${label}`}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="estimado"
                        name="Estimado"
                        fill="hsl(var(--muted-foreground))"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="realizado"
                        name="Realizado"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        labelLine={false}
                      >
                        {pieData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Table */}
            <Card>
              <CardHeader>
                <CardTitle>Custos por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Orçado</TableHead>
                      <TableHead className="text-right">Real</TableHead>
                      <TableHead className="text-right">Var%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryData.map((cat) => (
                      <TableRow key={cat.category}>
                        <TableCell className="font-medium">{cat.label}</TableCell>
                        <TableCell className="text-right">{cat.count}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(cat.estimated)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(cat.actual)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              cat.percentDiff >= 0
                                ? 'text-success'
                                : 'text-destructive'
                            }
                          >
                            {cat.percentDiff >= 0 ? '+' : ''}
                            {cat.percentDiff.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Over Budget Alerts */}
          {overBudgetCategories.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Categorias Acima do Orçamento</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1">
                  {overBudgetCategories.map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between">
                      <span>{cat.label}</span>
                      <Badge variant="destructive">
                        {Math.abs(cat.percentDiff).toFixed(1)}% acima
                      </Badge>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {purchasedRequests.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Nenhuma compra finalizada para análise de custos. As compras aparecerão aqui após serem marcadas como "Comprado".
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
