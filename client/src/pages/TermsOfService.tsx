import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import Footer from "@/components/Footer";
import { useState } from "react";
import AuthModal from "@/components/AuthModal";

export default function TermsOfService() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const openAuthModal = (mode: "login" | "register") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <Layout onAuthClick={openAuthModal}>
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-background min-h-screen">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">
                Términos y Condiciones de Servicio
              </CardTitle>
              <p className="text-center text-muted-foreground">
                Última actualización: Enero 2024
              </p>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Aceptación de los Términos</h2>
                <p className="text-muted-foreground">
                  Al acceder y utilizar los servicios de SoftwarePar, usted acepta estar sujeto a estos términos y condiciones de servicio y todas las leyes y regulaciones aplicables.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Descripción del Servicio</h2>
                <p className="text-muted-foreground">
                  SoftwarePar ofrece servicios de desarrollo de software, incluyendo:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground">
                  <li>Desarrollo de aplicaciones web y móviles</li>
                  <li>Consultoría en tecnología</li>
                  <li>Servicios de hosting y mantenimiento</li>
                  <li>Programa de partners con comisiones</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Modalidades de Trabajo</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">3.1 Compra Completa</h3>
                    <p className="text-muted-foreground">
                      El cliente adquiere la propiedad total del código fuente y recibe soporte técnico según el plan contratado.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">3.2 Partnership</h3>
                    <p className="text-muted-foreground">
                      El partner obtiene un descuento inicial y genera comisiones por ventas futuras mediante un código de referencia único.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Pagos y Facturación</h2>
                <ul className="list-disc pl-6 text-muted-foreground">
                  <li>Los pagos se procesan a través de transferencias bancarias y billeteras digitales locales</li>
                  <li>Métodos disponibles: Mango (4220058), Ueno Bank (4220058), Banco Solar (softwarepar.lat@gmail.com)</li>
                  <li>Facturación A disponible para empresas</li>
                  <li>Las comisiones de partners se liquidan mensualmente</li>
                  <li>Todos los precios están en USD salvo indicación contraria</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Propiedad Intelectual</h2>
                <p className="text-muted-foreground">
                  En la modalidad de compra completa, el cliente obtiene todos los derechos sobre el código desarrollado. En la modalidad partnership, SoftwarePar mantiene la propiedad del software base.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Garantías y Soporte</h2>
                <ul className="list-disc pl-6 text-muted-foreground">
                  <li>Garantía de 6 meses en todos los desarrollos</li>
                  <li>Soporte técnico 24/7 según el plan contratado</li>
                  <li>Actualizaciones de seguridad incluidas</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Limitación de Responsabilidad</h2>
                <p className="text-muted-foreground">
                  SoftwarePar no será responsable por daños indirectos, incidentales o consecuentes que surjan del uso de nuestros servicios.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Modificaciones</h2>
                <p className="text-muted-foreground">
                  Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a través de nuestro sitio web.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Contacto</h2>
                <p className="text-muted-foreground">
                  Para consultas sobre estos términos, contáctanos en: softwarepar.lat@gmail.com
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </Layout>
  );
}