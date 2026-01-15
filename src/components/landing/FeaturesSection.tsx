import { 
  Wrench, 
  Users, 
  FileText, 
  ShoppingCart, 
  BarChart3, 
  FileBarChart,
  ArrowRight
} from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const features = [
  {
    icon: Wrench,
    title: "Chamados de Manutenção",
    description: "Crie, acompanhe e gerencie chamados com timeline completa, fotos antes/depois e status em tempo real. Nunca perca um chamado novamente.",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: Users,
    title: "Gestão de Prestadores",
    description: "Cadastre prestadores por categoria, avalie com sistema de estrelas, mantenha histórico de serviços e tenha acesso rápido via WhatsApp.",
    gradient: "from-violet-500 to-purple-500"
  },
  {
    icon: FileText,
    title: "Orçamentos Digitais",
    description: "Prestadores enviam orçamentos via link temporário seguro, sem necessidade de cadastro. Compare propostas lado a lado facilmente.",
    gradient: "from-amber-500 to-orange-500"
  },
  {
    icon: ShoppingCart,
    title: "Solicitações de Compras",
    description: "Fluxo completo de aprovação para produtos e materiais, com anexos de notas fiscais, justificativas e controle de orçamento.",
    gradient: "from-emerald-500 to-green-500"
  },
  {
    icon: BarChart3,
    title: "Dashboard Analítico",
    description: "Visualize métricas de desempenho, custos mensais, previsão de demanda e alertas de tempo de resolução em um painel intuitivo.",
    gradient: "from-rose-500 to-pink-500"
  },
  {
    icon: FileBarChart,
    title: "Relatórios Avançados",
    description: "Exporte relatórios em PDF e Excel com filtros personalizados. Ideal para prestação de contas em assembleias.",
    gradient: "from-teal-500 to-cyan-500"
  }
];

const FeaturesSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <section id="features" className="py-24 bg-background relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="container mx-auto px-4">
        <div 
          ref={headerRef}
          className={`max-w-4xl mx-auto text-center mb-16 transition-all duration-700 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tudo que Você Precisa em{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Uma Plataforma
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Funcionalidades pensadas para simplificar o dia a dia de síndicos e zeladores
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const { ref, isVisible } = useScrollAnimation({ threshold: 0.15 });
            return (
              <div
                key={index}
                ref={ref}
                className={`group relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm rounded-xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} p-0.5 mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <div className="w-full h-full rounded-[10px] bg-background flex items-center justify-center">
                      <feature.icon className={`h-7 w-7 bg-gradient-to-br ${feature.gradient} bg-clip-text text-transparent`} style={{ stroke: `url(#gradient-${index})` }} />
                      <svg width="0" height="0">
                        <defs>
                          <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={feature.gradient.includes('blue') ? '#3b82f6' : feature.gradient.includes('violet') ? '#8b5cf6' : feature.gradient.includes('amber') ? '#f59e0b' : feature.gradient.includes('emerald') ? '#10b981' : feature.gradient.includes('rose') ? '#f43f5e' : '#14b8a6'} />
                            <stop offset="100%" stopColor={feature.gradient.includes('cyan') ? '#06b6d4' : feature.gradient.includes('purple') ? '#a855f7' : feature.gradient.includes('orange') ? '#f97316' : feature.gradient.includes('green') ? '#22c55e' : feature.gradient.includes('pink') ? '#ec4899' : '#06b6d4'} />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {feature.description}
                  </p>
                  
                  <div className="flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span>Saiba mais</span>
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
