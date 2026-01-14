import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { DollarSign } from 'lucide-react';

interface CostData {
  month: string;
  estimated: number;
  actual: number;
}

interface CostComparisonChartProps {
  data: CostData[];
}

const chartConfig = {
  estimated: {
    label: 'Estimado',
    color: 'hsl(var(--primary))',
  },
  actual: {
    label: 'Realizado',
    color: 'hsl(var(--success))',
  },
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function CostComparisonChart({ data }: CostComparisonChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparativo de Custos</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] flex-col items-center justify-center text-muted-foreground">
          <DollarSign className="mb-2 h-12 w-12 opacity-50" />
          <p className="text-center text-sm">
            Nenhum serviço concluído com valores no período.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalEstimated = data.reduce((sum, item) => sum + item.estimated, 0);
  const totalActual = data.reduce((sum, item) => sum + item.actual, 0);
  const difference = totalEstimated - totalActual;
  const differencePercent = totalEstimated > 0 ? ((difference / totalEstimated) * 100).toFixed(1) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Comparativo de Custos</CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">Estimado</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-success" />
              <span className="text-muted-foreground">Realizado</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Total Estimado</p>
            <p className="text-lg font-semibold text-primary">{formatCurrency(totalEstimated)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Realizado</p>
            <p className="text-lg font-semibold text-success">{formatCurrency(totalActual)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {difference >= 0 ? 'Economia' : 'Excedente'}
            </p>
            <p className={`text-lg font-semibold ${difference >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(Math.abs(difference))} ({differencePercent}%)
            </p>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                className="text-xs fill-muted-foreground"
              />
              <YAxis
                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                tickLine={false}
                axisLine={false}
                className="text-xs fill-muted-foreground"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      const label = name === 'estimated' ? 'Estimado' : 'Realizado';
                      return [formatCurrency(Number(value)), label];
                    }}
                  />
                }
              />
              <Bar dataKey="estimated" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
