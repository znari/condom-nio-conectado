import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSolutionSection from "@/components/landing/ProblemSolutionSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ScenariosSection from "@/components/landing/ScenariosSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const LandingPage = () => {
  useEffect(() => {
    // Smooth scroll for anchor links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLAnchorElement;
      if (target.hash) {
        const element = document.querySelector(target.hash);
        if (element) {
          e.preventDefault();
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);
    return () => document.removeEventListener("click", handleAnchorClick);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">Z</span>
              </div>
              <span className="text-lg font-bold">ZelaSync</span>
            </Link>

            {/* Nav links - Desktop */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Funcionalidades
              </a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </a>
            </div>

            {/* Auth buttons */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link to="/auth">
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/cadastro">Cadastrar</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main>
        <HeroSection />
        <ProblemSolutionSection />
        <FeaturesSection />
        <ScenariosSection />
        <HowItWorksSection />
        <BenefitsSection />
        <FAQSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
