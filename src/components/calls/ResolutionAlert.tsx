import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, Clock } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { ServiceCategory, ResolutionTimeAlert } from '@/types/database';

interface ResolutionAlertProps {
  category: ServiceCategory;
  createdAt: string;
  status: string;
}

export function ResolutionAlert({ category, createdAt, status }: ResolutionAlertProps) {
  const { profile } = useAuth();

  const { data: alertConfig } = useQuery({
    queryKey: ['resolution-alert-config', profile?.condominium_id, category],
    queryFn: async () => {
      if (!profile?.condominium_id) return null;
      const { data, error } = await supabase
        .from('resolution_time_alerts')
        .select('*')
        .eq('condominium_id', profile.condominium_id)
        .eq('category', category)
        .eq('enabled', true)
        .maybeSingle();
      
      if (error) throw error;
      return data as ResolutionTimeAlert | null;
    },
    enabled: !!profile?.condominium_id && !['completed', 'cancelled'].includes(status),
  });

  // Don't show alerts for completed or cancelled calls
  if (['completed', 'cancelled'].includes(status)) {
    return null;
  }

  // No config for this category
  if (!alertConfig) {
    return null;
  }

  const daysElapsed = differenceInDays(new Date(), new Date(createdAt));
  
  if (daysElapsed < alertConfig.warning_threshold_days) {
    return null;
  }

  const isExceeded = daysElapsed >= alertConfig.max_resolution_days;
  const daysRemaining = alertConfig.max_resolution_days - daysElapsed;
  const daysOver = daysElapsed - alertConfig.max_resolution_days;

  if (isExceeded) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge 
            variant="destructive" 
            className="gap-1 cursor-help"
          >
            <AlertTriangle className="h-3 w-3" />
            +{daysOver}d
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">Limite de resolução excedido</p>
          <p className="text-xs text-muted-foreground">
            {daysOver} dia{daysOver !== 1 ? 's' : ''} além do limite de {alertConfig.max_resolution_days} dias
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge 
          className="gap-1 cursor-help bg-warning/20 text-warning border-warning/30 hover:bg-warning/30"
        >
          <Clock className="h-3 w-3" />
          {daysRemaining}d
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">Próximo do limite de resolução</p>
        <p className="text-xs text-muted-foreground">
          {daysRemaining} dia{daysRemaining !== 1 ? 's' : ''} restante{daysRemaining !== 1 ? 's' : ''} 
          {' '}(limite: {alertConfig.max_resolution_days} dias)
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
