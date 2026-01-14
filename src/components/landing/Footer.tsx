import { Link } from "react-router-dom";
import { Mail, Building2 } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-background to-muted/30 border-t border-border/50">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand section */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">Z</span>
              </div>
              <span className="text-xl font-bold">ZelaSync</span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md">
              Sistema inteligente de gestão condominial. Simplifique chamados de manutenção, 
              gerencie prestadores e controle custos em uma única plataforma.
            </p>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a href="mailto:contato@nexuslab.net.br" className="hover:text-primary transition-colors">
                contato@nexuslab.net.br
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                  Funcionalidades
                </a>
              </li>
              <li>
                <a href="#faq" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <Link to="/cadastro" className="text-muted-foreground hover:text-primary transition-colors">
                  Cadastrar Condomínio
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors">
                  Acessar Sistema
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  LGPD
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-8" />

        {/* Bottom section - Company info */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span className="text-sm font-medium">
              NEXUS LAB SOLUÇÕES EM TECNOLOGIA E INTELIGÊNCIA ARTIFICIAL LTDA
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            CNPJ: 64.037.239/0001-19
          </p>

          <div className="pt-4 border-t border-border/30 max-w-md mx-auto">
            <p className="text-sm text-muted-foreground">
              © {currentYear} ZelaSync. Todos os direitos reservados.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Desenvolvido por{" "}
              <span className="text-primary font-medium">
                Nexus Lab Soluções em Tecnologia
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
