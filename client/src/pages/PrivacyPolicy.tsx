import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import Footer from "@/components/Footer";
import { useState } from "react";
import AuthModal from "@/components/AuthModal";

export default function PrivacyPolicy() {
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
                Política de Privacidad
              </CardTitle>
              <p className="text-center text-muted-foreground">
                Última actualización: Enero 2024
              </p>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Información que Recopilamos</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold">1.1 Información Personal</h3>
                    <ul className="list-disc pl-6 text-muted-foreground">
                      <li>Nombre completo y datos de contacto</li>
                      <li>Dirección de correo electrónico</li>
                      <li>Número de teléfono</li>
                      <li>Información de facturación</li>
                      <li>Datos de empresa (si aplica)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold">1.2 Información Técnica</h3>
                    <ul className="list-disc pl-6 text-muted-foreground">
                      <li>Dirección IP y datos de navegación</li>
                      <li>Tipo de dispositivo y navegador</li>
                      <li>Cookies y tecnologías similares</li>
                      <li>Logs de actividad en la plataforma</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Cómo Utilizamos la Información</h2>
                <ul className="list-disc pl-6 text-muted-foreground">
                  <li>Proveer y mejorar nuestros servicios</li>
                  <li>Procesar pagos y gestionar facturación</li>
                  <li>Comunicarnos contigo sobre proyectos y actualizaciones</li>
                  <li>Gestionar el programa de partners y comisiones</li>
                  <li>Cumplir con obligaciones legales y fiscales</li>
                  <li>Personalizar tu experiencia en la plataforma</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Compartir Información</h2>
                <p className="text-muted-foreground mb-3">
                  No vendemos, intercambiamos o transferimos tu información personal a terceros, excepto en los siguientes casos:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground">
                  <li>Proveedores de servicios confiables (procesamiento de pagos, hosting)</li>
                  <li>Cumplimiento de leyes y regulaciones</li>
                  <li>Protección de derechos y seguridad</li>
                  <li>Con tu consentimiento explícito</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Seguridad de Datos</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground">
                    Implementamos medidas de seguridad técnicas y organizativas para proteger tu información:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground">
                    <li>Encriptación SSL/TLS para todas las transmisiones</li>
                    <li>Almacenamiento seguro en bases de datos protegidas</li>
                    <li>Acceso restringido solo a personal autorizado</li>
                    <li>Monitoreo continuo de seguridad</li>
                    <li>Backups regulares y procedimientos de recuperación</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Cookies y Tecnologías de Seguimiento</h2>
                <div className="space-y-3">
                  <p className="text-muted-foreground">
                    Utilizamos cookies para mejorar tu experiencia:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground">
                    <li><strong>Esenciales:</strong> Necesarias para el funcionamiento básico</li>
                    <li><strong>Funcionales:</strong> Recordar preferencias y configuraciones</li>
                    <li><strong>Analíticas:</strong> Entender cómo usas nuestro sitio</li>
                    <li><strong>Marketing:</strong> Personalizar contenido y anuncios</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Tus Derechos</h2>
                <p className="text-muted-foreground mb-3">Tienes derecho a:</p>
                <ul className="list-disc pl-6 text-muted-foreground">
                  <li>Acceder a tu información personal</li>
                  <li>Rectificar datos incorrectos o incompletos</li>
                  <li>Solicitar la eliminación de tus datos</li>
                  <li>Limitar el procesamiento de tu información</li>
                  <li>Portabilidad de datos</li>
                  <li>Oponerte al procesamiento para marketing directo</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Retención de Datos</h2>
                <p className="text-muted-foreground">
                  Conservamos tu información personal solo durante el tiempo necesario para cumplir con los propósitos descritos en esta política, o según lo requiera la ley argentina.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Transferencias Internacionales</h2>
                <p className="text-muted-foreground">
                  Algunos de nuestros proveedores de servicios pueden estar ubicados fuera de Argentina. Garantizamos que dichas transferencias cumplan con las regulaciones de protección de datos aplicables.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Menores de Edad</h2>
                <p className="text-muted-foreground">
                  Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos intencionalmente información personal de menores sin el consentimiento parental verificable.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Cambios en la Política</h2>
                <p className="text-muted-foreground">
                  Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos sobre cambios significativos a través de nuestro sitio web o por email.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">11. Contacto</h2>
                <p className="text-muted-foreground">
                  Para ejercer tus derechos o consultas sobre privacidad, contáctanos en:
                </p>
                <ul className="list-none pl-0 text-muted-foreground">
                  <li>Email: softwarepar.lat@gmail.com</li>
                  <li>Teléfono: +595 985 990 046</li>
                  <li>Dirección: Itapúa, Carlos Antonio López, Paraguay</li>
                </ul>
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