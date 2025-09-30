
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Code, Menu, X } from "lucide-react";
import Logo from "./Logo";

interface LayoutProps {
  children: React.ReactNode;
  onAuthClick: (mode: "login" | "register") => void;
}

export default function Layout({ children, onAuthClick }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isStaticPage, setIsStaticPage] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 100);
    };

    // Check if we're on a static page with white background
    const checkStaticPage = () => {
      const path = window.location.pathname;
      const staticPages = ['/privacidad', '/cookies', '/terminos'];
      setIsStaticPage(staticPages.includes(path));
    };

    checkStaticPage();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    // Si no estamos en la página principal, redirigir primero
    if (window.location.pathname !== '/') {
      window.location.href = `/#${sectionId}`;
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  const handleWhatsAppContact = () => {
    const whatsappNumber = "+595985990046";
    const message = "¡Hola! Me interesa conocer más sobre sus servicios de desarrollo de software.";
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-background font-sans"> {/* Apply Poppins font */}
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 backdrop-blur-md border-b z-40 transition-all duration-300 ${
        isScrolled || isStaticPage
          ? 'bg-white/95 border-border shadow-lg'
          : 'bg-card/80 border-border/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <button
              onClick={() => window.location.href = '/'}
              className="hover:opacity-80 transition-opacity"
            >
              <Logo
                size="md"
                textClassName={`transition-colors duration-300 ${
                  isScrolled || isStaticPage ? 'text-foreground' : 'text-white'
                }`}
              />
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="/"
                className={`transition-all duration-300 hover:scale-105 font-semibold ${
                  window.location.pathname !== '/' || isScrolled || isStaticPage
                    ? 'text-foreground hover:text-primary'
                    : 'text-white hover:text-white/80'
                }`}
                data-testid="nav-inicio"
              >
                Inicio
              </a>
              <button
                onClick={() => scrollToSection('servicios')}
                className={`transition-all duration-300 hover:scale-105 font-semibold ${
                  window.location.pathname !== '/' || isScrolled || isStaticPage
                    ? 'text-foreground hover:text-primary'
                    : 'text-white hover:text-white/80'
                }`}
                data-testid="nav-servicios"
              >
                Servicios
              </button>
              <button
                onClick={() => scrollToSection('precios')}
                className={`transition-all duration-300 hover:scale-105 font-semibold ${
                  window.location.pathname !== '/' || isScrolled || isStaticPage
                    ? 'text-foreground hover:text-primary'
                    : 'text-white hover:text-white/80'
                }`}
                data-testid="nav-precios"
              >
                Precios
              </button>
              <button
                onClick={() => scrollToSection('contacto')}
                className={`transition-all duration-300 hover:scale-105 font-medium ${
                  window.location.pathname !== '/' || isScrolled || isStaticPage
                    ? 'text-foreground hover:text-primary'
                    : 'text-white hover:text-white/80'
                }`}
                data-testid="nav-contacto"
              >
                Contacto
              </button>

              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => onAuthClick('login')}
                  className={`transition-all duration-300 font-semibold ${
                    window.location.pathname !== '/' || isScrolled || isStaticPage
                      ? 'text-foreground hover:bg-muted hover:text-primary'
                      : 'text-white hover:bg-white/20 hover:text-white'
                  }`}
                  data-testid="button-login"
                >
                  Iniciar Sesión
                </Button>
                <Button
                  onClick={handleWhatsAppContact}
                  className={`font-semibold shadow-lg transition-all duration-300 hover:scale-105 ${
                    window.location.pathname !== '/' || isScrolled || isStaticPage
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                  data-testid="button-contact"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 mr-2 fill-white"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.785"/>
                  </svg>
                  Contáctenos
                </Button>
              </div>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className={`md:hidden transition-colors duration-300 ${
                isScrolled || isStaticPage ? 'text-foreground hover:bg-muted' : 'text-white hover:bg-white/20'
              }`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className={`md:hidden border-t transition-colors duration-300 ${
            isScrolled || isStaticPage
              ? 'bg-white/95 border-border'
              : 'bg-card/95 border-border/50'
          }`}>
            <div className="px-4 py-3 space-y-3">
              <a
                href="/"
                className={`block w-full text-left hover:text-primary py-2 font-medium transition-colors duration-300 ${
                  window.location.pathname !== '/' || isScrolled || isStaticPage ? 'text-foreground' : 'text-white'
                }`}
                data-testid="mobile-nav-inicio"
              >
                Inicio
              </a>
              <button
                onClick={() => scrollToSection('servicios')}
                className={`block w-full text-left hover:text-primary py-2 font-medium transition-colors duration-300 ${
                  window.location.pathname !== '/' || isScrolled || isStaticPage ? 'text-muted-foreground' : 'text-white/90'
                }`}
                data-testid="mobile-nav-servicios"
              >
                Servicios
              </button>
              <button
                onClick={() => scrollToSection('precios')}
                className={`block w-full text-left hover:text-primary py-2 font-medium transition-colors duration-300 ${
                  window.location.pathname !== '/' || isScrolled || isStaticPage ? 'text-muted-foreground' : 'text-white/90'
                }`}
                data-testid="mobile-nav-precios"
              >
                Precios
              </button>
              <button
                onClick={() => scrollToSection('contacto')}
                className={`block w-full text-left hover:text-primary py-2 font-medium transition-colors duration-300 ${
                  window.location.pathname !== '/' || isScrolled || isStaticPage ? 'text-muted-foreground' : 'text-white/90'
                }`}
                data-testid="mobile-nav-contacto"
              >
                Contacto
              </button>
              <div className={`pt-3 border-t space-y-2 transition-colors duration-300 ${
                isScrolled || isStaticPage ? 'border-border' : 'border-white/20'
              }`}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    window.location.pathname !== '/' || isScrolled || isStaticPage
                      ? 'text-foreground hover:bg-muted'
                      : 'text-white hover:bg-white/20 hover:text-white'
                  }`}
                  onClick={() => onAuthClick('login')}
                  data-testid="mobile-button-login"
                >
                  Iniciar Sesión
                </Button>
                <Button
                  className="w-full bg-green-500 text-white hover:bg-green-600 transition-colors duration-300"
                  onClick={handleWhatsAppContact}
                  data-testid="mobile-button-contact"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 mr-2 fill-white"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.785"/>
                  </svg>
                  Contáctenos
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {children}
    </div>
  );
}
