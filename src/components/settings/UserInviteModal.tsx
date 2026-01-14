import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Mail, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import type { UserPosition } from '@/types/database';

interface UserInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  condominiumId: string;
}

const POSITIONS: { value: UserPosition; label: string }[] = [
  { value: 'sindico', label: 'Síndico' },
  { value: 'zelador', label: 'Zelador' },
];

export function UserInviteModal({ open, onOpenChange, condominiumId }: UserInviteModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState<UserPosition>('zelador');

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!condominiumId || !user?.id) throw new Error('Dados inválidos');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      const { error } = await supabase
        .from('user_invitations')
        .insert({
          condominium_id: condominiumId,
          email: email.toLowerCase().trim(),
          position,
          invited_by: user.id,
          expires_at: expiresAt.toISOString(),
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Já existe um convite pendente para este e-mail');
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Convite enviado com sucesso!', {
        description: `Um e-mail será enviado para ${email} com instruções de acesso.`
      });
      queryClient.invalidateQueries({ queryKey: ['user-invitations'] });
      onOpenChange(false);
      setEmail('');
      setPosition('zelador');
    },
    onError: (error: Error) => {
      console.error('Erro ao enviar convite:', error);
      toast.error(error.message || 'Erro ao enviar convite');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Informe o e-mail do usuário');
      return;
    }
    if (!email.includes('@')) {
      toast.error('Informe um e-mail válido');
      return;
    }
    inviteMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Convidar Usuário
          </DialogTitle>
          <DialogDescription>
            Envie um convite para um novo síndico ou zelador ter acesso ao sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Cargo
            </Label>
            <Select value={position} onValueChange={(v) => setPosition(v as UserPosition)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map((pos) => (
                  <SelectItem key={pos.value} value={pos.value}>
                    {pos.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {position === 'sindico' 
                ? 'Síndicos têm acesso completo às configurações e relatórios.'
                : 'Zeladores podem criar e gerenciar chamados.'}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
