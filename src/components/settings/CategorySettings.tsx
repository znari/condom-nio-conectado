import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  GripVertical, 
  Save, 
  RotateCcw,
  Wrench,
  Zap,
  Paintbrush,
  Flower2,
  Sparkles,
  Key,
  PanelTop,
  Shield,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { SERVICE_CATEGORIES, ServiceCategory } from '@/types/database';

interface CategoryConfig {
  category: ServiceCategory;
  enabled: boolean;
  display_order: number;
  custom_label: string | null;
}

const CATEGORY_ICONS: Record<ServiceCategory, React.ComponentType<{ className?: string }>> = {
  encanador: Wrench,
  eletricista: Zap,
  pintor: Paintbrush,
  jardineiro: Flower2,
  limpeza: Sparkles,
  chaveiro: Key,
  vidraceiro: PanelTop,
  porteiro: Shield,
  outros: MoreHorizontal,
};

export function CategorySettings() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [configs, setConfigs] = useState<CategoryConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['category-settings', profile?.condominium_id],
    queryFn: async () => {
      if (!profile?.condominium_id) return [];
      const { data, error } = await supabase
        .from('category_settings')
        .select('*')
        .eq('condominium_id', profile.condominium_id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.condominium_id,
  });

  useEffect(() => {
    if (settings !== undefined) {
      const settingsMap = new Map(settings?.map(s => [s.category, s]) || []);
      const initialConfigs = SERVICE_CATEGORIES.map((cat, index) => {
        const existing = settingsMap.get(cat.value);
        return {
          category: cat.value,
          enabled: existing?.enabled ?? true,
          display_order: existing?.display_order ?? index,
          custom_label: existing?.custom_label ?? null,
        };
      });
      // Sort by display_order
      initialConfigs.sort((a, b) => a.display_order - b.display_order);
      setConfigs(initialConfigs);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.condominium_id) throw new Error('Condomínio não encontrado');

      for (const config of configs) {
        const { error } = await supabase
          .from('category_settings')
          .upsert({
            condominium_id: profile.condominium_id,
            category: config.category,
            enabled: config.enabled,
            display_order: config.display_order,
            custom_label: config.custom_label,
          }, {
            onConflict: 'condominium_id,category'
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Configurações de categorias salvas!');
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['category-settings'] });
    },
    onError: (error) => {
      console.error('Erro ao salvar categorias:', error);
      toast.error('Erro ao salvar configurações');
    },
  });

  const updateConfig = (category: ServiceCategory, field: keyof CategoryConfig, value: boolean | string | null) => {
    setConfigs(prev => prev.map(c => 
      c.category === category ? { ...c, [field]: value } : c
    ));
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    const defaultConfigs = SERVICE_CATEGORIES.map((cat, index) => ({
      category: cat.value,
      enabled: true,
      display_order: index,
      custom_label: null,
    }));
    setConfigs(defaultConfigs);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Categorias de Serviço</h3>
          <p className="text-sm text-muted-foreground">
            Ative ou desative categorias e personalize os nomes.
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

      {/* Categories List */}
      <div className="space-y-3">
        {configs.map((config) => {
          const originalLabel = SERVICE_CATEGORIES.find(c => c.value === config.category)?.label || config.category;
          const Icon = CATEGORY_ICONS[config.category];
          
          return (
            <Card key={config.category} className={!config.enabled ? 'opacity-60' : ''}>
              <CardContent className="py-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground cursor-move">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) => updateConfig(config.category, 'enabled', checked)}
                  />
                  
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <div className="p-1.5 rounded bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{originalLabel}</span>
                  </div>
                  
                  <div className="flex-1 max-w-xs">
                    <Label className="sr-only">Nome personalizado</Label>
                    <Input
                      placeholder="Nome personalizado (opcional)"
                      value={config.custom_label || ''}
                      onChange={(e) => updateConfig(config.category, 'custom_label', e.target.value || null)}
                      disabled={!config.enabled}
                      className="h-8"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="text-sm">
            <p className="font-medium mb-1">Sobre as categorias:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Categorias desativadas não aparecerão ao criar novos chamados</li>
              <li>Chamados existentes não serão afetados ao desativar uma categoria</li>
              <li>O nome personalizado aparecerá no lugar do nome padrão</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
