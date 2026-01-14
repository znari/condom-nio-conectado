import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Mail, 
  ExternalLink,
  CheckCircle2,
  XCircle,
  Settings
} from 'lucide-react';

interface IntegrationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'coming_soon';
  statusLabel: string;
  onConfigure?: () => void;
}

function IntegrationCard({ 
  title, 
  description, 
  icon, 
  status, 
  statusLabel,
  onConfigure 
}: IntegrationCardProps) {
  const statusColors = {
    connected: 'bg-success/10 text-success border-success/30',
    disconnected: 'bg-muted text-muted-foreground',
    coming_soon: 'bg-warning/10 text-warning border-warning/30',
  };

  const StatusIcon = status === 'connected' ? CheckCircle2 : XCircle;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={statusColors[status]}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {status === 'coming_soon' ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Settings className="h-4 w-4" />
            <span>Esta integração estará disponível em breve.</span>
          </div>
        ) : status === 'disconnected' ? (
          <Button onClick={onConfigure} variant="outline" className="w-full" disabled>
            <ExternalLink className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Conectado e funcionando</span>
            <Button variant="outline" size="sm" disabled>
              Gerenciar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function IntegrationSettings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium">Integrações</h3>
        <p className="text-sm text-muted-foreground">
          Conecte serviços externos para expandir as funcionalidades do sistema.
        </p>
      </div>

      {/* Integrations Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <IntegrationCard
          title="WhatsApp"
          description="Envie notificações e orçamentos diretamente pelo WhatsApp"
          icon={<MessageSquare className="h-5 w-5 text-success" />}
          status="coming_soon"
          statusLabel="Em breve"
        />

        <IntegrationCard
          title="E-mail (Resend)"
          description="Envie e-mails transacionais e notificações"
          icon={<Mail className="h-5 w-5 text-primary" />}
          status="coming_soon"
          statusLabel="Em breve"
        />
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="text-sm">
            <p className="font-medium mb-2">Sobre as integrações:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>
                <strong>WhatsApp (Evolution API):</strong> Permite enviar orçamentos, 
                notificações e mensagens automáticas para prestadores e síndicos
              </li>
              <li>
                <strong>E-mail (Resend):</strong> Sistema de e-mails transacionais para 
                convites, notificações e relatórios periódicos
              </li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              Essas integrações serão disponibilizadas em atualizações futuras. 
              Você será notificado quando estiverem prontas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
