import { Code, Mail, Phone, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Logo from "./Logo";

export default function Footer() {
  const scrollToServices = () => {
    // Si no estamos en la página principal, redirigir primero
    if (window.location.pathname !== '/') {
      window.location.href = '/#servicios';
      return;
    }

    const element = document.getElementById('servicios');
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-muted/30 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <Logo size="md" textClassName="text-foreground" />
            </div>
            <p className="text-muted-foreground mb-6 max-w-md">
              Especialistas en desarrollo de software a medida en Paraguay. 
              Transformamos ideas en aplicaciones exitosas.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-foreground font-semibold mb-4">Servicios</h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={scrollToServices} 
                  className="text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  Aplicaciones Web
                </button>
              </li>
              <li>
                <button 
                  onClick={scrollToServices} 
                  className="text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  Apps Móviles
                </button>
              </li>
              <li>
                <button 
                  onClick={scrollToServices} 
                  className="text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  Cloud & DevOps
                </button>
              </li>
              <li>
                <button 
                  onClick={scrollToServices} 
                  className="text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  Business Intelligence
                </button>
              </li>
              <li>
                <button 
                  onClick={scrollToServices} 
                  className="text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  Ciberseguridad
                </button>
              </li>
              <li>
                <button 
                  onClick={scrollToServices} 
                  className="text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  Soporte 24/7
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-foreground font-semibold mb-4">Contacto</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-primary" />
                softwarepar.lat@gmail.com
              </li>
              <li className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-primary" />
                +595 985 990 046
              </li>
              <li className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary" />
                Itapúa, Carlos Antonio López
              </li>
              <li className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                Lun - Vie: 9:00 - 18:00
              </li>
            </ul>
          </div>
        </div>

        {/* Payment Methods & Partners */}
        <div className="border-t border-border mt-12 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* QR AFIP */}
            <div className="text-center lg:text-left">
              <h5 className="text-foreground font-semibold mb-3">Facturación Legal</h5>
              <div className="flex items-center justify-center lg:justify-start space-x-4">
                <div className="w-16 h-16 bg-white p-2 rounded-lg border">
                  <img 
                    src="https://www.afip.gob.ar/images/f960/AFIP.jpg" 
                    alt="QR AFIP" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Cpath d='m9 9 3 3 3-3M12 12v9'/%3E%3C/svg%3E";
                    }}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Inscripto en AFIP</p>
                  <p>Monotributo</p>
                  <p>CUIT: 27-12345678-9</p>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="text-center">
              <h5 className="text-foreground font-semibold mb-3">Medios de Pago</h5>
              <div className="flex items-center justify-center">
                <img 
                  src="/medios-pago.png?v=2" 
                  alt="Métodos de pago: Visa, MasterCard, Mango, Ueno, Solar" 
                  className="h-12 object-contain"
                />
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  Mango Wallet
                </Badge>
                <Badge variant="outline" className="text-xs ml-2">
                  Transferencia Bancaria
                </Badge>
              </div>
            </div>

            {/* Technology Partners */}
            <div className="text-center lg:text-right">
              <h5 className="text-foreground font-semibold mb-3">Partners Tecnológicos</h5>
              <div className="flex items-center justify-center lg:justify-end space-x-4">
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex items-center space-x-3">
                    <img 
                      src="https://cdn.worldvectorlogo.com/logos/aws-2.svg" 
                      alt="AWS" 
                      className="h-8 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <img 
                      src="https://cdn.worldvectorlogo.com/logos/google-cloud-1.svg" 
                      alt="Google Cloud" 
                      className="h-8 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <img 
                      src="https://cdn.worldvectorlogo.com/logos/microsoft-azure-2.svg" 
                      alt="Microsoft Azure" 
                      className="h-8 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      Replit Partner
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Vercel Partner
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 SoftwarePar. Todos los derechos reservados.</p>
          <p className="mt-2">
            <a href="/terminos" className="hover:text-primary transition-colors">Términos de Servicio</a>
            <span className="mx-2">•</span>
            <a href="/privacidad" className="hover:text-primary transition-colors">Política de Privacidad</a>
            <span className="mx-2">•</span>
            <a href="/cookies" className="hover:text-primary transition-colors">Cookies</a>
          </p>
        </div>
      </div>
    </footer>
  );
}