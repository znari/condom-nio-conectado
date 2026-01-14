import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PeriodStats {
  totalCalls: number;
  completedCalls: number;
  avgResolutionDays: number;
  totalCost: number;
}

interface PeriodComparisonCardProps {
  currentPeriod: PeriodStats;
  previousPeriod: PeriodStats;
  currentLabel: string;
  previousLabel: string;
}

function calculateVariation(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function getVariationIcon(value: number, invertLogic = false) {
  const isPositive = invertLogic ? value < 0 : value > 0;
  if (Math.abs(value) < 0.5) return <Minus className="h-4 w-4" />;
  return isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
}

function getVariationColor(value: number, invertLogic = false): string {
  const isPositive = invertLogic ? value < 0 : value > 0;
  if (Math.abs(value) < 0.5) return 'text-muted-foreground';
  return isPositive ? 'text-success' : 'text-destructive';
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface MetricCardProps {
  title: string;
  currentValue: string | number;
  previousValue: string | number;
  variation: number;
  invertLogic?: boolean;
  suffix?: string;
}

function MetricCard({ title, currentValue, previousValue, variation, invertLogic = false, suffix = '' }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted/30 border border-border/50">
      <span className="text-xs text-muted-foreground font-medium">{title}</span>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold">
          {currentValue}{suffix}
        </span>
        <div className={cn('flex items-center gap-1 text-sm font-medium', getVariationColor(variation, invertLogic))}>
          {getVariationIcon(variation, invertLogic)}
          <span>{Math.abs(variation).toFixed(0)}%</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">
        Anterior: {previousValue}{suffix}
      </span>
    </div>
  );
}

export function PeriodComparisonCard({
  currentPeriod,
  previousPeriod,
  currentLabel,
  previousLabel,
}: PeriodComparisonCardProps) {
  const callsVariation = calculateVariation(currentPeriod.totalCalls, previousPeriod.totalCalls);
  const completionVariation = calculateVariation(
    currentPeriod.totalCalls > 0 ? (currentPeriod.completedCalls / currentPeriod.totalCalls) * 100 : 0,
    previousPeriod.totalCalls > 0 ? (previousPeriod.completedCalls / previousPeriod.totalCalls) * 100 : 0
  );
  const resolutionVariation = calculateVariation(currentPeriod.avgResolutionDays, previousPeriod.avgResolutionDays);
  const costVariation = calculateVariation(currentPeriod.totalCost, previousPeriod.totalCost);

  const currentCompletionRate = currentPeriod.totalCalls > 0 
    ? Math.round((currentPeriod.completedCalls / currentPeriod.totalCalls) * 100) 
    : 0;
  const previousCompletionRate = previousPeriod.totalCalls > 0 
    ? Math.round((previousPeriod.completedCalls / previousPeriod.totalCalls) * 100) 
    : 0;

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base font-semibold">
            Comparativo de Períodos
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {currentLabel} vs {previousLabel}
          </p>
        </div>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total de Chamados"
            currentValue={currentPeriod.totalCalls}
            previousValue={previousPeriod.totalCalls}
            variation={callsVariation}
          />
          <MetricCard
            title="Taxa de Conclusão"
            currentValue={currentCompletionRate}
            previousValue={previousCompletionRate}
            variation={completionVariation}
            suffix="%"
          />
          <MetricCard
            title="Tempo Médio (dias)"
            currentValue={currentPeriod.avgResolutionDays.toFixed(1)}
            previousValue={previousPeriod.avgResolutionDays.toFixed(1)}
            variation={resolutionVariation}
            invertLogic={true}
          />
          <MetricCard
            title="Custo Total"
            currentValue={formatCurrency(currentPeriod.totalCost)}
            previousValue={formatCurrency(previousPeriod.totalCost)}
            variation={costVariation}
            invertLogic={true}
          />
        </div>
      </CardContent>
    </Card>
  );
}
