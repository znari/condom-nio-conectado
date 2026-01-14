import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PurchaseRequestStatus, PURCHASE_STATUSES } from '@/types/database';

interface PurchaseStatusBadgeProps {
  status: PurchaseRequestStatus;
}

export function PurchaseStatusBadge({ status }: PurchaseStatusBadgeProps) {
  const statusConfig = PURCHASE_STATUSES.find((s) => s.value === status);

  return (
    <Badge
      variant="outline"
      className={cn('font-medium', statusConfig?.color)}
    >
      {statusConfig?.label || status}
    </Badge>
  );
}
