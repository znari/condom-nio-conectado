import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollAnimation, useParallax } from "@/hooks/useScrollAnimation";

const CTASection = () => {
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation({ threshold: 0.3 });
  const { ref: parallaxRef, offset } = useParallax(0.2);

  return (
    <section ref={parallaxRef} className="py-24 relative overflow-hidden">
      {/* Background gradient with parallax */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5"
        style={{ transform: `translateY(${offset * 0.2}px)` }}
      />
      
      {/* Animated background elements */}
      <div 
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-glow-pulse"
        style={{ transform: `translateY(${offset * 0.4}px)` }}
      />
      <div 
        className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/5 rounded-full blur-3xl animate-glow-pulse"
        style={{ transform: `translateY(${offset * 0.3}px)`, animationDelay: '1.5s' }}
      />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div 
          ref={contentRef}
          className={`max-w-4xl mx-auto text-center transition-all duration-700 ${
            contentVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'
          }`}
        >
          {/* Badge with logo */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
            <img src="/favicon.png" alt="" className="h-4 w-4 rounded" />
            Comece Gratuitamente
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Pronto para{" "}
            <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              Modernizar
            </span>
            <br />
            a Gestão do seu Condomínio?
          </h2>

          {/* Subtitle */}
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Junte-se a síndicos e zeladores que já transformaram a forma de gerenciar 
            manutenções, prestadores e compras. Cadastro aprovado em até 24 horas.
          </p>

          {/* CTA Button with pulse effect on hover */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button 
              asChild 
              size="lg" 
              className="text-lg px-10 py-7 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-105 animate-pulse-slow"
            >
              <Link to="/cadastro">
                Cadastrar Meu Condomínio
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Trust text */}
          <p className="text-sm text-muted-foreground">
            Cadastro 100% gratuito • Aprovação em até 24h • Suporte dedicado
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
