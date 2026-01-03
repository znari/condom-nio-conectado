import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Wrench, Loader2, ArrowLeft, Building2, User, Mail, Lock, Phone, MapPin, FileText } from 'lucide-react';
import { z } from 'zod';
import { UserPosition } from '@/types/database';

// CNPJ validation function
function validateCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]/g, '');
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cnpj[12]) !== digit) return false;
  
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return parseInt(cnpj[13]) === digit;
}

const registerSchema = z.object({
  // Condominium data
  condominiumName: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cnpj: z.string().refine(validateCNPJ, 'CNPJ inválido'),
  address: z.string().min(10, 'Endereço deve ter no mínimo 10 caracteres'),
  phone: z.string().min(10, 'Telefone inválido'),
  condominiumEmail: z.string().email('E-mail do condomínio inválido'),
  // User data
  userName: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  position: z.enum(['sindico', 'zelador']),
  userEmail: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [formData, setFormData] = useState<Partial<FormData>>({
    position: 'sindico',
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 14);
    return cleaned
      .replace(/^(\d{2})/, '$1.')
      .replace(/^(\d{2})\.(\d{3})/, '$1.$2.')
      .replace(/\.(\d{3})\.(\d{3})/, '.$1.$2/')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    if (cleaned.length <= 10) {
      return cleaned
        .replace(/^(\d{2})/, '($1) ')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return cleaned
      .replace(/^(\d{2})/, '($1) ')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const validateStep1 = () => {
    const result = registerSchema.safeParse({
      ...formData,
      userName: 'temp',
      userEmail: 'temp@temp.com',
      password: 'temppass',
      confirmPassword: 'temppass',
    });
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormData, string>> = {};
      const step1Fields: (keyof FormData)[] = ['condominiumName', 'cnpj', 'address', 'phone', 'condominiumEmail'];
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormData;
        if (step1Fields.includes(field)) {
          fieldErrors[field] = err.message;
        }
      });
      
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Full validation
    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      // 1. Create condominium first
      const { data: condominiumData, error: condominiumError } = await supabase
        .from('condominiums')
        .insert({
          name: formData.condominiumName!,
          cnpj: formData.cnpj!.replace(/\D/g, ''),
          address: formData.address!,
          phone: formData.phone!.replace(/\D/g, ''),
          email: formData.condominiumEmail!,
          status: 'pending',
        })
        .select()
        .single();

      if (condominiumError) {
        if (condominiumError.message.includes('duplicate')) {
          toast({
            title: 'Erro',
            description: 'Este CNPJ já está cadastrado',
            variant: 'destructive',
          });
        } else {
          throw condominiumError;
        }
        setLoading(false);
        return;
      }

      // 2. Create user account
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.userEmail!,
        password: formData.password!,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: formData.userName,
            condominium_id: condominiumData.id,
            position: formData.position,
            role: 'manager',
          },
        },
      });

      if (signUpError) {
        // Rollback: delete condominium
        await supabase.from('condominiums').delete().eq('id', condominiumData.id);
        
        if (signUpError.message.includes('already registered')) {
          toast({
            title: 'Erro',
            description: 'Este e-mail já está cadastrado',
            variant: 'destructive',
          });
        } else {
          throw signUpError;
        }
        setLoading(false);
        return;
      }

      toast({
        title: 'Cadastro realizado!',
        description: 'Seu cadastro foi enviado para aprovação. Você receberá uma notificação quando for aprovado.',
      });

      navigate('/auth');
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao realizar o cadastro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Wrench className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">ZelaSync</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastro de Condomínio
          </p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              {step === 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setStep(1)}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <CardTitle className="text-xl">
                  {step === 1 ? 'Dados do Condomínio' : 'Dados do Responsável'}
                </CardTitle>
                <CardDescription>
                  Etapa {step} de 2
                </CardDescription>
              </div>
            </div>
            {/* Progress */}
            <div className="flex gap-2 pt-2">
              <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            </div>
          </CardHeader>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); if (validateStep1()) setStep(2); } : handleSubmit}>
            <CardContent className="space-y-4">
              {step === 1 ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="condominiumName">Nome do Condomínio</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="condominiumName"
                        placeholder="Condomínio Exemplo"
                        value={formData.condominiumName || ''}
                        onChange={(e) => updateField('condominiumName', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.condominiumName && (
                      <p className="text-sm text-destructive">{errors.condominiumName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="cnpj"
                        placeholder="00.000.000/0000-00"
                        value={formData.cnpj || ''}
                        onChange={(e) => updateField('cnpj', formatCNPJ(e.target.value))}
                        className="pl-10"
                      />
                    </div>
                    {errors.cnpj && (
                      <p className="text-sm text-destructive">{errors.cnpj}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço Completo</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="address"
                        placeholder="Rua, número, bairro, cidade - UF"
                        value={formData.address || ''}
                        onChange={(e) => updateField('address', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.address && (
                      <p className="text-sm text-destructive">{errors.address}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="(00) 00000-0000"
                        value={formData.phone || ''}
                        onChange={(e) => updateField('phone', formatPhone(e.target.value))}
                        className="pl-10"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condominiumEmail">E-mail do Condomínio</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="condominiumEmail"
                        type="email"
                        placeholder="contato@condominio.com"
                        value={formData.condominiumEmail || ''}
                        onChange={(e) => updateField('condominiumEmail', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.condominiumEmail && (
                      <p className="text-sm text-destructive">{errors.condominiumEmail}</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="userName">Nome do Responsável</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="userName"
                        placeholder="Seu nome completo"
                        value={formData.userName || ''}
                        onChange={(e) => updateField('userName', e.target.value)}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                    {errors.userName && (
                      <p className="text-sm text-destructive">{errors.userName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Cargo</Label>
                    <Select
                      value={formData.position}
                      onValueChange={(value) => updateField('position', value)}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione seu cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sindico">Síndico</SelectItem>
                        <SelectItem value="zelador">Zelador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userEmail">Seu E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="userEmail"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.userEmail || ''}
                        onChange={(e) => updateField('userEmail', e.target.value)}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                    {errors.userEmail && (
                      <p className="text-sm text-destructive">{errors.userEmail}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password || ''}
                        onChange={(e) => updateField('password', e.target.value)}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword || ''}
                        onChange={(e) => updateField('confirmPassword', e.target.value)}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {step === 1 ? 'Continuar' : 'Cadastrar'}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <Link to="/auth" className="font-medium text-primary hover:underline">
                  Faça login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
