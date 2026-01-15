import { Building2, Briefcase, Building } from "lucide-react";
import { useScrollAnimation, useParallax } from "@/hooks/useScrollAnimation";

const scenarios = [
  {
    icon: Building2,
    title: "Condomínios Residenciais",
    description: "Ideal para condomínios de apartamentos e casas",
    features: [
      "Gestão de manutenções prediais (elevadores, bombas, portões)",
      "Controle de prestadores de serviço por especialidade",
      "Aprovação de compras pelo síndico com justificativas",
      "Relatórios para prestação de contas em assembleias"
    ],
    gradient: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500"
  },
  {
    icon: Briefcase,
    title: "Condomínios Comerciais",
    description: "Perfeito para edifícios comerciais e empresariais",
    features: [
      "Manutenção de áreas comuns e fachadas",
      "Gestão de fornecedores por categoria de serviço",
      "Orçamentos comparativos para grandes reparos",
      "Controle de custos por centro de custo"
    ],
    gradient: "from-violet-500/20 to-purple-500/20",
    borderColor: "border-violet-500/30",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500"
  },
  {
    icon: Building,
    title: "Administradoras",
    description: "Solução para administradoras de condomínios",
    features: [
      "Gestão multi-condomínio em uma única plataforma",
      "Visão consolidada de todos os chamados",
      "Controle centralizado de custos e prestadores",
      "Relatórios executivos para diretoria"
    ],
    gradient: "from-emerald-500/20 to-green-500/20",
    borderColor: "border-emerald-500/30",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500"
  }
];

const ScenariosSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: parallaxRef, offset } = useParallax(0.2);

  return (
    <section ref={parallaxRef} className="py-24 bg-gradient-to-b from-muted/20 to-background relative overflow-hidden">
      {/* Subtle parallax background */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.05),transparent_70%)]"
        style={{ transform: `translateY(${offset * 0.3}px)` }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div 
          ref={headerRef}
          className={`max-w-4xl mx-auto text-center mb-16 transition-all duration-700 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Cenários de{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Aplicação
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            O ZelaSync se adapta às necessidades de diferentes tipos de gestão condominial
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {scenarios.map((scenario, index) => {
            const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });
            const direction = index % 2 === 0 ? 'translate-x-0' : 'translate-x-0';
            const initialDirection = index === 0 ? '-translate-x-10' : index === 2 ? 'translate-x-10' : 'translate-y-10';
            
            return (
              <div
                key={index}
                ref={ref}
                className={`group relative bg-gradient-to-br ${scenario.gradient} rounded-2xl p-8 border ${scenario.borderColor} hover:scale-[1.02] transition-all duration-500 ${
                  isVisible ? `opacity-100 ${direction}` : `opacity-0 ${initialDirection}`
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                {/* Icon */}
                <div className={`w-16 h-16 rounded-xl ${scenario.iconBg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <scenario.icon className={`h-8 w-8 ${scenario.iconColor}`} />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold mb-2">{scenario.title}</h3>
                <p className="text-muted-foreground mb-6">{scenario.description}</p>

                {/* Features list */}
                <ul className="space-y-3">
                  {scenario.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full ${scenario.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <svg className={`w-3 h-3 ${scenario.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ScenariosSection;
