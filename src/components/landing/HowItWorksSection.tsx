import { UserPlus, Clock, Settings, Rocket } from "lucide-react";
import { useScrollAnimation, useParallax } from "@/hooks/useScrollAnimation";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Cadastre-se",
    description: "Registre seu condomínio em poucos minutos com informações básicas como CNPJ e endereço.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Clock,
    number: "02",
    title: "Aguarde Aprovação",
    description: "Nossa equipe analisa seu cadastro em até 24 horas úteis para garantir a segurança da plataforma.",
    color: "from-amber-500 to-orange-500"
  },
  {
    icon: Settings,
    number: "03",
    title: "Configure",
    description: "Adicione prestadores de serviço, personalize categorias e configure alertas de tempo de resolução.",
    color: "from-violet-500 to-purple-500"
  },
  {
    icon: Rocket,
    number: "04",
    title: "Comece a Usar",
    description: "Crie seu primeiro chamado, solicite orçamentos e gerencie compras com total controle.",
    color: "from-emerald-500 to-green-500"
  }
];

const HowItWorksSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: parallaxRef, offset } = useParallax(0.15);

  return (
    <section ref={parallaxRef} className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration with parallax */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl"
        style={{ transform: `translate(-50%, -50%) translateY(${offset * 0.5}px)` }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div 
          ref={headerRef}
          className={`max-w-4xl mx-auto text-center mb-16 transition-all duration-700 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Como{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Funciona
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Comece a usar o ZelaSync em 4 passos simples
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Desktop timeline */}
          <div className="hidden md:block relative">
            {/* Connecting line with animation */}
            {(() => {
              const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });
              return (
                <div 
                  ref={ref}
                  className={`absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-amber-500 via-violet-500 to-emerald-500 transition-all duration-1000 origin-left ${
                    isVisible ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              );
            })()}
            
            <div className="grid grid-cols-4 gap-8">
              {steps.map((step, index) => {
                const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });
                return (
                  <div 
                    key={index} 
                    ref={ref}
                    className={`relative transition-all duration-700 ${
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                    style={{ transitionDelay: `${index * 200}ms` }}
                  >
                    {/* Step number circle */}
                    <div className="relative z-10 mb-8">
                      <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${step.color} p-0.5 shadow-lg`}>
                        <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                          <step.icon className="h-8 w-8 text-primary" />
                        </div>
                      </div>
                      <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r ${step.color} text-white text-xs font-bold`}>
                        {step.number}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile timeline */}
          <div className="md:hidden space-y-8">
            {steps.map((step, index) => {
              const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });
              return (
                <div 
                  key={index} 
                  ref={ref}
                  className={`flex gap-6 transition-all duration-500 ${
                    isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Left side with icon and line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${step.color} p-0.5 shadow-lg flex-shrink-0`}>
                      <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                        <step.icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-primary/50 to-primary/20 mt-4" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="pb-8">
                    <div className={`inline-block px-2 py-0.5 rounded bg-gradient-to-r ${step.color} text-white text-xs font-bold mb-2`}>
                      {step.number}
                    </div>
                    <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
