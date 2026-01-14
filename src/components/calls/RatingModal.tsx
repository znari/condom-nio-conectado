import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceCallId: string;
  providerId: string;
  providerName: string;
  onRated: () => void;
}

export function RatingModal({ 
  open, 
  onOpenChange, 
  serviceCallId, 
  providerId, 
  providerName,
  onRated 
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Selecione uma avaliação");
      return;
    }

    setSubmitting(true);
    try {
      // Update service call with rating
      const { error: callError } = await supabase
        .from("service_calls")
        .update({
          rating,
          rating_comment: comment || null,
        })
        .eq("id", serviceCallId);

      if (callError) throw callError;

      // Recalculate provider average rating
      const { data: callsData, error: callsError } = await supabase
        .from("service_calls")
        .select("rating")
        .eq("provider_id", providerId)
        .not("rating", "is", null);

      if (callsError) throw callsError;

      const ratings = callsData.map(c => c.rating).filter(Boolean) as number[];
      const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

      const { error: providerError } = await supabase
        .from("service_providers")
        .update({
          average_rating: Number(avgRating.toFixed(2)),
          total_ratings: ratings.length,
        })
        .eq("id", providerId);

      if (providerError) throw providerError;

      toast.success("Avaliação enviada com sucesso!");
      onRated();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error);
      toast.error("Erro ao enviar avaliação");
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar Prestador</DialogTitle>
          <DialogDescription>
            Como foi o serviço realizado por {providerName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      value <= displayRating
                        ? "text-warning fill-warning"
                        : "text-muted-foreground/30"
                    )}
                  />
                </button>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {displayRating === 0 && "Clique para avaliar"}
              {displayRating === 1 && "Muito ruim"}
              {displayRating === 2 && "Ruim"}
              {displayRating === 3 && "Regular"}
              {displayRating === 4 && "Bom"}
              {displayRating === 5 && "Excelente"}
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comentário (opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Descreva como foi a experiência..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || rating === 0}>
            {submitting ? "Enviando..." : "Enviar Avaliação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
