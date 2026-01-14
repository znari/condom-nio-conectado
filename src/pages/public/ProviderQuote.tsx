import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UrgencyBadge } from "@/components/calls/UrgencyBadge";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { 
  Building2, 
  MapPin, 
  Calendar as CalendarIcon, 
  Clock, 
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Image as ImageIcon
} from "lucide-react";
import { SERVICE_CATEGORY_LABELS } from "@/types/database";
import type { Database } from "@/integrations/supabase/types";

type ServiceCall = Database['public']['Tables']['service_calls']['Row'];
type TemporaryLink = Database['public']['Tables']['temporary_links']['Row'];
type ServiceCategory = Database['public']['Enums']['service_category'];
type UrgencyLevel = Database['public']['Enums']['urgency_level'];

interface QuoteData {
  serviceCall: ServiceCall & { 
    category: ServiceCategory;
    urgency: UrgencyLevel;
  };
  condominium: { name: string };
  photos: { photo_url: string }[];
  temporaryLink: TemporaryLink;
}

type PageState = 'loading' | 'valid' | 'expired' | 'used' | 'not_found' | 'success';

const ESTIMATED_TIME_OPTIONS = [
  { value: "1h", label: "1 hora" },
  { value: "2h", label: "2 horas" },
  { value: "4h", label: "4 horas" },
  { value: "8h", label: "8 horas (1 dia)" },
  { value: "2d", label: "2 dias" },
  { value: "3d", label: "3 dias" },
  { value: "1w", label: "1 semana" },
  { value: "2w", label: "2 semanas" },
];

