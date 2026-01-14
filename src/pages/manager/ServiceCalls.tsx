import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CallCard } from "@/components/calls/CallCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ServiceCall, 
  CallStatus, 
  ServiceCategory, 
  SERVICE_CATEGORIES,
  CALL_STATUSES
} from "@/types/database";
import { Plus, Search, Filter, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServiceCalls() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [calls, setCalls] = useState<(ServiceCall & { provider_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<CallStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | "all">("all");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (profile?.condominium_id) {
      fetchCalls();
    }
  }, [profile?.condominium_id]);

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("service_calls")
        .select(`
          *,
          service_providers (name)
        `)
        .eq("condominium_id", profile!.condominium_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedCalls = (data || []).map(call => ({
        ...call,
        provider_name: call.service_providers?.name,
      }));

      setCalls(formattedCalls);
    } catch (error) {
      console.error("Erro ao buscar chamados:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCalls = calls.filter(call => {
    // Tab filter
    if (activeTab !== "all" && call.status !== activeTab) {
      return false;
    }

    // Status filter
    if (statusFilter !== "all" && call.status !== statusFilter) {
      return false;
    }

    // Category filter
    if (categoryFilter !== "all" && call.category !== categoryFilter) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        call.title.toLowerCase().includes(search) ||
        call.description.toLowerCase().includes(search) ||
        call.location.toLowerCase().includes(search) ||
        call.id.toLowerCase().includes(search)
      );
    }

    return true;
  });

  const getTabCount = (status: CallStatus | "all") => {
    if (status === "all") return calls.length;
    return calls.filter(c => c.status === status).length;
  };

  return (
    <DashboardLayout title="Chamados">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-muted-foreground">
              Gerencie os chamados de manutenção do seu condomínio
            </p>
          </div>
          <Button onClick={() => navigate("/chamados/novo")} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Chamado
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, descrição, local ou ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as ServiceCategory | "all")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {SERVICE_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all" className="gap-1">
              Todos <span className="text-xs opacity-60">({getTabCount("all")})</span>
            </TabsTrigger>
            <TabsTrigger value="open" className="gap-1">
              Abertos <span className="text-xs opacity-60">({getTabCount("open")})</span>
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="gap-1">
              Em Andamento <span className="text-xs opacity-60">({getTabCount("in_progress")})</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-1">
              Concluídos <span className="text-xs opacity-60">({getTabCount("completed")})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : filteredCalls.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {calls.length === 0 
                    ? "Nenhum chamado encontrado. Crie o primeiro!" 
                    : "Nenhum chamado corresponde aos filtros aplicados."}
                </p>
                {calls.length === 0 && (
                  <Button 
                    onClick={() => navigate("/chamados/novo")} 
                    variant="outline" 
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Chamado
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCalls.map(call => (
                  <CallCard key={call.id} call={call} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
