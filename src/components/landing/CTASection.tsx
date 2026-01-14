import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
      
      {/* Animated background elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
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

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button 
              asChild 
              size="lg" 
              className="text-lg px-10 py-7 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
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
