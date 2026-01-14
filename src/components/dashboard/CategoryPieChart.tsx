import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { SERVICE_CATEGORY_LABELS } from '@/types/database';

interface CategoryData {
  category: string;
  count: number;
}

interface CategoryPieChartProps {
  data: CategoryData[];
}

const CATEGORY_COLORS: Record<string, string> = {
  encanador: 'hsl(217, 91%, 60%)',
  eletricista: 'hsl(38, 92%, 50%)',
  pintor: 'hsl(160, 84%, 39%)',
  jardineiro: 'hsl(142, 71%, 45%)',
  limpeza: 'hsl(187, 92%, 43%)',
  chaveiro: 'hsl(258, 90%, 66%)',
  vidraceiro: 'hsl(330, 81%, 60%)',
  porteiro: 'hsl(239, 84%, 67%)',
  outros: 'hsl(220, 9%, 46%)',
};

const chartConfig = Object.entries(SERVICE_CATEGORY_LABELS).reduce((acc, [key, label]) => {
  acc[key] = {
    label,
    color: CATEGORY_COLORS[key] || 'hsl(220, 9%, 46%)',
  };
  return acc;
}, {} as Record<string, { label: string; color: string }>);

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (data.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Chamados por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <PieChartIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-sm text-muted-foreground">
            Nenhum chamado registrado ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    name: SERVICE_CATEGORY_LABELS[item.category as keyof typeof SERVICE_CATEGORY_LABELS] || item.category,
    fill: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.outros,
  }));

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Chamados por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="count"
                nameKey="name"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [`${value} chamados`, name]}
                  />
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-2 text-center text-sm text-muted-foreground">
          Total: {total} chamados
        </div>
      </CardContent>
    </Card>
  );
}
