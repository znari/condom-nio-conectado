import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CallStatus, CALL_STATUS_LABELS } from "@/types/database";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CallStatusBadge } from "./CallStatusBadge";

interface StatusChangeDropdownProps {
  callId: string;
  currentStatus: CallStatus;
  onStatusChanged: (newStatus: CallStatus) => void;
}

const allStatuses: CallStatus[] = [
  "open",
  "sent",
  "awaiting_approval",
  "in_progress",
  "completed",
  "cancelled",
];

export function StatusChangeDropdown({ 
  callId, 
  currentStatus, 
  onStatusChanged 
}: StatusChangeDropdownProps) {
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus: CallStatus) => {
    if (newStatus === currentStatus) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("service_calls")
        .update({ status: newStatus })
        .eq("id", callId);

      if (error) throw error;

      toast.success(`Status alterado para "${CALL_STATUS_LABELS[newStatus]}"`);
      onStatusChanged(newStatus);
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast.error("Erro ao alterar status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={updating}>
          {updating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <CallStatusBadge status={currentStatus} />
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {allStatuses.map(status => (
          <DropdownMenuItem
            key={status}
            onClick={() => handleStatusChange(status)}
            disabled={status === currentStatus}
            className="cursor-pointer"
          >
            <CallStatusBadge status={status} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
