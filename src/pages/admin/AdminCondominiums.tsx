import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Condominium, CONDOMINIUM_STATUSES, CondominiumStatus } from '@/types/database';

export default function AdminCondominiums() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCondominium, setSelectedCondominium] = useState<Condominium | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [condominiumToReject, setCondominiumToReject] = useState<Condominium | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: condominiums = [], isLoading } = useQuery({
    queryKey: ['condominiums', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('condominiums')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as CondominiumStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Condominium[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      rejectionReason: reason 
    }: { 
      id: string; 
      status: CondominiumStatus;
      rejectionReason?: string;
    }) => {
      // 1. Update condominium status
      const { error } = await supabase
        .from('condominiums')
        .update({ 
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: status === 'rejected' ? reason : null
        })
        .eq('id', id);
      if (error) throw error;

      // 2. Fetch users from this condominium
      const { data: users } = await supabase
        .from('profiles')
        .select('id')
        .eq('condominium_id', id);

      // 3. Create notifications for all users
      if (users && users.length > 0) {
        const notifications = users.map(u => ({
          user_id: u.id,
          type: status === 'approved' ? 'condominium_approved' : 'condominium_rejected',
          title: status === 'approved' 
            ? 'Condomínio Aprovado!' 
            : 'Cadastro Não Aprovado',
          message: status === 'approved'
            ? 'Seu condomínio foi aprovado. Você já pode utilizar todas as funcionalidades.'
            : `Seu cadastro foi rejeitado. ${reason || 'Entre em contato para mais informações.'}`
        }));

        await supabase.from('notifications').insert(notifications);
      }
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['condominiums'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-pending'] });
      toast({
        title: 'Status atualizado',
        description: `Condomínio ${status === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso`,
      });
      setDetailsOpen(false);
      setRejectDialogOpen(false);
      setRejectionReason('');
      setCondominiumToReject(null);
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status',
        variant: 'destructive',
      });
    },
  });

  const filteredCondominiums = condominiums.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.cnpj.includes(search.replace(/\D/g, ''))
  );

  const formatCNPJ = (cnpj: string) => {
    return cnpj
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 11) {
      return phone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    }
    return phone.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  };

  const getStatusBadge = (status: CondominiumStatus) => {
    const statusConfig = CONDOMINIUM_STATUSES.find((s) => s.value === status);
    return (
      <Badge variant="secondary" className={statusConfig?.color}>
        {statusConfig?.label}
      </Badge>
    );
  };

  const handleReject = (condominium: Condominium) => {
    setCondominiumToReject(condominium);
    setRejectionReason('');
    setRejectDialogOpen(true);
    setDetailsOpen(false);
  };

  const confirmReject = () => {
    if (condominiumToReject) {
      updateStatusMutation.mutate({
        id: condominiumToReject.id,
        status: 'rejected',
        rejectionReason: rejectionReason
      });
    }
  };

  return (
    <DashboardLayout title="Condomínios">
      <div className="space-y-6">
        {/* Filters */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou CNPJ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {CONDOMINIUM_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Lista de Condomínios</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCondominiums.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                Nenhum condomínio encontrado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCondominiums.map((condominium) => (
                      <TableRow key={condominium.id}>
                        <TableCell className="font-medium">{condominium.name}</TableCell>
                        <TableCell>{formatCNPJ(condominium.cnpj)}</TableCell>
                        <TableCell>{getStatusBadge(condominium.status)}</TableCell>
                        <TableCell>
                          {format(new Date(condominium.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedCondominium(condominium);
                                setDetailsOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {condominium.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-success hover:text-success"
                                  onClick={() => updateStatusMutation.mutate({ id: condominium.id, status: 'approved' })}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleReject(condominium)}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes do Condomínio</DialogTitle>
              <DialogDescription>
                Informações completas do cadastro
              </DialogDescription>
            </DialogHeader>
            {selectedCondominium && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{selectedCondominium.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CNPJ</p>
                    <p className="font-medium">{formatCNPJ(selectedCondominium.cnpj)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{formatPhone(selectedCondominium.phone)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">E-mail</p>
                    <p className="font-medium">{selectedCondominium.email}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">Endereço</p>
                    <p className="font-medium">{selectedCondominium.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedCondominium.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Cadastro</p>
                    <p className="font-medium">
                      {format(new Date(selectedCondominium.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {selectedCondominium.reviewed_at && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Revisado em</p>
                      <p className="font-medium">
                        {format(new Date(selectedCondominium.reviewed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  {selectedCondominium.rejection_reason && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Motivo da Rejeição</p>
                      <p className="font-medium text-destructive">{selectedCondominium.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              {selectedCondominium?.status === 'pending' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleReject(selectedCondominium)}
                    disabled={updateStatusMutation.isPending}
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rejeitar
                  </Button>
                  <Button
                    onClick={() => updateStatusMutation.mutate({ id: selectedCondominium.id, status: 'approved' })}
                    disabled={updateStatusMutation.isPending}
                    className="bg-success hover:bg-success/90"
                  >
                    {updateStatusMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Aprovar
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeitar Condomínio</DialogTitle>
              <DialogDescription>
                Informe o motivo da rejeição para que o usuário saiba o que precisa corrigir.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Condomínio</Label>
                <p className="text-sm font-medium">{condominiumToReject?.name}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Motivo da Rejeição</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ex: CNPJ inválido, documentação incompleta, dados inconsistentes..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setRejectDialogOpen(false);
                  setCondominiumToReject(null);
                  setRejectionReason('');
                }}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={confirmReject}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Confirmar Rejeição
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
