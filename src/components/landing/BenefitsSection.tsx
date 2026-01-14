import { Clock, TrendingDown, History, MessageCircle, Shield, Zap } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    value: "70%",
    label: "Redução de tempo",
    description: "na gestão de chamados"
  },
  {
    icon: TrendingDown,
    value: "100%",
    label: "Controle de custos",
    description: "orçado vs realizado"
  },
  {
    icon: History,
    value: "∞",
    label: "Histórico completo",
    description: "de manutenções e avaliações"
  },
  {
    icon: MessageCircle,
    value: "1-Click",
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

const BenefitsSection = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-muted/20 to-background relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_50%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-16">
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
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group relative bg-gradient-to-br from-card to-card/80 rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
                  {benefit.value}
                </div>
                
                <div className="font-semibold mb-1">{benefit.label}</div>
                <div className="text-sm text-muted-foreground">{benefit.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional benefits */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {additionalBenefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-start gap-4 bg-gradient-to-br from-card/80 to-card/40 rounded-xl p-6 border border-border/50"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <benefit.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
