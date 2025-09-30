import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';
import { Send, MessageCircle, Phone, Mail, MapPin, Clock, CheckCircle2, Star, Zap } from 'lucide-react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+595',
    company: '',
    serviceType: '',
    budget: '',
    timeline: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await apiRequest('POST', '/api/contact', {
        fullName: formData.name,
        email: formData.email,
        phone: formData.countryCode + ' ' + formData.phone,
        company: formData.company,
        serviceType: formData.serviceType,
        budget: formData.budget,
        timeline: formData.timeline,
        subject: formData.subject,
        message: formData.message
      });

      const result = await response.json();

      toast({
        title: "¡Mensaje enviado exitosamente!",
        description: result.message,
      });

      // Limpiar formulario
      setFormData({
        name: '',
        email: '',
        phone: '',
        countryCode: '+595',
        company: '',
        serviceType: '',
        budget: '',
        timeline: '',
        subject: '',
        message: ''
      });

    } catch (error) {
      console.error('Error enviando formulario:', error);
      toast({
        title: "Error al enviar mensaje",
        description: error instanceof Error ? error.message : "No se pudo enviar el mensaje. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
      {/* Formulario de contacto - Ocupa 2 columnas */}
      <div className="lg:col-span-2">
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 backdrop-blur-sm">
          <CardHeader className="text-center pb-8 bg-gradient-to-r from-primary/5 via-blue-50/50 to-primary/5 rounded-t-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl text-slate-800 font-bold">
              Contáctanos
            </CardTitle>
            <CardDescription className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Completa el formulario y te responderemos en menos de 24 horas con una propuesta personalizada
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Información personal */}
              <div className="bg-gradient-to-r from-slate-50/50 to-blue-50/30 p-6 rounded-xl border border-slate-200/50">
                <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  Información Personal
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-slate-700 font-medium">Nombre Completo *</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Tu nombre completo"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="h-12 border-slate-200 bg-white/70 backdrop-blur-sm focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-slate-700 font-medium">Email Corporativo *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="tu@empresa.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="h-12 border-slate-200 bg-white/70 backdrop-blur-sm focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-slate-700 font-medium">Teléfono / WhatsApp</Label>
                    <div className="flex gap-2">
                      <Select value={formData.countryCode || '+595'} onValueChange={(value) => handleSelectChange('countryCode', value)}>
                        <SelectTrigger className="w-[140px] h-12 border-slate-200 bg-white/70 backdrop-blur-sm focus:border-primary/50 focus:ring-primary/20">
                          <SelectValue placeholder="País" />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 backdrop-blur-sm border-slate-200">
                          <SelectItem value="+595">🇵🇾 +595</SelectItem>
                          <SelectItem value="+54">🇦🇷 +54</SelectItem>
                          <SelectItem value="+55">🇧🇷 +55</SelectItem>
                          <SelectItem value="+598">🇺🇾 +598</SelectItem>
                          <SelectItem value="+591">🇧🇴 +591</SelectItem>
                          <SelectItem value="+56">🇨🇱 +56</SelectItem>
                          <SelectItem value="+51">🇵🇪 +51</SelectItem>
                          <SelectItem value="+57">🇨🇴 +57</SelectItem>
                          <SelectItem value="+58">🇻🇪 +58</SelectItem>
                          <SelectItem value="+593">🇪🇨 +593</SelectItem>
                          <SelectItem value="+1">🇺🇸 +1</SelectItem>
                          <SelectItem value="+34">🇪🇸 +34</SelectItem>
                          <SelectItem value="+52">🇲🇽 +52</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="985 990 046"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="flex-1 h-12 border-slate-200 bg-white/70 backdrop-blur-sm focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="company" className="text-slate-700 font-medium">Empresa / Organización</Label>
                    <Input
                      id="company"
                      name="company"
                      type="text"
                      placeholder="Nombre de tu empresa"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="h-12 border-slate-200 bg-white/70 backdrop-blur-sm focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Detalles del proyecto */}
              <div className="bg-gradient-to-r from-blue-50/30 to-indigo-50/30 p-6 rounded-xl border border-slate-200/50">
                <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  Detalles del Proyecto
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="serviceType" className="text-slate-700 font-medium">Tipo de Servicio *</Label>
                    <Select value={formData.serviceType} onValueChange={(value) => handleSelectChange('serviceType', value)}>
                      <SelectTrigger className="h-12 border-slate-200 bg-white/70 backdrop-blur-sm focus:border-primary/50 focus:ring-primary/20">
                        <SelectValue placeholder="Selecciona un servicio" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-sm border-slate-200">
                        <SelectItem value="web-app">🌐 Aplicación Web</SelectItem>
                        <SelectItem value="mobile-app">📱 Aplicación Móvil</SelectItem>
                        <SelectItem value="e-commerce">🛒 E-commerce</SelectItem>
                        <SelectItem value="dashboard">📊 Dashboard / BI</SelectItem>
                        <SelectItem value="cloud">☁️ Cloud & DevOps</SelectItem>
                        <SelectItem value="crm">👥 Sistema CRM</SelectItem>
                        <SelectItem value="api">🔗 API Development</SelectItem>
                        <SelectItem value="maintenance">🔧 Soporte & Mantenimiento</SelectItem>
                        <SelectItem value="other">💡 Otro (especificar en mensaje)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="budget" className="text-slate-700 font-medium">Presupuesto Estimado (USD)</Label>
                    <Select value={formData.budget} onValueChange={(value) => handleSelectChange('budget', value)}>
                      <SelectTrigger className="h-12 border-slate-200 bg-white/70 backdrop-blur-sm focus:border-primary/50 focus:ring-primary/20">
                        <SelectValue placeholder="Rango de presupuesto" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-sm border-slate-200">
                        <SelectItem value="2500-5000">💰 $2,500 - $5,000</SelectItem>
                        <SelectItem value="5000-10000">💼 $5,000 - $10,000</SelectItem>
                        <SelectItem value="10000-15000">🏢 $10,000 - $15,000</SelectItem>
                        <SelectItem value="15000+">🚀 $15,000+</SelectItem>
                        <SelectItem value="partner">🤝 Interesado en Partnership</SelectItem>
                        <SelectItem value="consult">🎯 Necesito consultoría</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-3">
                    <Label htmlFor="timeline" className="text-slate-700 font-medium">Timeline del Proyecto</Label>
                    <Select value={formData.timeline} onValueChange={(value) => handleSelectChange('timeline', value)}>
                      <SelectTrigger className="h-12 border-slate-200 bg-white/70 backdrop-blur-sm focus:border-primary/50 focus:ring-primary/20">
                        <SelectValue placeholder="¿Cuándo necesitas el proyecto?" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-sm border-slate-200">
                        <SelectItem value="urgent">⚡ Lo antes posible (1-2 semanas)</SelectItem>
                        <SelectItem value="month">📅 En el próximo mes</SelectItem>
                        <SelectItem value="quarter">🗓️ En los próximos 3 meses</SelectItem>
                        <SelectItem value="flexible">🔄 Timeline flexible</SelectItem>
                        <SelectItem value="planning">📋 Solo estoy planificando</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="subject" className="text-slate-700 font-medium">Asunto *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      placeholder="Resumen del proyecto"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="h-12 border-slate-200 bg-white/70 backdrop-blur-sm focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Descripción del proyecto */}
              <div className="bg-gradient-to-r from-green-50/30 to-emerald-50/30 p-6 rounded-xl border border-slate-200/50">
                <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  Descripción del Proyecto
                </h3>

                <div className="space-y-3">
                  <Label htmlFor="message" className="text-slate-700 font-medium">Cuéntanos sobre tu proyecto *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Describe tu proyecto en detalle: objetivos, funcionalidades requeridas, usuarios objetivo, integraciones necesarias, etc."
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    required
                    className="resize-none border-slate-200 bg-white/70 backdrop-blur-sm focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                  />
                  <p className="text-sm text-slate-500 italic">
                    💡 Tip: Mientras más detalles nos proporciones, más precisa será nuestra propuesta
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Enviando mensaje...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-5 w-5 mr-3" />
                      Enviar y Continuar por WhatsApp
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Información de contacto - Ocupa 1 columna */}
      <div className="space-y-8">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 via-blue-50/50 to-indigo-50/30 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mx-auto mb-3">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl text-slate-800">Información de Contacto</CardTitle>
            <CardDescription className="text-slate-600">
              También puedes contactarnos directamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4 p-4 bg-white/60 rounded-xl border border-slate-200/50 hover:bg-white/80 transition-all duration-200">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/10 to-primary/10 rounded-xl flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Email</p>
                <p className="text-sm text-slate-600">softwarepar.lat@gmail.com</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-white/60 rounded-xl border border-slate-200/50 hover:bg-white/80 transition-all duration-200">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl flex items-center justify-center">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">WhatsApp</p>
                <p className="text-sm text-slate-600">+595 985 990 046</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-white/60 rounded-xl border border-slate-200/50 hover:bg-white/80 transition-all duration-200">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl flex items-center justify-center">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Ubicación</p>
                <p className="text-sm text-slate-600">Itapúa, Carlos Antonio López</p>
                <p className="text-sm text-slate-600">Paraguay</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-white/60 rounded-xl border border-slate-200/50 hover:bg-white/80 transition-all duration-200">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Horario de Atención</p>
                <p className="text-sm text-slate-600">Lun - Vie: 9:00 - 18:00</p>
                <p className="text-sm text-slate-600">Respuesta en 24hrs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-teal-50/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl mx-auto mb-4">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-slate-800 mb-3">⚡ Respuesta Rápida</div>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Nos comprometemos a responderte en menos de 24 horas con una propuesta inicial.
              </p>
              <div className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-xl p-4 border border-green-200/50">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-700 text-left">
                    <strong>Garantizado:</strong> Propuesta personalizada, presupuesto detallado y timeline específico.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-50/50 via-amber-50/30 to-orange-50/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl mx-auto mb-4">
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="text-xl font-bold text-slate-800 mb-3">🏆 Calidad Garantizada</div>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>6 meses de garantía</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Soporte técnico incluido</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Actualizaciones de seguridad</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}