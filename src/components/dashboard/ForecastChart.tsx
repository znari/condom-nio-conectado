import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, HelpCircle } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MonthlyData {
  month: string;
  value: number;
}

interface ForecastData {
  month: string;
  actual?: number;
  forecast?: number;
  upperBound?: number;
  lowerBound?: number;
}

interface ForecastChartProps {
  historicalData: MonthlyData[];
  title?: string;
  valueLabel?: string;
}

// Simple moving average with trend projection
function calculateForecast(data: MonthlyData[], monthsToForecast: number = 3): ForecastData[] {
  if (data.length < 3) return [];

  const result: ForecastData[] = [];
  
  // Add historical data
  data.forEach(d => {
    result.push({
      month: d.month,
      actual: d.value,
    });
  });

  // Calculate moving average (last 3 months)
  const recentValues = data.slice(-3).map(d => d.value);
  const movingAverage = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
  
  // Calculate trend (simple linear trend from last 6 months or all available)
  const trendData = data.slice(-6);
  let trend = 0;
  if (trendData.length >= 2) {
    const firstHalf = trendData.slice(0, Math.floor(trendData.length / 2));
    const secondHalf = trendData.slice(Math.floor(trendData.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b.value, 0) / secondHalf.length;
    trend = (secondAvg - firstAvg) / (trendData.length / 2);
  }

  // Generate forecasts
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const lastMonthIndex = months.findIndex(m => data[data.length - 1].month.startsWith(m));
  
  for (let i = 1; i <= monthsToForecast; i++) {
    const forecastValue = Math.max(0, Math.round(movingAverage + (trend * i)));
    const variance = Math.max(1, Math.round(movingAverage * 0.2)); // 20% variance
    
    const monthIndex = (lastMonthIndex + i) % 12;
    const monthName = months[monthIndex];
    
    result.push({
      month: `${monthName}*`,
      forecast: forecastValue,
      upperBound: forecastValue + variance,
      lowerBound: Math.max(0, forecastValue - variance),
    });
  }

  return result;
}

export function ForecastChart({ historicalData, title = 'Previsão de Demanda', valueLabel = 'Chamados' }: ForecastChartProps) {
  const forecastData = calculateForecast(historicalData);

  if (forecastData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[250px] text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              Dados insuficientes para gerar previsão.
            </p>
            <p className="text-sm text-muted-foreground/70">
              Mínimo de 3 meses de histórico necessário.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {title}
          </div>
          <UITooltip>
            <TooltipTrigger>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">
                Previsão baseada em média móvel e tendência dos últimos meses. 
                A área sombreada representa a margem de variação estimada.
              </p>
            </TooltipContent>
          </UITooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-xs fill-muted-foreground"
              tickLine={false}
            />
            <YAxis 
              className="text-xs fill-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  actual: 'Real',
                  forecast: 'Previsão',
                  upperBound: 'Limite Superior',
                  lowerBound: 'Limite Inferior',
                };
                return [value, labels[name] || name];
              }}
            />
            <Legend 
              formatter={(value) => {
                const labels: Record<string, string> = {
                  actual: `${valueLabel} (Real)`,
                  forecast: `${valueLabel} (Previsão)`,
                };
                return labels[value] || value;
              }}
            />
            
            {/* Confidence interval area */}
            <Area
              type="monotone"
              dataKey="upperBound"
              stackId="confidence"
              stroke="none"
              fill="hsl(var(--primary))"
              fillOpacity={0}
            />
            <Area
              type="monotone"
              dataKey="lowerBound"
              stackId="confidence"
              stroke="none"
              fill="hsl(var(--primary))"
              fillOpacity={0.1}
            />
            
            {/* Actual data */}
            <Area
              type="monotone"
              dataKey="actual"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            
            {/* Forecast line */}
            <Area
              type="monotone"
              dataKey="forecast"
              stroke="hsl(var(--success))"
              fill="hsl(var(--success))"
              fillOpacity={0.2}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </AreaChart>
        </ResponsiveContainer>
        
        <p className="text-xs text-muted-foreground text-center mt-2">
          * Meses com asterisco são projeções baseadas no histórico
        </p>
      </CardContent>
    </Card>
  );
}
