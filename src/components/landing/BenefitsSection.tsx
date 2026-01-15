import { Clock, TrendingDown, History, MessageCircle, Shield, Zap } from "lucide-react";
import { useScrollAnimation, useParallax } from "@/hooks/useScrollAnimation";
import { useEffect, useState } from "react";

const benefits = [
  {
    icon: Clock,
    value: "70%",
    numericValue: 70,
    suffix: "%",
    label: "Redução de tempo",
    description: "na gestão de chamados"
  },
  {
    icon: TrendingDown,
    value: "100%",
    numericValue: 100,
    suffix: "%",
    label: "Controle de custos",
    description: "orçado vs realizado"
  },
  {
    icon: History,
    value: "∞",
    numericValue: null,
    suffix: "",
    label: "Histórico completo",
    description: "de manutenções e avaliações"
  },
  {
    icon: MessageCircle,
    value: "1-Click",
    numericValue: null,
    suffix: "",
    label: "Comunicação direta",
    description: "via WhatsApp integrado"
  }
];

const additionalBenefits = [
  {
    icon: Shield,
    title: "Segurança de Dados",
    description: "Seus dados são protegidos com criptografia de ponta e backups automáticos"
  },
  {
    icon: Zap,
    title: "Atualizações Constantes",
    description: "Novas funcionalidades e melhorias são adicionadas regularmente sem custo extra"
  }
];

const CountUpNumber = ({ value, suffix, isVisible }: { value: number | null; suffix: string; isVisible: boolean }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible || value === null) return;
    
    let start = 0;
    const end = value;
    const duration = 2000;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isVisible, value]);

  if (value === null) return null;
  
  return <>{count}{suffix}</>;
};

const BenefitsSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: parallaxRef, offset } = useParallax(0.2);

  return (
    <section ref={parallaxRef} className="py-24 bg-gradient-to-b from-muted/20 to-background relative overflow-hidden">
      {/* Background pattern with parallax */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_50%)]"
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
            Benefícios{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Quantificáveis
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Resultados reais para a gestão do seu condomínio
          </p>
        </div>

        {/* Main benefits grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-16">
          {benefits.map((benefit, index) => {
            const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });
            return (
              <div
                key={index}
                ref={ref}
                className={`group relative bg-gradient-to-br from-card to-card/80 rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-500 text-center ${
                  isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300" />
                
                <div className="relative z-10">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  
                  <div className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
                    {benefit.numericValue !== null ? (
                      <CountUpNumber value={benefit.numericValue} suffix={benefit.suffix} isVisible={isVisible} />
                    ) : (
                      benefit.value
                    )}
                  </div>
                  
                  <div className="font-semibold mb-1">{benefit.label}</div>
                  <div className="text-sm text-muted-foreground">{benefit.description}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional benefits */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {additionalBenefits.map((benefit, index) => {
            const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });
            return (
              <div
                key={index}
                ref={ref}
                className={`flex items-start gap-4 bg-gradient-to-br from-card/80 to-card/40 rounded-xl p-6 border border-border/50 transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-x-0' : `opacity-0 ${index === 0 ? '-translate-x-10' : 'translate-x-10'}`
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
