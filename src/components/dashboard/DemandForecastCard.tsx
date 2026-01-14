import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Calendar, DollarSign, Layers } from 'lucide-react';
import { SERVICE_CATEGORY_LABELS, ServiceCategory } from '@/types/database';

interface CategoryForecast {
  category: ServiceCategory;
  currentMonthCount: number;
  forecastCount: number;
  trend: 'up' | 'down' | 'stable';
}

interface DemandForecastCardProps {
  categoryData: { category: string; count: number }[];
  historicalCategoryData?: { category: string; avgCount: number }[];
  estimatedCost?: number;
}

export function DemandForecastCard({ 
  categoryData, 
  historicalCategoryData = [],
  estimatedCost = 0 
}: DemandForecastCardProps) {
  // Calculate forecasts by comparing current data with historical averages
  const forecasts: CategoryForecast[] = categoryData.map(current => {
    const historical = historicalCategoryData.find(h => h.category === current.category);
    const avgCount = historical?.avgCount || current.count;
    
    const difference = current.count - avgCount;
    const percentChange = avgCount > 0 ? (difference / avgCount) * 100 : 0;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (percentChange > 10) trend = 'up';
    else if (percentChange < -10) trend = 'down';
    
    // Simple forecast: current + trend adjustment
    const trendMultiplier = trend === 'up' ? 1.1 : trend === 'down' ? 0.9 : 1;
    const forecastCount = Math.round(current.count * trendMultiplier);
    
    return {
      category: current.category as ServiceCategory,
      currentMonthCount: current.count,
      forecastCount,
      trend,
    };
  });

  // Sort by forecast count descending
  forecasts.sort((a, b) => b.forecastCount - a.forecastCount);
  const topCategories = forecasts.slice(0, 4);

  // Calculate total forecast
  const totalCurrentMonth = categoryData.reduce((sum, c) => sum + c.count, 0);
  const totalForecast = forecasts.reduce((sum, f) => sum + f.forecastCount, 0);
  const overallTrend = totalForecast > totalCurrentMonth ? 'up' : totalForecast < totalCurrentMonth ? 'down' : 'stable';

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-destructive" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-success" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendLabel = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'Aumento previsto';
      case 'down': return 'Redução prevista';
      default: return 'Estável';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          Previsão para Próximo Período
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall forecast */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div>
            <p className="text-sm text-muted-foreground">Total de chamados previstos</p>
            <p className="text-2xl font-bold">{totalForecast}</p>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon(overallTrend)}
            <span className="text-sm text-muted-foreground">
              {getTrendLabel(overallTrend)}
            </span>
          </div>
        </div>

        {/* Cost estimate if available */}
        {estimatedCost > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Custo estimado</span>
            </div>
            <span className="font-medium">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedCost)}
            </span>
          </div>
        )}

        {/* Top categories */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Categorias com maior demanda</span>
          </div>
          <div className="space-y-2">
            {topCategories.map((forecast) => (
              <div 
                key={forecast.category}
                className="flex items-center justify-between p-2 rounded border"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {SERVICE_CATEGORY_LABELS[forecast.category]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    ~{forecast.forecastCount} chamado{forecast.forecastCount !== 1 ? 's' : ''}
                  </Badge>
                  {getTrendIcon(forecast.trend)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {forecasts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Dados insuficientes para gerar previsão</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
