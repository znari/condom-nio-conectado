import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { Condominium } from '@/types/database';

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  address: z.string().min(10, 'Endereço deve ter no mínimo 10 caracteres'),
  phone: z.string().min(14, 'Telefone inválido'),
  email: z.string().email('E-mail inválido'),
});

type FormData = z.infer<typeof formSchema>;

interface CondominiumFormProps {
  condominium: Condominium;
  onUpdate: (data: Partial<Condominium>) => void;
}

// Máscara de telefone
const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return numbers
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
};

// Máscara de CNPJ
const formatCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
};

export function CondominiumForm({ condominium, onUpdate }: CondominiumFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: condominium.name,
      address: condominium.address,
      phone: condominium.phone,
      email: condominium.email,
    },
  });

  const { isDirty, isSubmitting } = form.formState;

  const onSubmit = async (data: FormData) => {
    try {
      const { error } = await supabase
        .from('condominiums')
        .update({
          name: data.name,
          address: data.address,
          phone: data.phone,
          email: data.email,
        })
        .eq('id', condominium.id);

      if (error) throw error;

      onUpdate(data);
      form.reset(data);
      toast.success('Dados atualizados com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar:', error);
      toast.error('Erro ao salvar alterações.');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Condomínio</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Residencial Sol Nascente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <Label className="text-muted-foreground">CNPJ</Label>
            <Input 
              value={formatCNPJ(condominium.cnpj)} 
              disabled 
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              O CNPJ não pode ser alterado.
            </p>
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="contato@condominio.com.br" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="(11) 99999-9999" 
                    {...field}
                    onChange={(e) => field.onChange(formatPhone(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Endereço Completo</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Rua, número, bairro, cidade - UF" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={!isDirty || isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </form>
    </Form>
  );
}
