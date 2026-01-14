import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Como funciona a aprovação do cadastro?",
    answer: "Após enviar o cadastro do seu condomínio com CNPJ e informações básicas, nossa equipe analisa os dados em até 24 horas úteis. Você receberá um e-mail de confirmação assim que seu acesso for liberado. Esse processo garante a segurança e integridade da plataforma."
  },
  {
    question: "Preciso pagar para começar a usar?",
    answer: "O ZelaSync oferece diferentes planos para atender às necessidades de cada condomínio. Entre em contato conosco para conhecer as opções disponíveis e encontrar o plano ideal para o seu caso. Oferecemos condições especiais para novos clientes."
  },
  {
    question: "Como os prestadores enviam orçamentos?",
    answer: "Você pode gerar um link temporário e seguro para cada chamado. Esse link é enviado ao prestador via WhatsApp e permite que ele visualize os detalhes do serviço e envie sua proposta diretamente na plataforma, sem precisar criar conta."
  },
  {
    question: "O sistema funciona em dispositivos móveis?",
    answer: "Sim! O ZelaSync é totalmente responsivo e funciona perfeitamente em smartphones, tablets e computadores. Você pode gerenciar chamados, aprovar orçamentos e consultar relatórios de qualquer lugar."
  },
  {
    question: "Como exportar relatórios para assembleias?",
    answer: "Na seção de Relatórios, você pode gerar documentos detalhados em PDF e Excel com filtros por período, categoria, prestador e status. Ideal para prestação de contas em assembleias ordinárias e extraordinárias."
  },
  {
    question: "Posso cadastrar mais de um usuário para o mesmo condomínio?",
    answer: "Sim! O ZelaSync permite cadastrar múltiplos usuários com diferentes níveis de acesso. Síndicos podem ter acesso completo enquanto zeladores têm permissões específicas para suas funções do dia a dia."
  },
  {
    question: "Os dados do meu condomínio estão seguros?",
    answer: "Absolutamente. Utilizamos criptografia de ponta para proteger todos os dados, com backups automáticos diários. Nossa infraestrutura segue as melhores práticas de segurança da informação e está em conformidade com a LGPD."
  }
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Perguntas{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Frequentes
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Tire suas dúvidas sobre o ZelaSync
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-gradient-to-br from-card/80 to-card/40 rounded-xl border border-border/50 px-6 data-[state=open]:border-primary/30 transition-colors duration-300"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5">
                  <span className="font-semibold pr-4">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
