import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, ExternalLink, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { differenceInDays } from 'date-fns';
import { SERVICE_CATEGORY_LABELS, ServiceCategory, ResolutionTimeAlert, ServiceCall } from '@/types/database';

interface AlertedCall {
  call: ServiceCall;
  daysElapsed: number;
  maxDays: number;
  warningDays: number;
  status: 'warning' | 'exceeded';
}

export function AlertsPanel() {
  const { profile } = useAuth();

  const { data: alertConfigs = [] } = useQuery({
    queryKey: ['resolution-alerts', profile?.condominium_id],
    queryFn: async () => {
      if (!profile?.condominium_id) return [];
      const { data, error } = await supabase
        .from('resolution_time_alerts')
        .select('*')
        .eq('condominium_id', profile.condominium_id)
        .eq('enabled', true);
      
      if (error) throw error;
      return data as ResolutionTimeAlert[];
    },
    enabled: !!profile?.condominium_id,
  });

  const { data: openCalls = [] } = useQuery({
    queryKey: ['open-calls-for-alerts', profile?.condominium_id],
    queryFn: async () => {
      if (!profile?.condominium_id) return [];
      const { data, error } = await supabase
        .from('service_calls')
        .select('*')
        .eq('condominium_id', profile.condominium_id)
        .in('status', ['open', 'sent', 'awaiting_approval', 'in_progress']);
      
      if (error) throw error;
      return data as ServiceCall[];
    },
    enabled: !!profile?.condominium_id,
  });

  // Calculate alerted calls
  const alertedCalls: AlertedCall[] = [];
  const now = new Date();
  
  const alertConfigMap = new Map(alertConfigs.map(a => [a.category, a]));
  
  openCalls.forEach(call => {
    const config = alertConfigMap.get(call.category);
    if (!config) return;
    
    const daysElapsed = differenceInDays(now, new Date(call.created_at));
    
    if (daysElapsed >= config.max_resolution_days) {
      alertedCalls.push({
        call,
        daysElapsed,
        maxDays: config.max_resolution_days,
        warningDays: config.warning_threshold_days,
        status: 'exceeded',
      });
    } else if (daysElapsed >= config.warning_threshold_days) {
      alertedCalls.push({
        call,
        daysElapsed,
        maxDays: config.max_resolution_days,
        warningDays: config.warning_threshold_days,
        status: 'warning',
      });
    }
  });

  // Sort: exceeded first, then by days elapsed descending
  alertedCalls.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'exceeded' ? -1 : 1;
    return b.daysElapsed - a.daysElapsed;
  });

  const exceededCount = alertedCalls.filter(a => a.status === 'exceeded').length;
  const warningCount = alertedCalls.filter(a => a.status === 'warning').length;

  if (alertedCalls.length === 0) {
    return null;
  }

  return (
    <Card className="border-warning/50 bg-warning/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Alertas de Tempo de Resolução
          </div>
          <div className="flex gap-2">
            {exceededCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {exceededCount} excedido{exceededCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge className="bg-warning/20 text-warning border-warning/30 gap-1">
                <Clock className="h-3 w-3" />
                {warningCount} aviso{warningCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {alertedCalls.slice(0, 5).map(({ call, daysElapsed, maxDays, status }) => (
            <div
              key={call.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                status === 'exceeded' 
                  ? 'bg-destructive/10 border-destructive/30' 
                  : 'bg-warning/10 border-warning/30'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{call.title}</p>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {SERVICE_CATEGORY_LABELS[call.category as ServiceCategory]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {status === 'exceeded' ? (
                    <span className="text-destructive font-medium">
                      {daysElapsed - maxDays} dia{daysElapsed - maxDays !== 1 ? 's' : ''} além do limite
                    </span>
                  ) : (
                    <span className="text-warning font-medium">
                      {maxDays - daysElapsed} dia{maxDays - daysElapsed !== 1 ? 's' : ''} restante{maxDays - daysElapsed !== 1 ? 's' : ''}
                    </span>
                  )}
                  {' · '}{daysElapsed} dia{daysElapsed !== 1 ? 's' : ''} desde a abertura
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/chamados/${call.id}`}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
          
          {alertedCalls.length > 5 && (
            <div className="text-center pt-2">
              <Button variant="link" asChild>
                <Link to="/chamados">
                  Ver todos os {alertedCalls.length} chamados em alerta
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