export default function ProviderQuote() {
  const { token } = useParams<{ token: string }>();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [data, setData] = useState<QuoteData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Form state
  const [estimatedValue, setEstimatedValue] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [completionDate, setCompletionDate] = useState<Date>();
  const [observations, setObservations] = useState("");

  useEffect(() => {
    if (token) {
      fetchQuoteData();
    }
  }, [token]);

  const fetchQuoteData = async () => {
    try {
      // Fetch temporary link
      const { data: linkData, error: linkError } = await supabase
        .from('temporary_links')
        .select('*')
        .eq('token', token)
        .eq('type', 'quote')
        .single();

      if (linkError || !linkData) {
        setPageState('not_found');
        return;
      }

      // Check if expired
      if (new Date(linkData.expires_at) < new Date()) {
        setPageState('expired');
        return;
      }

      // Check if already used
      if (linkData.used_at) {
        setPageState('used');
        return;
      }

      // Fetch service call
      const { data: callData, error: callError } = await supabase
        .from('service_calls')
        .select('*')
        .eq('id', linkData.service_call_id)
        .single();

      if (callError || !callData) {
        setPageState('not_found');
        return;
      }

      // Fetch condominium
      const { data: condoData, error: condoError } = await supabase
        .from('condominiums')
        .select('name')
        .eq('id', callData.condominium_id)
        .single();

      if (condoError || !condoData) {
        setPageState('not_found');
        return;
      }

      // Fetch photos
      const { data: photosData } = await supabase
        .from('service_call_photos')
        .select('photo_url')
        .eq('service_call_id', callData.id)
        .eq('type', 'initial');

      setData({
        serviceCall: callData as QuoteData['serviceCall'],
        condominium: condoData,
        photos: photosData || [],
        temporaryLink: linkData,
      });
      setPageState('valid');
    } catch (error) {
      console.error('Error fetching quote data:', error);
      setPageState('not_found');
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const number = parseInt(numericValue, 10) / 100;
    if (isNaN(number)) return '';
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setEstimatedValue(formatted);
  };

  const parseValue = (formatted: string): number => {
    if (!formatted) return 0;
    const cleaned = formatted.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const value = parseValue(estimatedValue);
    
    // Validations
    if (value < 1) {
      toast.error("O valor deve ser no mínimo R$ 1,00");
      return;
    }
    if (!estimatedTime) {
      toast.error("Selecione o tempo estimado");
      return;
    }
    if (!completionDate) {
      toast.error("Selecione a data prevista");
      return;
    }
    if (completionDate <= new Date()) {
      toast.error("A data prevista deve ser no futuro");
      return;
    }

    setSubmitting(true);
    try {
      // Update service call with quote
      const { error: updateError } = await supabase
        .from('service_calls')
        .update({
          estimated_value: value,
          estimated_time: estimatedTime,
          estimated_completion_date: format(completionDate, 'yyyy-MM-dd'),
          completion_notes: observations || null,
          status: 'awaiting_approval',
        })
        .eq('id', data!.serviceCall.id);

      if (updateError) throw updateError;

      // Mark link as used
      const { error: linkError } = await supabase
        .from('temporary_links')
        .update({ used_at: new Date().toISOString() })
        .eq('id', data!.temporaryLink.id);

      if (linkError) throw linkError;

      // Create notification for manager
      const { data: creatorData } = await supabase
        .from('service_calls')
        .select('created_by')
        .eq('id', data!.serviceCall.id)
        .single();

      if (creatorData?.created_by) {
        await supabase.from('notifications').insert({
          user_id: creatorData.created_by,
          type: 'quote_received',
          title: 'Novo orçamento recebido',
          message: `O prestador enviou um orçamento de R$ ${estimatedValue} para o chamado "${data!.serviceCall.title}"`,
          data: { service_call_id: data!.serviceCall.id },
        });
      }

      setPageState('success');
      toast.success("Orçamento enviado com sucesso!");
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast.error("Erro ao enviar orçamento. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (pageState === 'not_found') {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Link Inválido</h1>
            <p className="text-muted-foreground">
              Este link não foi encontrado ou é inválido.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Expired state
  if (pageState === 'expired') {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <AlertTriangle className="h-16 w-16 text-warning mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Link Expirado</h1>
            <p className="text-muted-foreground mb-4">
              Este link expirou e não pode mais ser utilizado.
            </p>
            <p className="text-sm text-muted-foreground">
              Entre em contato com o condomínio para solicitar um novo link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Used state
  if (pageState === 'used') {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Orçamento Já Enviado</h1>
            <p className="text-muted-foreground">
              O orçamento para este chamado já foi enviado anteriormente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Orçamento Enviado!</h1>
            <p className="text-muted-foreground mb-6">
              Seu orçamento foi enviado com sucesso e está aguardando aprovação do condomínio.
            </p>
            <div className="bg-muted rounded-lg p-4 text-left space-y-2">
              <p><strong>Valor:</strong> R$ {estimatedValue}</p>
              <p><strong>Tempo estimado:</strong> {ESTIMATED_TIME_OPTIONS.find(o => o.value === estimatedTime)?.label}</p>
              <p><strong>Data prevista:</strong> {completionDate && format(completionDate, "dd/MM/yyyy")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid state - show form
  return (
    <div className="min-h-screen bg-muted py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">ZelaSync</h1>
          <p className="text-muted-foreground">Sistema de Gestão de Condomínios</p>
        </div>

        {/* Service Call Info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{data?.serviceCall.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4" />
                  {data?.condominium.name}
                </CardDescription>
              </div>
              <UrgencyBadge urgency={data?.serviceCall.urgency || 'medium'} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Descrição</h4>
              <p className="text-foreground">{data?.serviceCall.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Local</p>
                  <p className="font-medium">{data?.serviceCall.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <p className="font-medium">
                    {SERVICE_CATEGORY_LABELS[data?.serviceCall.category || 'electrical']}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Criado em</p>
                  <p className="font-medium">
                    {data?.serviceCall.created_at && 
                      format(parseISO(data.serviceCall.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>

            {/* Photos */}
            {data?.photos && data.photos.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Fotos do Chamado
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {data.photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(photo.photo_url)}
                      className="aspect-video rounded-lg overflow-hidden bg-muted hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={photo.photo_url}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quote Form */}
        <Card>
          <CardHeader>
            <CardTitle>Enviar Orçamento</CardTitle>
            <CardDescription>
              Preencha os campos abaixo para enviar seu orçamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="value">Valor do Serviço (R$) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="value"
                    type="text"
                    value={estimatedValue}
                    onChange={handleValueChange}
                    placeholder="0,00"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Tempo Estimado *</Label>
                <Select value={estimatedTime} onValueChange={setEstimatedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tempo" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTIMATED_TIME_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data Prevista de Conclusão *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !completionDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {completionDate ? (
                        format(completionDate, "dd/MM/yyyy")
                      ) : (
                        "Selecione uma data"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={completionDate}
                      onSelect={setCompletionDate}
                      disabled={(date) => date <= new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observações (opcional)</Label>
                <Textarea
                  id="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Informações adicionais sobre o orçamento..."
                  maxLength={500}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {observations.length}/500 caracteres
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Orçamento"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Este link expira em{" "}
          {data?.temporaryLink.expires_at &&
            format(parseISO(data.temporaryLink.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Foto ampliada"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
