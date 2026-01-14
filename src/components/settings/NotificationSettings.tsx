import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  MessageSquare, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  CalendarDays,
  Save,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NotificationPreferences {
  id?: string;
  condominium_id: string;
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  notify_new_quote: boolean;
  notify_call_completed: boolean;
  notify_resolution_alerts: boolean;
  notify_weekly_summary: boolean;
  notify_monthly_summary: boolean;
  preferred_time: string;
}

const DEFAULT_PREFERENCES: Omit<NotificationPreferences, 'condominium_id'> = {
  email_enabled: true,
  whatsapp_enabled: false,
  notify_new_quote: true,
  notify_call_completed: true,
  notify_resolution_alerts: true,
  notify_weekly_summary: false,
  notify_monthly_summary: true,
  preferred_time: '09:00',
};

const TIME_OPTIONS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

export function NotificationSettings() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['notification-preferences', profile?.condominium_id],
    queryFn: async () => {
      if (!profile?.condominium_id) return null;
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('condominium_id', profile.condominium_id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.condominium_id,
  });

  useEffect(() => {
    if (profile?.condominium_id) {
      if (data) {
        setPreferences(data as NotificationPreferences);
      } else {
        setPreferences({
          ...DEFAULT_PREFERENCES,
          condominium_id: profile.condominium_id,
        });
      }
    }
  }, [data, profile?.condominium_id]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!preferences || !profile?.condominium_id) throw new Error('Dados inválidos');

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          ...preferences,
          condominium_id: profile.condominium_id,
        }, {
          onConflict: 'condominium_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Preferências de notificação salvas!');
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
    onError: (error) => {
      console.error('Erro ao salvar preferências:', error);
      toast.error('Erro ao salvar preferências de notificação');
    },
  });

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K, 
    value: NotificationPreferences[K]
  ) => {
    if (preferences) {
      setPreferences({ ...preferences, [key]: value });
      setHasChanges(true);
    }
  };

  if (isLoading || !preferences) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Canais de Notificação */}
      <div>
        <h3 className="text-lg font-medium mb-4">Canais de Notificação</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Label className="font-medium">E-mail</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações por e-mail
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.email_enabled}
                  onCheckedChange={(checked) => updatePreference('email_enabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-success/10">
                    <MessageSquare className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <Label className="font-medium">WhatsApp</Label>
                    <p className="text-sm text-muted-foreground">
                      Em breve disponível
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.whatsapp_enabled}
                  disabled
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Tipos de Notificação */}
      <div>
        <h3 className="text-lg font-medium mb-4">Tipos de Notificação</h3>
        <div className="space-y-3">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="font-medium">Novo orçamento recebido</Label>
                    <p className="text-sm text-muted-foreground">
                      Quando um prestador enviar um orçamento
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.notify_new_quote}
                  onCheckedChange={(checked) => updatePreference('notify_new_quote', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <div>
                    <Label className="font-medium">Chamado concluído</Label>
                    <p className="text-sm text-muted-foreground">
                      Quando um chamado for finalizado
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.notify_call_completed}
                  onCheckedChange={(checked) => updatePreference('notify_call_completed', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <div>
                    <Label className="font-medium">Alertas de tempo de resolução</Label>
                    <p className="text-sm text-muted-foreground">
                      Quando um chamado exceder o tempo limite
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.notify_resolution_alerts}
                  onCheckedChange={(checked) => updatePreference('notify_resolution_alerts', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Resumos Periódicos */}
      <div>
        <h3 className="text-lg font-medium mb-4">Resumos Periódicos</h3>
        <div className="space-y-3">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="font-medium">Resumo semanal</Label>
                    <p className="text-sm text-muted-foreground">
                      Relatório semanal de chamados e métricas
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.notify_weekly_summary}
                  onCheckedChange={(checked) => updatePreference('notify_weekly_summary', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="font-medium">Resumo mensal</Label>
                    <p className="text-sm text-muted-foreground">
                      Relatório mensal completo com análises
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.notify_monthly_summary}
                  onCheckedChange={(checked) => updatePreference('notify_monthly_summary', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Horário Preferido */}
      <div>
        <h3 className="text-lg font-medium mb-4">Horário Preferido</h3>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="font-medium">Horário de envio</Label>
                  <p className="text-sm text-muted-foreground">
                    Horário preferido para receber resumos
                  </p>
                </div>
              </div>
              <Select
                value={preferences.preferred_time}
                onValueChange={(value) => updatePreference('preferred_time', value)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button 
          onClick={() => saveMutation.mutate()}
          disabled={!hasChanges || saveMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? 'Salvando...' : 'Salvar Preferências'}
        </Button>
      </div>
    </div>
  );
}
