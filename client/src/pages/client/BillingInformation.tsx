
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { Building2, Save, FileText, AlertCircle, CheckCircle } from "lucide-react";

interface ClientBillingInfo {
  id?: number;
  legalName: string;
  documentType: string;
  documentNumber: string;
  address?: string;
  city?: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

export default function BillingInformation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: billingInfo, isLoading } = useQuery({
    queryKey: ["/api/client/billing-info"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/client/billing-info");
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No tiene datos de facturación aún
        }
        throw new Error('Error al cargar datos de facturación');
      }
      return await response.json();
    },
  });

  const updateBillingInfoMutation = useMutation({
    mutationFn: async (data: ClientBillingInfo) => {
      const method = billingInfo ? "PUT" : "POST";
      const url = billingInfo 
        ? `/api/client/billing-info/${billingInfo.id}` 
        : "/api/client/billing-info";
      
      const response = await apiRequest(method, url, data);
      if (!response.ok) throw new Error('Error al guardar datos de facturación');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/billing-info"] });
      toast({
        title: "✅ Datos guardados",
        description: "Tus datos de facturación han sido actualizados correctamente",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error al guardar",
        description: error.message || "No se pudieron guardar los datos",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const data: ClientBillingInfo = {
      legalName: formData.get('legalName') as string,
      documentType: formData.get('documentType') as string,
      documentNumber: formData.get('documentNumber') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      country: formData.get('country') as string,
      phone: formData.get('phone') as string,
      isDefault: true,
    };

    updateBillingInfoMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Datos de Facturación">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Datos de Facturación">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Datos de Facturación</h1>
            <p className="text-muted-foreground">
              Configura tus datos personales para la emisión de facturas según normativas SET Paraguay
            </p>
          </motion.div>
        </div>

        {/* Alert Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Información importante:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Estos datos aparecerán en todas las facturas que recibas</li>
                    <li>• Son requeridos según normativas SET Paraguay</li>
                    <li>• Asegúrate de que todos los datos sean correctos</li>
                    <li>• Podrás modificarlos cuando necesites</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Billing Information Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Información de Facturación
                </span>
                {billingInfo && !isEditing ? (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Editar
                  </Button>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {billingInfo && !isEditing ? (
                // Display Mode
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Nombre Completo</Label>
                      <p className="font-medium">{billingInfo.legalName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Documento</Label>
                      <p className="font-medium">{billingInfo.documentType}: {billingInfo.documentNumber}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Ciudad</Label>
                      <p className="font-medium">{billingInfo.city || 'No especificado'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">País</Label>
                      <p className="font-medium">{billingInfo.country}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Teléfono</Label>
                      <p className="font-medium">{billingInfo.phone || 'No especificado'}</p>
                    </div>
                  </div>
                  
                  {billingInfo.address && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Dirección</Label>
                      <p className="font-medium">{billingInfo.address}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">Datos de facturación configurados correctamente</span>
                  </div>
                </div>
              ) : (
                // Edit/Create Mode
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="legalName">Nombre Completo *</Label>
                      <Input
                        id="legalName"
                        name="legalName"
                        defaultValue={billingInfo?.legalName || ''}
                        placeholder="Tu nombre completo como aparece en CI/RUC"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="documentType">Tipo de Documento *</Label>
                      <Select name="documentType" defaultValue={billingInfo?.documentType || 'CI'}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tipo de documento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CI">Cédula de Identidad (CI)</SelectItem>
                          <SelectItem value="RUC">RUC</SelectItem>
                          <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                          <SelectItem value="Extranjero">Documento Extranjero</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="documentNumber">Número de Documento *</Label>
                      <Input
                        id="documentNumber"
                        name="documentNumber"
                        defaultValue={billingInfo?.documentNumber || ''}
                        placeholder="Número sin puntos ni guiones"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        name="phone"
                        defaultValue={billingInfo?.phone || ''}
                        placeholder="+595 XXX XXX XXX"
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">Ciudad</Label>
                      <Input
                        id="city"
                        name="city"
                        defaultValue={billingInfo?.city || ''}
                        placeholder="Tu ciudad"
                      />
                    </div>

                    <div>
                      <Label htmlFor="country">País</Label>
                      <Select name="country" defaultValue={billingInfo?.country || 'Paraguay'}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona país" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Paraguay">Paraguay</SelectItem>
                          <SelectItem value="Argentina">Argentina</SelectItem>
                          <SelectItem value="Brasil">Brasil</SelectItem>
                          <SelectItem value="Uruguay">Uruguay</SelectItem>
                          <SelectItem value="Chile">Chile</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Dirección Completa</Label>
                    <Textarea
                      id="address"
                      name="address"
                      defaultValue={billingInfo?.address || ''}
                      placeholder="Dirección completa, barrio, referencias"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    {billingInfo && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditing(false)}
                      >
                        Cancelar
                      </Button>
                    )}
                    <Button 
                      type="submit" 
                      disabled={updateBillingInfoMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {updateBillingInfoMutation.isPending ? "Guardando..." : "Guardar Datos"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
