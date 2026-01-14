import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CallStatusBadge } from "@/components/calls/CallStatusBadge";
import { UrgencyBadge } from "@/components/calls/UrgencyBadge";
import { CallTimeline } from "@/components/calls/CallTimeline";
import { StatusChangeDropdown } from "@/components/calls/StatusChangeDropdown";
import { RatingModal } from "@/components/calls/RatingModal";
import { supabase } from "@/integrations/supabase/client";
import { 
  ServiceCall, 
  ServiceCallPhoto, 
  ServiceProvider,
  CallStatus,
  SERVICE_CATEGORY_LABELS,
  ServiceCategory
} from "@/types/database";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Phone, 
  Mail, 
  Star,
  DollarSign,
  Clock,
  ExternalLink,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface FullServiceCall extends ServiceCall {
  provider?: ServiceProvider;
  photos: ServiceCallPhoto[];
}

export default function ServiceCallDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [call, setCall] = useState<FullServiceCall | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [signedPhotoUrls, setSignedPhotoUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      fetchCall();
    }
  }, [id]);

  // Generate signed URLs for photos
  const generateSignedUrls = async (photos: ServiceCallPhoto[]) => {
    const signedUrls: Record<string, string> = {};
    
    for (const photo of photos) {
      // Extract the file path from the full URL
      const urlMatch = photo.photo_url.match(/service-call-photos\/(.+?)(\?|$)/);
      if (urlMatch) {
        const filePath = urlMatch[1];
        const { data: signedUrl } = await supabase.storage
          .from('service-call-photos')
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (signedUrl) {
          signedUrls[photo.id] = signedUrl.signedUrl;
        }
      } else {
        // Fallback to original URL if it's already a signed URL
        signedUrls[photo.id] = photo.photo_url;
      }
    }
    
    return signedUrls;
  };

  const fetchCall = async () => {
    setLoading(true);
    try {
      const { data: callData, error: callError } = await supabase
        .from("service_calls")
        .select(`
          *,
          service_providers (*)
        `)
        .eq("id", id)
        .maybeSingle();

      if (callError) throw callError;
      if (!callData) {
        toast.error("Chamado não encontrado");
        navigate("/chamados");
        return;
      }

      // Fetch photos
      const { data: photosData } = await supabase
        .from("service_call_photos")
        .select("*")
        .eq("service_call_id", id)
        .order("uploaded_at", { ascending: true });

      const photos = photosData || [];
      
      // Generate signed URLs for all photos
      if (photos.length > 0) {
        const signedUrls = await generateSignedUrls(photos);
        setSignedPhotoUrls(signedUrls);
      }

      setCall({
        ...callData,
        provider: callData.service_providers,
        photos: photos,
      });
    } catch (error) {
      console.error("Erro ao buscar chamado:", error);
      toast.error("Erro ao carregar chamado");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (newStatus: CallStatus) => {
    if (call) {
      setCall({ ...call, status: newStatus });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Detalhes do Chamado">
        <div className="space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!call) {
    return null;
  }

  const initialPhotos = call.photos.filter(p => p.type === "initial");
  const completionPhotos = call.photos.filter(p => p.type === "completion");

  return (
    <DashboardLayout title="Detalhes do Chamado">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button variant="ghost" onClick={() => navigate("/chamados")} className="w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <StatusChangeDropdown
            callId={call.id}
            currentStatus={call.status}
            onStatusChanged={handleStatusChange}
          />
        </div>

        {/* Main info card */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <CallStatusBadge status={call.status} />
              <UrgencyBadge urgency={call.urgency} showIcon />
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {SERVICE_CATEGORY_LABELS[call.category as ServiceCategory]}
              </span>
            </div>
            <CardTitle className="text-xl">{call.title}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {call.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(call.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Descrição</h4>
              <p className="whitespace-pre-wrap">{call.description}</p>
            </div>

            {/* Provider info */}
            {call.provider && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Prestador Designado</h4>
                  <div className="flex items-start justify-between gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{call.provider.name}</span>
                        {call.provider.average_rating > 0 && (
                          <div className="flex items-center gap-1 text-warning">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="text-sm">{call.provider.average_rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <a 
                          href={`https://wa.me/55${call.provider.phone_whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          <Phone className="h-3 w-3" />
                          {call.provider.phone_whatsapp}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {call.provider.email && (
                          <a 
                            href={`mailto:${call.provider.email}`}
                            className="flex items-center gap-1 hover:text-foreground"
                          >
                            <Mail className="h-3 w-3" />
                            {call.provider.email}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Budget info */}
            {(call.estimated_value || call.estimated_time || call.estimated_completion_date) && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Orçamento</h4>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {call.estimated_value && (
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-sm">Valor Estimado</span>
                        </div>
                        <p className="text-lg font-semibold">
                          {new Intl.NumberFormat("pt-BR", { 
                            style: "currency", 
                            currency: "BRL" 
                          }).format(call.estimated_value)}
                        </p>
                      </div>
                    )}
                    {call.estimated_time && (
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">Tempo Estimado</span>
                        </div>
                        <p className="text-lg font-semibold">{call.estimated_time}</p>
                      </div>
                    )}
                    {call.estimated_completion_date && (
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">Previsão de Conclusão</span>
                        </div>
                        <p className="text-lg font-semibold">
                          {format(new Date(call.estimated_completion_date), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Photos */}
            {initialPhotos.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Fotos do Problema</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {initialPhotos.map(photo => {
                      const photoUrl = signedPhotoUrls[photo.id] || photo.photo_url;
                      return (
                        <a 
                          key={photo.id}
                          href={photoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-square rounded-lg overflow-hidden border hover:opacity-90 transition-opacity"
                        >
                          <img 
                            src={photoUrl} 
                            alt="Foto do chamado" 
                            className="w-full h-full object-cover"
                          />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {completionPhotos.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Fotos de Conclusão</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {completionPhotos.map(photo => {
                      const photoUrl = signedPhotoUrls[photo.id] || photo.photo_url;
                      return (
                        <a 
                          key={photo.id}
                          href={photoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-square rounded-lg overflow-hidden border hover:opacity-90 transition-opacity"
                        >
                          <img 
                            src={photoUrl} 
                            alt="Foto de conclusão" 
                            className="w-full h-full object-cover"
                          />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Rating section */}
            {call.status === "completed" && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Avaliação</h4>
                  {call.rating ? (
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= call.rating! 
                                ? "text-warning fill-warning" 
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                      {call.rating_comment && (
                        <p className="text-sm text-muted-foreground">{call.rating_comment}</p>
                      )}
                    </div>
                  ) : (
                    <Button onClick={() => setRatingModalOpen(true)} variant="outline">
                      <Star className="h-4 w-4 mr-2" />
                      Avaliar Prestador
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            <CallTimeline call={call} />
          </CardContent>
        </Card>
      </div>

      {/* Rating Modal */}
      {call.provider && (
        <RatingModal
          open={ratingModalOpen}
          onOpenChange={setRatingModalOpen}
          serviceCallId={call.id}
          providerId={call.provider.id}
          providerName={call.provider.name}
          onRated={fetchCall}
        />
      )}
    </DashboardLayout>
  );
}
