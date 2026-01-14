import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PhotoUpload } from "@/components/calls/PhotoUpload";
import { ProviderSelector } from "@/components/calls/ProviderSelector";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ServiceCategory, 
  UrgencyLevel,
  SERVICE_CATEGORIES,
  URGENCY_LEVELS,
  SERVICE_CATEGORY_LABELS
} from "@/types/database";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  FileText, 
  Camera, 
  User, 
  CheckCircle,
  Loader2 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4;

interface FormData {
  title: string;
  description: string;
  location: string;
  category: ServiceCategory | "";
  urgency: UrgencyLevel;
  photos: string[];
  providerId: string | null;
}

const steps = [
  { number: 1, title: "Informações", icon: FileText },
  { number: 2, title: "Fotos", icon: Camera },
  { number: 3, title: "Prestador", icon: User },
  { number: 4, title: "Confirmação", icon: CheckCircle },
];

export default function ServiceCallNew() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    location: "",
    category: "",
    urgency: "medium",
    photos: [],
    providerId: null,
  });

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 1:
        if (!formData.title || formData.title.length < 5) {
          toast.error("O título deve ter pelo menos 5 caracteres");
          return false;
        }
        if (!formData.description || formData.description.length < 10) {
          toast.error("A descrição deve ter pelo menos 10 caracteres");
          return false;
        }
        if (!formData.location || formData.location.length < 3) {
          toast.error("O local deve ter pelo menos 3 caracteres");
          return false;
        }
        if (!formData.category) {
          toast.error("Selecione uma categoria");
          return false;
        }
        return true;
      case 2:
        // Photos are now optional in step 2, they will be uploaded after call creation
        return true;
      case 3:
        if (!formData.providerId) {
          toast.error("Selecione um prestador");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1) as Step);
  };

  const handleSubmit = async () => {
    if (!profile?.condominium_id || !user?.id) {
      toast.error("Erro de autenticação");
      return;
    }

    setSubmitting(true);
    try {
      // Create the service call
      const { data: callData, error: callError } = await supabase
        .from("service_calls")
        .insert({
          condominium_id: profile.condominium_id,
          title: formData.title,
          description: formData.description,
          location: formData.location,
          category: formData.category as "encanador" | "eletricista" | "pintor" | "jardineiro" | "limpeza" | "chaveiro" | "vidraceiro" | "porteiro" | "outros",
          urgency: formData.urgency,
          provider_id: formData.providerId,
          status: "sent" as const,
          created_by: user.id,
        })
        .select()
        .single();

      if (callError) throw callError;

      // Upload photos if any pending
      const uploadFn = (window as any)["uploadPhotos_initial"];
      if (uploadFn && callData) {
        const uploadedUrls = await uploadFn(callData.id);
        
        // Save photo records
        if (uploadedUrls && uploadedUrls.length > 0) {
          const photoRecords = uploadedUrls.map((url: string) => ({
            service_call_id: callData.id,
            photo_url: url,
            type: "initial" as const,
          }));

          const { error: photosError } = await supabase
            .from("service_call_photos")
            .insert(photoRecords);

          if (photosError) {
            console.error("Erro ao salvar fotos:", photosError);
          }
        }
      }

      // Create temporary link for quote
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      await supabase.from("temporary_links").insert({
        service_call_id: callData.id,
        type: "quote",
        expires_at: expiresAt.toISOString(),
      });

      toast.success("Chamado criado com sucesso!");
      navigate(`/chamados/${callData.id}`);
    } catch (error) {
      console.error("Erro ao criar chamado:", error);
      toast.error("Erro ao criar chamado");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Novo Chamado">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Steps indicator */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            
            return (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    isCompleted 
                      ? "bg-success text-success-foreground" 
                      : isActive 
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs mt-1 font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "h-0.5 w-12 sm:w-20 mx-2",
                    currentStep > step.number ? "bg-success" : "bg-border"
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Informações do Chamado"}
              {currentStep === 2 && "Fotos do Problema"}
              {currentStep === 3 && "Selecionar Prestador"}
              {currentStep === 4 && "Confirmar Chamado"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Preencha os detalhes do problema a ser resolvido"}
              {currentStep === 2 && "Adicione fotos para ajudar o prestador a entender o problema"}
              {currentStep === 3 && "Escolha o prestador que realizará o serviço"}
              {currentStep === 4 && "Revise as informações e confirme o envio"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic info */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Vazamento no banheiro do bloco A"
                    value={formData.title}
                    onChange={e => updateFormData("title", e.target.value)}
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.title.length}/100
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva o problema em detalhes..."
                    value={formData.description}
                    onChange={e => updateFormData("description", e.target.value)}
                    rows={4}
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.description.length}/2000
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Local *</Label>
                  <Input
                    id="location"
                    placeholder="Ex: Bloco A - Garagem subsolo"
                    value={formData.location}
                    onChange={e => updateFormData("location", e.target.value)}
                    maxLength={200}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria *</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(v) => updateFormData("category", v as ServiceCategory)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Urgência *</Label>
                    <RadioGroup 
                      value={formData.urgency} 
                      onValueChange={(v) => updateFormData("urgency", v as UrgencyLevel)}
                      className="flex flex-wrap gap-2"
                    >
                      {URGENCY_LEVELS.map(level => (
                        <div key={level.value} className="flex items-center">
                          <RadioGroupItem 
                            value={level.value} 
                            id={level.value}
                            className="peer sr-only" 
                          />
                          <Label
                            htmlFor={level.value}
                            className={cn(
                              "px-3 py-1.5 rounded-full cursor-pointer border transition-colors",
                              formData.urgency === level.value
                                ? level.color + " border-transparent"
                                : "border-border hover:bg-muted"
                            )}
                          >
                            {level.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Photos */}
            {currentStep === 2 && (
              <PhotoUpload
                type="initial"
                onPhotosChange={(urls) => updateFormData("photos", urls)}
                existingPhotos={formData.photos}
                maxPhotos={5}
                minPhotos={0}
              />
            )}

            {/* Step 3: Provider selection */}
            {currentStep === 3 && formData.category && (
              <ProviderSelector
                category={formData.category as ServiceCategory}
                selectedProviderId={formData.providerId}
                onSelect={(id) => updateFormData("providerId", id)}
              />
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Título</p>
                    <p className="font-medium">{formData.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Local</p>
                    <p className="font-medium">{formData.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categoria</p>
                    <p className="font-medium">
                      {SERVICE_CATEGORY_LABELS[formData.category as ServiceCategory]}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Urgência</p>
                    <p className="font-medium">
                      {URGENCY_LEVELS.find(l => l.value === formData.urgency)?.label}
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="font-medium whitespace-pre-wrap">{formData.description}</p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Ao confirmar, o chamado será enviado ao prestador selecionado e um link de orçamento será gerado automaticamente com validade de 48 horas.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t">
              {currentStep > 1 ? (
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              ) : (
                <Button variant="outline" onClick={() => navigate("/chamados")}>
                  Cancelar
                </Button>
              )}

              {currentStep < 4 ? (
                <Button onClick={nextStep}>
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Criar Chamado
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
