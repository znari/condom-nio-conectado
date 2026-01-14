import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PurchaseStatusBadge } from '@/components/purchases/PurchaseStatusBadge';
import { PurchasePriorityBadge } from '@/components/purchases/PurchasePriorityBadge';
import { AttachmentGallery } from '@/components/purchases/AttachmentGallery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PURCHASE_CATEGORY_LABELS } from '@/types/database';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  ShoppingBag,
  Loader2,
  User,
  Calendar,
  Package,
  DollarSign,
  AlertCircle,
  Paperclip,
} from 'lucide-react';
import type { PurchaseRequest, PurchaseCategory, PurchasePriority, PurchaseRequestStatus, PurchaseRequestAttachment } from '@/types/database';

export default function PurchaseRequestDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actualValue, setActualValue] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');

  const isSindico = profile?.position === 'sindico';

  const { data: request, isLoading } = useQuery({
    queryKey: ['purchase-request', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as PurchaseRequest;
    },
  });

  // Fetch attachments
  const { data: attachments = [] } = useQuery({
    queryKey: ['purchase-request-attachments', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_request_attachments')
        .select('*')
        .eq('purchase_request_id', id)
        .order('uploaded_at', { ascending: true });

      if (error) throw error;
      return data as unknown as PurchaseRequestAttachment[];
    },
    enabled: !!id,
  });

  const { data: creator } = useQuery({
    queryKey: ['profile', request?.created_by],
    queryFn: async () => {
      if (!request?.created_by) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('name, position')
        .eq('id', request.created_by)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!request?.created_by,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      status,
      extras,
    }: {
      status: PurchaseRequestStatus;
      extras?: Record<string, unknown>;
    }) => {
      const updateData: Record<string, unknown> = {
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        ...extras,
      };

      const { error } = await supabase
        .from('purchase_requests')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Notify the creator
      if (request?.created_by && request.created_by !== user?.id) {
        const statusLabels: Record<string, string> = {
          approved: 'aprovada',
          rejected: 'rejeitada',
          purchased: 'marcada como comprada',
        };

        await supabase.from('notifications').insert({
          user_id: request.created_by,
          type: 'purchase_status',
          title: `Solicitação ${statusLabels[status]}`,
          message: `Sua solicitação "${request.title}" foi ${statusLabels[status]}.`,
        });
      }
    },
    onSuccess: () => {
      toast.success('Status atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['purchase-request', id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      setRejectDialogOpen(false);
      setPurchaseDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });

  const handleApprove = () => {
    updateStatusMutation.mutate({ status: 'approved' });
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }
    updateStatusMutation.mutate({
      status: 'rejected',
      extras: { rejection_reason: rejectionReason },
    });
  };

  const handleMarkPurchased = () => {
    updateStatusMutation.mutate({
      status: 'purchased',
      extras: {
        actual_value: actualValue ? parseFloat(actualValue) : null,
        purchase_notes: purchaseNotes || null,
        purchased_at: new Date().toISOString(),
      },
    });
  };

  const handleCancel = () => {
    updateStatusMutation.mutate({ status: 'cancelled' });
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Detalhes da Solicitação">
        <div className="space-y-6 max-w-3xl">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!request) {
    return (
      <DashboardLayout title="Erro">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Solicitação não encontrada</h2>
          <Button onClick={() => navigate('/compras')}>Voltar à lista</Button>
        </div>
      </DashboardLayout>
    );
  }

  const canApprove =
    isSindico && request.status === 'pending';
  const canMarkPurchased =
    isSindico && request.status === 'approved';
  const canCancel =
    request.created_by === user?.id && request.status === 'pending';

  return (
    <DashboardLayout title="Detalhes da Solicitação">
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{request.title}</h1>
              <PurchaseStatusBadge status={request.status} />
              <PurchasePriorityBadge priority={request.priority} />
            </div>
          </div>
        </div>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Solicitação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Categoria:</span>
                <span className="font-medium">
                  {PURCHASE_CATEGORY_LABELS[request.category]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Quantidade:</span>
                <span className="font-medium">
                  {request.quantity} {request.unit}
                </span>
              </div>
            </div>

            {request.description && (
              <div>
                <span className="text-sm text-muted-foreground">Descrição:</span>
                <p className="mt-1">{request.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {request.estimated_value && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Valor Estimado:
                  </span>
                  <span className="font-medium">
                    R$ {Number(request.estimated_value).toFixed(2)}
                  </span>
                </div>
              )}
              {request.actual_value && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-success" />
                  <span className="text-sm text-muted-foreground">
                    Valor Real:
                  </span>
                  <span className="font-medium text-success">
                    R$ {Number(request.actual_value).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Solicitado por:</span>
                  <span>
                    {creator?.name || 'Usuário'} ({creator?.position === 'zelador' ? 'Zelador' : 'Síndico'})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Em:</span>
                  <span>
                    {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {request.rejection_reason && (
              <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                <p className="text-sm font-medium text-destructive mb-1">
                  Motivo da Rejeição:
                </p>
                <p className="text-sm">{request.rejection_reason}</p>
              </div>
            )}

            {request.purchase_notes && (
              <div className="bg-success/10 p-4 rounded-lg border border-success/20">
                <p className="text-sm font-medium text-success mb-1">
                  Observações da Compra:
                </p>
                <p className="text-sm">{request.purchase_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attachments */}
        {attachments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Anexos ({attachments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AttachmentGallery attachments={attachments} />
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {(canApprove || canMarkPurchased || canCancel) && (
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              {canApprove && (
                <>
                  <Button onClick={handleApprove} disabled={updateStatusMutation.isPending}>
                    {updateStatusMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Aprovar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setRejectDialogOpen(true)}
                    disabled={updateStatusMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                </>
              )}
              {canMarkPurchased && (
                <Button onClick={() => setPurchaseDialogOpen(true)} disabled={updateStatusMutation.isPending}>
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Marcar como Comprado
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateStatusMutation.isPending}
                >
                  Cancelar Solicitação
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição para que o solicitante possa entender.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason">Motivo da Rejeição</Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ex: Orçamento não disponível, item não é prioridade..."
              rows={3}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Comprado</DialogTitle>
            <DialogDescription>
              Informe os detalhes da compra realizada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="actual-value">Valor Real (R$)</Label>
              <Input
                id="actual-value"
                type="number"
                step="0.01"
                min={0}
                value={actualValue}
                onChange={(e) => setActualValue(e.target.value)}
                placeholder="0,00"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="purchase-notes">Observações</Label>
              <Textarea
                id="purchase-notes"
                value={purchaseNotes}
                onChange={(e) => setPurchaseNotes(e.target.value)}
                placeholder="Ex: Comprado na loja X, nota fiscal nº..."
                rows={2}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMarkPurchased} disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Confirmar Compra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
