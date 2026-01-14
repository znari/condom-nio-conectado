import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PurchaseStatusBadge } from './PurchaseStatusBadge';
import { PurchasePriorityBadge } from './PurchasePriorityBadge';
import {
  PurchaseRequest,
  PurchaseCategory,
  PURCHASE_CATEGORY_LABELS,
} from '@/types/database';
import {
  Sparkles,
  Wrench,
  Laptop,
  Hammer,
  Leaf,
  Zap,
  Droplet,
  Shield,
  FileText,
  Package,
} from 'lucide-react';

const categoryIcons: Record<PurchaseCategory, React.ElementType> = {
  limpeza: Sparkles,
  manutencao: Wrench,
  equipamento: Laptop,
  ferramentas: Hammer,
  jardinagem: Leaf,
  eletrico: Zap,
  hidraulico: Droplet,
  seguranca: Shield,
  escritorio: FileText,
  outros: Package,
};

interface PurchaseRequestCardProps {
  request: PurchaseRequest;
}

export function PurchaseRequestCard({ request }: PurchaseRequestCardProps) {
  const CategoryIcon = categoryIcons[request.category] || Package;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-muted">
              <CategoryIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium truncate">{request.title}</h3>
                <PurchaseStatusBadge status={request.status} />
                <PurchasePriorityBadge priority={request.priority} />
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span>{PURCHASE_CATEGORY_LABELS[request.category]}</span>
                <span>•</span>
                <span>
                  {request.quantity} {request.unit}
                </span>
                {request.estimated_value && (
                  <>
                    <span>•</span>
                    <span>
                      R$ {Number(request.estimated_value).toFixed(2)} est.
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Criado{' '}
                {formatDistanceToNow(new Date(request.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/compras/${request.id}`}>Ver detalhes</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
