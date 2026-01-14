import { Badge } from "@/components/ui/badge";
import { UrgencyLevel } from "@/types/database";
import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, Clock, Flame } from "lucide-react";

interface UrgencyBadgeProps {
  urgency: UrgencyLevel;
  showIcon?: boolean;
  className?: string;
}

const urgencyConfig: Record<UrgencyLevel, { label: string; className: string; Icon: typeof Clock }> = {
  low: { label: "Baixa", className: "bg-muted text-muted-foreground", Icon: Clock },
  medium: { label: "Média", className: "bg-info/10 text-info", Icon: AlertCircle },
  high: { label: "Alta", className: "bg-warning/10 text-warning", Icon: AlertTriangle },
  critical: { label: "Crítica", className: "bg-destructive/10 text-destructive", Icon: Flame },
};

export function UrgencyBadge({ urgency, showIcon = false, className }: UrgencyBadgeProps) {
  const config = urgencyConfig[urgency];
  const Icon = config.Icon;
  
  return (
    <Badge 
      variant="secondary" 
      className={cn("font-medium gap-1", config.className, className)}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
