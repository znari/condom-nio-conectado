import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Clock, HeadphonesIcon } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/5 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:100px_100px]" />

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Sistema de Gestão Condominial Inteligente
          </div>

          {/* Main headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Gestão Condominial
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              Inteligente. Simplificada.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 animate-fade-in">
            Centralize chamados de manutenção, gerencie prestadores de serviço e controle 
            custos em uma única plataforma moderna e intuitiva. Transforme a gestão do seu 
            condomínio com tecnologia de ponta.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in">
            <Button asChild size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300">
              <Link to="/cadastro">
                Cadastre seu Condomínio
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-6 border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
              onClick={scrollToFeatures}
            >
              <Play className="mr-2 h-5 w-5" />
              Ver Funcionalidades
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 animate-fade-in">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-sm">Aprovação em 24h</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm">100% Seguro</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <HeadphonesIcon className="h-5 w-5 text-primary" />
              <span className="text-sm">Suporte Dedicado</span>
            </div>
          </div>
        </div>

        {/* Dashboard preview mockup */}
        <div className="mt-20 max-w-6xl mx-auto animate-fade-in">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-primary/5 to-transparent rounded-2xl blur-2xl" />
            
            {/* Mockup container */}
            <div className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl border border-primary/20 p-2 shadow-2xl shadow-primary/10">
              <div className="bg-background/80 rounded-xl p-6 md:p-8">
                {/* Browser header mockup */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 ml-4">
                    <div className="bg-muted/50 rounded-full h-6 max-w-md mx-auto flex items-center px-3">
                      <span className="text-xs text-muted-foreground">zelasync.lovable.app/dashboard</span>
                    </div>
                  </div>
                </div>
                
                {/* Dashboard mockup content */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Chamados Abertos", value: "12", color: "from-blue-500 to-cyan-500" },
                    { label: "Em Andamento", value: "8", color: "from-amber-500 to-orange-500" },
                    { label: "Concluídos", value: "45", color: "from-green-500 to-emerald-500" },
                    { label: "Prestadores", value: "23", color: "from-purple-500 to-pink-500" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg p-4 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                      <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-muted-foreground/50 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
