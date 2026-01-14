import { Card, CardContent } from "@/components/ui/card";
import { CallStatusBadge } from "./CallStatusBadge";
import { UrgencyBadge } from "./UrgencyBadge";
import { ServiceCall, ServiceCategory, SERVICE_CATEGORY_LABELS } from "@/types/database";
import { MapPin, Calendar, User, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface CallCardProps {
  call: ServiceCall & { provider_name?: string };
}

export function CallCard({ call }: CallCardProps) {
  const navigate = useNavigate();

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow border-border/50"
      onClick={() => navigate(`/chamados/${call.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <CallStatusBadge status={call.status} />
              <UrgencyBadge urgency={call.urgency} />
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {SERVICE_CATEGORY_LABELS[call.category as ServiceCategory]}
              </span>
            </div>
            
            <div>
              <h3 className="font-medium text-foreground truncate">{call.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {call.description}
              </p>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {call.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(call.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </span>
              {call.provider_name && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {call.provider_name}
                </span>
              )}
            </div>
          </div>
          
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
