import { ServiceCall } from "@/types/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  FileText, 
  Send, 
  Clock, 
  PlayCircle, 
  CheckCircle, 
  XCircle,
  DollarSign 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CallTimelineProps {
  call: ServiceCall;
}

interface TimelineEvent {
  icon: typeof FileText;
  label: string;
  date: string | null;
  active: boolean;
  completed: boolean;
}

const statusOrder = ["open", "sent", "awaiting_approval", "in_progress", "completed", "cancelled"];

export function CallTimeline({ call }: CallTimelineProps) {
  const currentStatusIndex = statusOrder.indexOf(call.status);
  const isCancelled = call.status === "cancelled";

  const baseEvents: TimelineEvent[] = [
    {
      icon: FileText,
      label: "Chamado criado",
      date: call.created_at,
      active: currentStatusIndex >= 0,
      completed: currentStatusIndex > 0 || isCancelled,
    },
    {
      icon: Send,
      label: "Enviado ao prestador",
      date: currentStatusIndex >= 1 ? call.updated_at : null,
      active: currentStatusIndex >= 1,
      completed: currentStatusIndex > 1,
    },
    {
      icon: Clock,
      label: "Aguardando aprovação do orçamento",
      date: currentStatusIndex >= 2 ? call.updated_at : null,
      active: currentStatusIndex >= 2,
      completed: currentStatusIndex > 2,
    },
    {
      icon: PlayCircle,
      label: "Serviço em andamento",
      date: currentStatusIndex >= 3 ? call.updated_at : null,
      active: currentStatusIndex >= 3,
      completed: currentStatusIndex > 3,
    },
  ];

  // Add final event based on status
  if (isCancelled) {
    baseEvents.push({
      icon: XCircle,
      label: "Chamado cancelado",
      date: call.updated_at,
      active: true,
      completed: true,
    });
  } else {
    baseEvents.push({
      icon: CheckCircle,
      label: "Serviço concluído",
      date: call.status === "completed" ? call.updated_at : null,
      active: call.status === "completed",
      completed: call.status === "completed",
    });
  }

  return (
    <div className="space-y-1">
      {baseEvents.map((event, index) => {
        const Icon = event.icon;
        const isLast = index === baseEvents.length - 1;
        const isCancelledEvent = event.icon === XCircle;

        return (
          <div key={index} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                isCancelledEvent 
                  ? "bg-destructive/10 text-destructive"
                  : event.completed 
                    ? "bg-success/10 text-success" 
                    : event.active 
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-4 w-4" />
              </div>
              {!isLast && (
                <div className={cn(
                  "w-0.5 h-8 my-1",
                  event.completed ? "bg-success/30" : "bg-border"
                )} />
              )}
            </div>
            
            <div className="flex-1 pt-1">
              <p className={cn(
                "font-medium text-sm",
                isCancelledEvent 
                  ? "text-destructive"
                  : event.active 
                    ? "text-foreground" 
                    : "text-muted-foreground"
              )}>
                {event.label}
              </p>
              {event.date && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(event.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
