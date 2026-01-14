import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UserPlus, MoreVertical, Mail, Clock, Trash2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UserInviteModal } from './UserInviteModal';
import type { Profile, UserPosition } from '@/types/database';

const POSITION_LABELS: Record<UserPosition, string> = {
  sindico: 'Síndico',
  zelador: 'Zelador',
};

interface UserInvitation {
  id: string;
  email: string;
  position: UserPosition;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export function UserManagement() {
  const { profile: currentProfile } = useAuth();
  const queryClient = useQueryClient();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<UserInvitation | null>(null);

  // Fetch users from the same condominium
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['condominium-users', currentProfile?.condominium_id],
    queryFn: async () => {
      if (!currentProfile?.condominium_id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('condominium_id', currentProfile.condominium_id);
      
      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!currentProfile?.condominium_id,
  });

  // Fetch pending invitations
  const { data: invitations, isLoading: invitationsLoading } = useQuery({
    queryKey: ['user-invitations', currentProfile?.condominium_id],
    queryFn: async () => {
      if (!currentProfile?.condominium_id) return [];
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('condominium_id', currentProfile.condominium_id)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString());
      
      if (error) throw error;
      return data as UserInvitation[];
    },
    enabled: !!currentProfile?.condominium_id,
  });

  const deleteInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', invitationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Convite cancelado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['user-invitations'] });
      setDeleteConfirmOpen(false);
      setSelectedInvitation(null);
    },
    onError: (error) => {
      console.error('Erro ao cancelar convite:', error);
      toast.error('Erro ao cancelar convite');
    },
  });

  const handleDeleteInvitation = (invitation: UserInvitation) => {
    setSelectedInvitation(invitation);
    setDeleteConfirmOpen(true);
  };

  const isLoading = usersLoading || invitationsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Usuários do Condomínio</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie síndicos e zeladores com acesso ao sistema.
          </p>
        </div>
        <Button onClick={() => setInviteModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Convidar Usuário
        </Button>
      </div>

      {/* Users Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Membro desde</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users && users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name}
                    {user.id === currentProfile?.id && (
                      <Badge variant="outline" className="ml-2">Você</Badge>
                    )}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {user.position ? POSITION_LABELS[user.position] : 'Não definido'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled>
                          <Mail className="h-4 w-4 mr-2" />
                          Enviar e-mail
                        </DropdownMenuItem>
                        {user.id !== currentProfile?.id && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remover acesso
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pending Invitations */}
      {invitations && invitations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Convites Pendentes</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-warning" />
                      {invitation.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {POSITION_LABELS[invitation.position]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(invitation.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteInvitation(invitation)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <UserInviteModal 
        open={inviteModalOpen} 
        onOpenChange={setInviteModalOpen}
        condominiumId={currentProfile?.condominium_id || ''}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar convite?</AlertDialogTitle>
            <AlertDialogDescription>
              O convite para {selectedInvitation?.email} será cancelado e o link de acesso não funcionará mais.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedInvitation && deleteInvitationMutation.mutate(selectedInvitation.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancelar Convite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
