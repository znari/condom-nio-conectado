import { Badge } from "@/components/ui/badge";
import { CallStatus } from "@/types/database";
import { cn } from "@/lib/utils";

interface CallStatusBadgeProps {
  status: CallStatus;
  className?: string;
}

const statusConfig: Record<CallStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  open: { label: "Aberto", variant: "outline", className: "border-muted-foreground text-muted-foreground" },
  sent: { label: "Enviado", variant: "secondary", className: "bg-info/10 text-info border-info/20" },
  awaiting_approval: { label: "Aguardando Aprovação", variant: "secondary", className: "bg-warning/10 text-warning border-warning/20" },
  in_progress: { label: "Em Andamento", variant: "secondary", className: "bg-primary/10 text-primary border-primary/20" },
  completed: { label: "Concluído", variant: "secondary", className: "bg-success/10 text-success border-success/20" },
  cancelled: { label: "Cancelado", variant: "destructive", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export function CallStatusBadge({ status, className }: CallStatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant={config.variant} 
      className={cn("font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
