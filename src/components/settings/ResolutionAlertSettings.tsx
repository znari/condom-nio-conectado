import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Clock, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { SERVICE_CATEGORIES, ServiceCategory, ResolutionTimeAlert } from '@/types/database';

interface AlertConfig {
  category: ServiceCategory;
  max_resolution_days: number;
  warning_threshold_days: number;
  enabled: boolean;
}

const DEFAULT_MAX_DAYS = 7;
const DEFAULT_WARNING_DAYS = 5;

export function ResolutionAlertSettings() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [configs, setConfigs] = useState<AlertConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['resolution-alerts', profile?.condominium_id],
    queryFn: async () => {
      if (!profile?.condominium_id) return [];
      const { data, error } = await supabase
        .from('resolution_time_alerts')
        .select('*')
        .eq('condominium_id', profile.condominium_id);
      
      if (error) throw error;
      return data as ResolutionTimeAlert[];
    },
    enabled: !!profile?.condominium_id,
  });

  useEffect(() => {
    if (alerts) {
      const configMap = new Map(alerts.map(a => [a.category, a]));
      const initialConfigs = SERVICE_CATEGORIES.map(cat => {
        const existing = configMap.get(cat.value);
        return {
          category: cat.value,
          max_resolution_days: existing?.max_resolution_days ?? DEFAULT_MAX_DAYS,
          warning_threshold_days: existing?.warning_threshold_days ?? DEFAULT_WARNING_DAYS,
          enabled: existing?.enabled ?? true,
        };
      });
      setConfigs(initialConfigs);
    }
  }, [alerts]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.condominium_id) throw new Error('Condomínio não encontrado');

      for (const config of configs) {
        const { error } = await supabase
          .from('resolution_time_alerts')
          .upsert({
            condominium_id: profile.condominium_id,
            category: config.category,
            max_resolution_days: config.max_resolution_days,
            warning_threshold_days: config.warning_threshold_days,
            enabled: config.enabled,
          }, {
            onConflict: 'condominium_id,category'
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Configurações de alertas salvas com sucesso!');
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['resolution-alerts'] });
    },
    onError: (error) => {
      console.error('Erro ao salvar alertas:', error);
      toast.error('Erro ao salvar configurações de alertas');
    },
  });

  const updateConfig = (category: ServiceCategory, field: keyof AlertConfig, value: number | boolean) => {
    setConfigs(prev => prev.map(c => 
      c.category === category ? { ...c, [field]: value } : c
    ));
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    setConfigs(prev => prev.map(c => ({
      ...c,
      max_resolution_days: DEFAULT_MAX_DAYS,
      warning_threshold_days: DEFAULT_WARNING_DAYS,
      enabled: true,
    })));
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Limites de Tempo de Resolução</h3>
          <p className="text-sm text-muted-foreground">
            Configure alertas para chamados que excederem o tempo esperado por categoria.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Padrões
          </Button>
          <Button 
            size="sm" 
            onClick={() => saveMutation.mutate()}
            disabled={!hasChanges || saveMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {configs.map((config) => {
          const categoryLabel = SERVICE_CATEGORIES.find(c => c.value === config.category)?.label || config.category;
          
          return (
            <Card key={config.category} className={!config.enabled ? 'opacity-60' : ''}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-[180px]">
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={(checked) => updateConfig(config.category, 'enabled', checked)}
                    />
                    <div>
                      <p className="font-medium">{categoryLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        {config.enabled ? 'Alertas ativos' : 'Alertas desativados'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-warning" />
                      <Label className="text-sm whitespace-nowrap">Aviso após</Label>
                      <Input
                        type="number"
                        min={1}
                        max={config.max_resolution_days - 1}
                        value={config.warning_threshold_days}
                        onChange={(e) => updateConfig(config.category, 'warning_threshold_days', parseInt(e.target.value) || 1)}
                        className="w-16 h-8"
                        disabled={!config.enabled}
                      />
                      <span className="text-sm text-muted-foreground">dias</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <Label className="text-sm whitespace-nowrap">Limite máximo</Label>
                      <Input
                        type="number"
                        min={config.warning_threshold_days + 1}
                        value={config.max_resolution_days}
                        onChange={(e) => updateConfig(config.category, 'max_resolution_days', parseInt(e.target.value) || 1)}
                        className="w-16 h-8"
                        disabled={!config.enabled}
                      />
                      <span className="text-sm text-muted-foreground">dias</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Como funcionam os alertas:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 mx-1">Aviso</Badge> é exibido quando o chamado atinge o limite de aviso</li>
                <li><Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 mx-1">Crítico</Badge> é exibido quando excede o limite máximo</li>
                <li>Os alertas são calculados a partir da data de abertura do chamado</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
