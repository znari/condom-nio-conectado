import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AttachmentUpload } from '@/components/purchases/AttachmentUpload';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PURCHASE_CATEGORIES, PURCHASE_PRIORITIES } from '@/types/database';
import { ArrowLeft, Loader2, Paperclip } from 'lucide-react';
import type { PurchaseCategory, PurchasePriority, AttachmentType } from '@/types/database';

const formSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  category: z.string(),
  priority: z.string(),
  quantity: z.coerce.number().min(1, 'Quantidade mínima é 1'),
  unit: z.string().min(1, 'Informe a unidade'),
  estimated_value: z.coerce.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface UploadedFile {
  url: string;
  name: string;
  type: 'image' | 'pdf' | 'quote';
  size: number;
}

export default function PurchaseRequestNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'outros',
      priority: 'medium',
      quantity: 1,
      unit: 'un',
      estimated_value: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!profile?.condominium_id || !user?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Create the purchase request
      const { data: newRequest, error } = await supabase
        .from('purchase_requests')
        .insert({
          condominium_id: profile.condominium_id,
          created_by: user.id,
          title: data.title,
          description: data.description || null,
          category: data.category as PurchaseCategory,
          priority: data.priority as PurchasePriority,
          quantity: data.quantity,
          unit: data.unit,
          estimated_value: data.estimated_value || null,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Insert attachments if any
      if (attachments.length > 0 && newRequest) {
        const attachmentRecords = attachments.map((attachment) => ({
          purchase_request_id: newRequest.id,
          file_url: attachment.url,
          file_name: attachment.name,
          file_type: attachment.type as AttachmentType,
          file_size: attachment.size,
          uploaded_by: user.id,
        }));

        const { error: attachError } = await supabase
          .from('purchase_request_attachments')
          .insert(attachmentRecords);

        if (attachError) {
          console.error('Error saving attachments:', attachError);
          // Don't fail the whole request, just log the error
        }
      }

      // Create notification for sindicos
      const { data: sindicos } = await supabase
        .from('profiles')
        .select('id')
        .eq('condominium_id', profile.condominium_id)
        .eq('position', 'sindico');

      if (sindicos && sindicos.length > 0) {
        const notifications = sindicos.map((sindico) => ({
          user_id: sindico.id,
          type: 'purchase_request',
          title: 'Nova solicitação de compra',
          message: `${profile.name} solicitou: ${data.title}`,
        }));

        await supabase.from('notifications').insert(notifications);
      }
    },
    onSuccess: () => {
      toast.success('Solicitação criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      navigate('/compras');
    },
    onError: (error) => {
      toast.error('Erro ao criar solicitação: ' + error.message);
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <DashboardLayout title="Nova Solicitação de Compra">
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nova Solicitação de Compra</h1>
            <p className="text-muted-foreground">
              Preencha os dados do produto ou equipamento
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da Solicitação</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Vassouras de nylon"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva detalhes adicionais sobre o item..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PURCHASE_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridade *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PURCHASE_PRIORITIES.map((pri) => (
                              <SelectItem key={pri.value} value={pri.value}>
                                {pri.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade *</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade *</FormLabel>
                        <FormControl>
                          <Input placeholder="un, kg, L..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimated_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Estimado (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            placeholder="0,00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Attachments Section */}
                <div className="space-y-2 pt-4 border-t">
                  <Label className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Anexos (opcional)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Adicione fotos do produto ou orçamentos em PDF
                  </p>
                  <AttachmentUpload
                    onFilesChange={setAttachments}
                    maxFiles={10}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Criar Solicitação
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
