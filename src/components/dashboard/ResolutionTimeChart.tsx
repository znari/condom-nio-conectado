import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { Clock } from 'lucide-react';
import { SERVICE_CATEGORY_LABELS, ServiceCategory } from '@/types/database';

interface ResolutionData {
  category: string;
  categoryLabel: string;
  averageDays: number;
  totalCalls: number;
}

interface ResolutionTimeChartProps {
  data: ResolutionData[];
}

const getResolutionColor = (days: number): string => {
  if (days <= 3) return 'hsl(142, 71%, 45%)'; // Green - Fast
  if (days <= 7) return 'hsl(38, 92%, 50%)';  // Yellow - Medium
  return 'hsl(0, 84%, 60%)';                   // Red - Slow
};

const chartConfig = {
  averageDays: {
    label: 'Tempo Médio',
    color: 'hsl(var(--primary))',
  },
};

export function ResolutionTimeChart({ data }: ResolutionTimeChartProps) {
  if (data.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">
            Tempo Médio de Resolução por Categoria
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground text-sm">
            Nenhum chamado concluído no período para analisar tempo de resolução.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by average days descending
  const sortedData = [...data].sort((a, b) => b.averageDays - a.averageDays);

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          Tempo Médio de Resolução por Categoria
        </CardTitle>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(142, 71%, 45%)' }} />
            ≤3 dias
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(38, 92%, 50%)' }} />
            4-7 dias
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(0, 84%, 60%)' }} />
            &gt;7 dias
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}d`}
                className="text-xs fill-muted-foreground"
              />
              <YAxis
                type="category"
                dataKey="categoryLabel"
                tickLine={false}
                axisLine={false}
                width={90}
                className="text-xs fill-muted-foreground"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, props) => {
                      const item = props.payload;
                      return (
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{item.categoryLabel}</span>
                          <span>Tempo médio: {Number(value).toFixed(1)} dias</span>
                          <span className="text-muted-foreground">
                            {item.totalCalls} chamado{item.totalCalls !== 1 ? 's' : ''} concluído{item.totalCalls !== 1 ? 's' : ''}
                          </span>
                        </div>
                      );
                    }}
                  />
                }
              />
              <Bar dataKey="averageDays" radius={[0, 4, 4, 0]}>
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getResolutionColor(entry.averageDays)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
