import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import Footer from "@/components/Footer";
import { useState } from "react";
import AuthModal from "@/components/AuthModal";

export default function CookiePolicy() {
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
                Política de Cookies
              </CardTitle>
              <p className="text-center text-muted-foreground">
                Última actualización: Enero 2024
              </p>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">¿Qué son las Cookies?</h2>
                <p className="text-muted-foreground">
                  Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Nos ayudan a recordar tus preferencias y mejorar tu experiencia de navegación.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Tipos de Cookies que Utilizamos</h2>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Cookies Esenciales</h3>
                      <Badge variant="destructive">Necesarias</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">
                      Estas cookies son necesarias para el funcionamiento básico del sitio web.
                    </p>
                    <ul className="list-disc pl-6 text-muted-foreground text-sm">
                      <li>Autenticación de usuario</li>
                      <li>Seguridad y prevención de fraude</li>
                      <li>Funcionalidad del carrito de compras</li>
                      <li>Preferencias de idioma</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Cookies Funcionales</h3>
                      <Badge variant="secondary">Opcionales</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">
                      Mejoran la funcionalidad y personalización del sitio.
                    </p>
                    <ul className="list-disc pl-6 text-muted-foreground text-sm">
                      <li>Recordar preferencias de usuario</li>
                      <li>Configuraciones del dashboard</li>
                      <li>Historial de navegación</li>
                      <li>Formularios guardados</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Cookies Analíticas</h3>
                      <Badge variant="secondary">Opcionales</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">
                      Nos ayudan a entender cómo los usuarios interactúan con nuestro sitio.
                    </p>
                    <ul className="list-disc pl-6 text-muted-foreground text-sm">
                      <li>Google Analytics</li>
                      <li>Métricas de rendimiento</li>
                      <li>Páginas más visitadas</li>
                      <li>Tiempo de sesión</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Cookies de Marketing</h3>
                      <Badge variant="secondary">Opcionales</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">
                      Utilizadas para mostrar anuncios relevantes y medir campañas.
                    </p>
                    <ul className="list-disc pl-6 text-muted-foreground text-sm">
                      <li>Publicidad personalizada</li>
                      <li>Remarketing</li>
                      <li>Seguimiento de conversiones</li>
                      <li>Análisis de audiencia</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Cookies de Terceros</h2>
                <p className="text-muted-foreground mb-3">
                  Algunas cookies son establecidas por servicios de terceros que utilizamos:
                </p>
                <div className="space-y-3">
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">Google Analytics</h4>
                    <p className="text-muted-foreground text-sm">
                      Para analizar el tráfico web y mejorar nuestro sitio.
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">MercadoPago</h4>
                    <p className="text-muted-foreground text-sm">
                      Para procesar pagos de forma segura.
                    </p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">reCAPTCHA</h4>
                    <p className="text-muted-foreground text-sm">
                      Para proteger contra spam y bots.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Duración de las Cookies</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold">Cookies de Sesión</h3>
                    <p className="text-muted-foreground text-sm">
                      Se eliminan automáticamente cuando cierras el navegador.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Cookies Persistentes</h3>
                    <p className="text-muted-foreground text-sm">
                      Permanecen en tu dispositivo por un período específico o hasta que las elimines manualmente.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Gestión de Cookies</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Configuración del Navegador</h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      Puedes controlar las cookies a través de la configuración de tu navegador:
                    </p>
                    <ul className="list-disc pl-6 text-muted-foreground text-sm">
                      <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
                      <li><strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies</li>
                      <li><strong>Safari:</strong> Preferencias → Privacidad → Cookies</li>
                      <li><strong>Edge:</strong> Configuración → Cookies y permisos del sitio</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold">Herramientas de Opt-out</h3>
                    <p className="text-muted-foreground text-sm">
                      Para cookies específicas de terceros, puedes optar por no participar:
                    </p>
                    <ul className="list-disc pl-6 text-muted-foreground text-sm">
                      <li>Google Analytics: <a href="https://tools.google.com/dlpage/gaoptout" className="text-primary hover:underline">Herramienta de exclusión</a></li>
                      <li>Marketing directo: <a href="http://www.youronlinechoices.com/" className="text-primary hover:underline">Your Online Choices</a></li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Impacto de Deshabilitar Cookies</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-muted-foreground text-sm">
                    <strong>Importante:</strong> Deshabilitar ciertas cookies puede afectar la funcionalidad del sitio web, incluyendo:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground text-sm mt-2">
                    <li>Dificultad para iniciar sesión</li>
                    <li>Pérdida de preferencias personalizadas</li>
                    <li>Funcionalidad limitada del dashboard</li>
                    <li>Problemas con el proceso de pago</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Actualizaciones de esta Política</h2>
                <p className="text-muted-foreground">
                  Podemos actualizar esta política de cookies ocasionalmente para reflejar cambios en nuestras prácticas o por razones legales. Te recomendamos revisar esta página periódicamente.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Contacto</h2>
                <p className="text-muted-foreground">
                  Si tienes preguntas sobre nuestro uso de cookies, contáctanos en:
                </p>
                <ul className="list-none pl-0 text-muted-foreground">
                  <li>Email: softwarepar.lat@gmail.com</li>
                  <li>Teléfono: +595 985 990 046</li>
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