import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PurchasePriority, PURCHASE_PRIORITIES } from '@/types/database';

interface PurchasePriorityBadgeProps {
  priority: PurchasePriority;
}

export function PurchasePriorityBadge({ priority }: PurchasePriorityBadgeProps) {
  const priorityConfig = PURCHASE_PRIORITIES.find((p) => p.value === priority);

  return (
    <Badge
      variant="outline"
      className={cn('font-medium', priorityConfig?.color)}
    >
      {priorityConfig?.label || priority}
    </Badge>
  );
}
