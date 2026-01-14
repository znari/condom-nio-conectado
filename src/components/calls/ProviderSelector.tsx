import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ServiceCategory, SERVICE_CATEGORY_LABELS } from "@/types/database";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Phone, Mail, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Provider {
  id: string;
  name: string;
  phone_whatsapp: string;
  email: string | null;
  average_rating: number | null;
  total_ratings: number | null;
  categories: ServiceCategory[];
}

interface ProviderSelectorProps {
  category: ServiceCategory;
  selectedProviderId: string | null;
  onSelect: (providerId: string) => void;
}

export function ProviderSelector({ category, selectedProviderId, onSelect }: ProviderSelectorProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProviders() {
      setLoading(true);
      const { data, error } = await supabase
        .from("service_providers")
        .select("*")
        .contains("categories", [category])
        .order("average_rating", { ascending: false, nullsFirst: false });

      if (error) {
        console.error("Erro ao buscar prestadores:", error);
      } else {
        setProviders(data || []);
      }
      setLoading(false);
    }

    if (category) {
      fetchProviders();
    }
  }, [category]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-muted-foreground">
          Nenhum prestador cadastrado para a categoria "{SERVICE_CATEGORY_LABELS[category]}"
        </p>
        <Button onClick={() => navigate("/prestadores")} variant="outline">
          <UserPlus className="h-4 w-4 mr-2" />
          Cadastrar Prestador
        </Button>
      </div>
    );
  }

  return (
    <RadioGroup value={selectedProviderId || ""} onValueChange={onSelect} className="space-y-3">
      {providers.map(provider => (
        <div key={provider.id}>
          <RadioGroupItem value={provider.id} id={provider.id} className="peer sr-only" />
          <Label htmlFor={provider.id} className="cursor-pointer">
            <Card className={cn(
              "p-4 transition-all hover:shadow-md",
              selectedProviderId === provider.id 
                ? "border-primary ring-2 ring-primary/20" 
                : "border-border/50"
            )}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{provider.name}</span>
                    {provider.average_rating && provider.average_rating > 0 && (
                      <div className="flex items-center gap-1 text-warning">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-medium">
                          {provider.average_rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({provider.total_ratings} avaliações)
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {provider.phone_whatsapp}
                    </span>
                    {provider.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {provider.email}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors",
                  selectedProviderId === provider.id 
                    ? "border-primary bg-primary" 
                    : "border-muted-foreground/30"
                )}>
                  {selectedProviderId === provider.id && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
