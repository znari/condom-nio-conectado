import { FileSpreadsheet, MessagesSquare, PieChart, ArrowDown, Sparkles } from "lucide-react";

const problems = [
  {
    icon: FileSpreadsheet,
    title: "Planilhas Desorganizadas",
    description: "Controle manual de chamados em planilhas confusas e desatualizadas"
  },
  {
    icon: MessagesSquare,
    title: "Comunicação Fragmentada",
    description: "WhatsApp, e-mail, ligações... informações perdidas em múltiplos canais"
  },
  {
    icon: PieChart,
    title: "Falta de Controle de Custos",
    description: "Dificuldade em acompanhar gastos e comparar orçamentos de prestadores"
  }
];

const ProblemSolutionSection = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.05),transparent_70%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Chega de <span className="text-destructive">Caos</span> na Gestão Condominial
          </h2>
          <p className="text-lg text-muted-foreground">
            Síndicos e zeladores enfrentam desafios diários que consomem tempo e geram retrabalho
          </p>
        </div>

        {/* Problems grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {problems.map((problem, index) => (
            <div 
              key={index}
              className="group relative bg-gradient-to-br from-destructive/5 to-destructive/10 rounded-xl p-6 border border-destructive/20 hover:border-destructive/40 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <problem.icon className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{problem.title}</h3>
              <p className="text-sm text-muted-foreground">{problem.description}</p>
            </div>
          ))}
        </div>

        {/* Transition arrow */}
        <div className="flex justify-center mb-16">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
              <ArrowDown className="h-8 w-8 text-primary-foreground animate-bounce" />
            </div>
          </div>
        </div>

        {/* Solution */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            A Solução
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              ZelaSync
            </span>
            {" "}Transforma sua Gestão
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma unificada que centraliza todas as operações do seu condomínio, 
            desde chamados de manutenção até relatórios financeiros detalhados.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolutionSection;
