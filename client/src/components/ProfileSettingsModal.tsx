
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { User, Settings } from "lucide-react";
import type { User as UserType } from "@shared/schema";

interface ProfileSettingsModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Lista de países con códigos telefónicos
const countries = [
  { code: "+595", name: "Paraguay", flag: "🇵🇾" },
  { code: "+54", name: "Argentina", flag: "🇦🇷" },
  { code: "+55", name: "Brasil", flag: "🇧🇷" },
  { code: "+56", name: "Chile", flag: "🇨🇱" },
  { code: "+57", name: "Colombia", flag: "🇨🇴" },
  { code: "+51", name: "Perú", flag: "🇵🇪" },
  { code: "+598", name: "Uruguay", flag: "🇺🇾" },
  { code: "+58", name: "Venezuela", flag: "🇻🇪" },
  { code: "+591", name: "Bolivia", flag: "🇧🇴" },
  { code: "+593", name: "Ecuador", flag: "🇪🇨" },
  { code: "+1", name: "Estados Unidos", flag: "🇺🇸" },
  { code: "+52", name: "México", flag: "🇲🇽" },
  { code: "+34", name: "España", flag: "🇪🇸" },
];

export default function ProfileSettingsModal({ 
  trigger, 
  open, 
  onOpenChange 
}: ProfileSettingsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Extraer código de país del número existente
  const getCountryCodeFromNumber = (number: string) => {
    if (!number) return "+595"; // Paraguay por defecto
    const country = countries.find(c => number.startsWith(c.code));
    return country ? country.code : "+595";
  };

  // Extraer número sin código de país
  const getNumberWithoutCountryCode = (number: string) => {
    if (!number) return "";
    const countryCode = getCountryCodeFromNumber(number);
    return number.replace(countryCode, "");
  };

  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    countryCode: getCountryCodeFromNumber(user?.whatsappNumber || ""),
    phoneNumber: getNumberWithoutCountryCode(user?.whatsappNumber || ""),
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserType>) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}`, updates);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al actualizar perfil");
      }
      return await response.json();
    },
    onSuccess: (updatedUser) => {
      // Actualizar los datos del usuario en el cache
      queryClient.setQueryData(["/api/auth/me"], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      toast({
        title: "Perfil actualizado",
        description: "Tu información personal ha sido actualizada exitosamente.",
      });
      
      // Cerrar modal
      if (onOpenChange) {
        onOpenChange(false);
      } else {
        setIsOpen(false);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar",
        description: error.message || "No se pudo actualizar tu perfil",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.fullName.trim()) {
      toast({
        title: "Campo requerido",
        description: "El nombre completo es obligatorio",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Campo requerido", 
        description: "El email es obligatorio",
        variant: "destructive",
      });
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Email inválido",
        description: "Por favor ingresa un email válido",
        variant: "destructive",
      });
      return;
    }

    // Validar WhatsApp si se proporciona
    if (formData.phoneNumber && !/^\d{8,15}$/.test(formData.phoneNumber)) {
      toast({
        title: "Número de WhatsApp inválido",
        description: "El número debe contener solo dígitos (8-15 caracteres)",
        variant: "destructive",
      });
      return;
    }

    // Preparar datos para enviar
    const whatsappNumber = formData.phoneNumber ? 
      `${formData.countryCode}${formData.phoneNumber}` : null;

    const updates: Partial<UserType> = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      whatsappNumber,
    };

    updateProfileMutation.mutate(updates);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setIsOpen(open);
    }
    
    // Resetear formulario cuando se cierra
    if (!open && user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        countryCode: getCountryCodeFromNumber(user.whatsappNumber || ""),
        phoneNumber: getNumberWithoutCountryCode(user.whatsappNumber || ""),
      });
    }
  };

  if (!user) return null;

  const isControlled = typeof open !== "undefined";

  return (
    <Dialog 
      open={isControlled ? open : isOpen} 
      onOpenChange={handleOpenChange}
    >
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Configuración de Perfil
          </DialogTitle>
          <DialogDescription>
            Actualiza tu información personal. Los cambios se guardarán inmediatamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre Completo *</Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              placeholder="Tu nombre completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>WhatsApp (opcional)</Label>
            <div className="flex gap-2">
              <Select
                value={formData.countryCode}
                onValueChange={(value) => handleInputChange("countryCode", value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="País" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <div className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        <span>{country.code}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => {
                  // Solo permitir números
                  const value = e.target.value.replace(/\D/g, '');
                  handleInputChange("phoneNumber", value);
                }}
                placeholder="981234567"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Selecciona tu país y el código se agregará automáticamente
            </p>
            {formData.phoneNumber && (
              <p className="text-xs text-green-600">
                Número completo: {formData.countryCode}{formData.phoneNumber}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={updateProfileMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
