import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProviderData {
  name: string;
  average_rating: number | null;
  total_ratings: number | null;
}

interface ProviderRankingChartProps {
  data: ProviderData[];
}

const chartConfig = {
  rating: {
    label: 'Avaliação',
    color: 'hsl(var(--primary))',
  },
};

export function ProviderRankingChart({ data }: ProviderRankingChartProps) {
  if (data.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Ranking de Prestadores</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-sm text-muted-foreground">
            Nenhum prestador avaliado ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((provider, index) => ({
    ...provider,
    rating: provider.average_rating || 0,
    rank: index + 1,
  }));

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'hsl(38, 92%, 50%)'; // Gold
    if (rank === 2) return 'hsl(0, 0%, 70%)'; // Silver
    if (rank === 3) return 'hsl(30, 50%, 50%)'; // Bronze
    return 'hsl(var(--primary))';
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Top 5 Prestadores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {chartData.map((provider, index) => (
            <div
              key={provider.name}
              className="flex items-center gap-4 p-3 rounded-lg bg-muted/30"
            >
              <div
                className="flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold"
                style={{
                  backgroundColor: getRankColor(index + 1),
                  color: index < 3 ? 'white' : 'hsl(var(--primary-foreground))',
                }}
              >
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{provider.name}</p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span>{provider.total_ratings || 0} avaliações</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-warning text-warning" />
                <span className="font-semibold">
                  {(provider.average_rating || 0).toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
