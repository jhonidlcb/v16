import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  ExternalLink,
  Calendar,
  AlertCircle,
  Wallet,
  Play,
  Settings
} from "lucide-react";

// Interface para las props del modal
interface PaymentOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  stageName: string;
  stageId: number;
  projectName: string;
}

// Modal de opciones de pago mejorado
const PaymentOptionsModal = ({ isOpen, onClose, amount, stageName, stageId, projectName }: PaymentOptionsModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [showPaymentDetails, setShowPaymentDetails] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  if (!isOpen) return null;

  const paymentMethods = [
    {
      id: 'mango',
      name: 'Mango (TU FINANCIERA)',
      alias: '@gkrock',
      type: 'Arroba Mango',
      phone: '+595985990046',
      sipapAlias: '4220058',
      sipapDetails: {
        entidad: 'TU FINANCIERA',
        cuenta: '75314356',
        titular: 'Jhoni Fabian Benitez De La Cruz',
        cedula: '4220058'
      }
    },
    {
      id: 'ueno',
      name: 'Ueno Bank',
      alias: '+595985990046',
      type: 'Alias - Celular',
      accountNumber: '6192430854',
      titular: 'Jhoni Fabian Benitez De La Cruz',
      cedula: '4220058',
      moneda: 'GS'
    }
  ];

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    setShowPaymentDetails(true);
  };

  const handleSendProof = async () => {
    const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);

    if (isUploading || !selectedMethodData) return;

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('paymentMethod', selectedMethodData.name);

      if (selectedFile) {
        formData.append('proofFile', selectedFile);
        formData.append('proofFileInfo', JSON.stringify({
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type
        }));
      }

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/payment-stages/${stageId}/confirm-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();

        // Crear modal de confirmación mejorado
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
          <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center shadow-2xl">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-green-800 mb-3">¡Comprobante Enviado!</h3>
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
              <h4 class="font-semibold text-green-800 mb-2">📋 Resumen del Envío:</h4>
              <div class="space-y-2 text-sm text-green-700">
                <p><strong>Etapa:</strong> ${stageName}</p>
                <p><strong>Monto:</strong> $${amount.toFixed(2)}</p>
                <p><strong>Método:</strong> ${selectedMethodData.name}</p>
                <p><strong>Estado:</strong> Pendiente de verificación</p>
                ${selectedFile ? `<p><strong>Archivo:</strong> ${selectedFile.name}</p>` : ''}
              </div>
            </div>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 class="font-semibold text-blue-800 mb-2">✅ ¿Qué sucede ahora?</h4>
              <div class="text-sm text-blue-700 text-left space-y-1">
                <p>• Tu comprobante fue enviado automáticamente por email</p>
                <p>• Nuestro equipo lo verificará en las próximas horas</p>
                <p>• Te notificaremos cuando sea aprobado</p>
                <p>• Puedes contactarnos por WhatsApp si tienes dudas</p>
              </div>
            </div>
            <div class="flex gap-3">
              <button class="close-modal flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Cerrar
              </button>
              <button class="whatsapp-btn flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                📱 WhatsApp
              </button>
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        const closeModal = () => {
          document.body.removeChild(modal);
          onClose();
          setTimeout(() => {
            window.location.reload();
          }, 500);
        };
        
        modal.querySelector('.close-modal')?.addEventListener('click', closeModal);
        
        modal.querySelector('.whatsapp-btn')?.addEventListener('click', () => {
          const whatsappMessage = encodeURIComponent(
            `🎉 ¡Hola! He enviado el comprobante de pago para el proyecto "${projectName}".\n\n` +
            `📋 Detalles del pago:\n` +
            `• Etapa: ${stageName}\n` +
            `• Monto: $${amount.toFixed(2)}\n` +
            `• Método: ${selectedMethodData.name}\n` +
            `• Alias: ${selectedMethodData.alias}\n\n` +
            `${selectedFile ? '📎 Comprobante adjuntado: ' + selectedFile.name + '\n\n' : 'ℹ️ Sin archivo adjunto\n\n'}` +
            `✅ Notificación enviada automáticamente por email.\n\n` +
            `Por favor, confirmen cuando lo revisen. ¡Gracias!`
          );

          const whatsappNumber = '595985990046';
          const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
          window.open(whatsappUrl, '_blank');
          closeModal();
        });
        
        modal.addEventListener('click', (e) => {
          if (e.target === modal) closeModal();
        });

      } else {
        let errorMessage = 'Error desconocido';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `Error ${response.status}`;
        } catch (e) {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }

        if (response.status === 401) {
          errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }

        // Modal de error mejorado
        const errorModal = document.createElement('div');
        errorModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        errorModal.innerHTML = `
          <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center shadow-2xl">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-red-800 mb-3">Error al Enviar</h3>
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p class="text-red-700">${errorMessage}</p>
            </div>
            <button class="close-error bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Entendido
            </button>
          </div>
        `;
        
        document.body.appendChild(errorModal);
        
        errorModal.querySelector('.close-error')?.addEventListener('click', () => {
          document.body.removeChild(errorModal);
        });
      }
    } catch (error) {
      console.error('❌ Error enviando comprobante:', error);
      
      // Modal de error de conexión
      const errorModal = document.createElement('div');
      errorModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      errorModal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center shadow-2xl">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-red-800 mb-3">Error de Conexión</h3>
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p class="text-red-700">No se pudo conectar con el servidor. Verifica tu conexión a internet e inténtalo de nuevo.</p>
          </div>
          <button class="close-error bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Reintentar
          </button>
        </div>
      `;
      
      document.body.appendChild(errorModal);
      
      errorModal.querySelector('.close-error')?.addEventListener('click', () => {
        document.body.removeChild(errorModal);
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-3 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-blue-50 to-green-50 flex-shrink-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate pr-2">
            {!showPaymentDetails ? 'Método de pago' : 'Datos de transferencia'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl leading-none flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-white/50 rounded transition-colors"
          >
            ×
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto flex-1 px-3 py-3 sm:px-4 sm:py-4">
          {!showPaymentDetails ? (
            <>
              <div className="mb-3 bg-gradient-to-r from-blue-50 to-blue-100 p-2.5 sm:p-3 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-700 break-words">
                  <span className="font-semibold">Etapa:</span> <span className="font-bold text-blue-800">{stageName}</span>
                </p>
                <p className="text-base sm:text-lg font-bold text-green-600 mt-0.5">Monto: ${amount.toFixed(2)}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Selecciona el método:</h3>
                {paymentMethods.map((method) => (
                  <div 
                    key={method.id}
                    className="border-2 border-gray-200 p-2.5 sm:p-3 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all active:scale-[0.98]"
                    onClick={() => handleMethodSelect(method.id)}
                  >
                    <p className="font-semibold text-blue-700 text-sm sm:text-base break-words">{method.name}</p>
                    <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 break-all">{method.type}: {method.alias}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <button 
                onClick={() => setShowPaymentDetails(false)}
                className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm mb-2.5 sm:mb-3 flex items-center gap-1 font-medium"
              >
                ← Volver
              </button>

              <div className="bg-green-50 p-2 sm:p-2.5 rounded-lg border border-green-200 mb-2.5 sm:mb-3">
                <h3 className="font-bold text-green-800 text-sm sm:text-base mb-1.5 sm:mb-2 break-words">
                  {paymentMethods.find(m => m.id === selectedMethod)?.name}
                </h3>
                <div className="space-y-1.5 sm:space-y-2">
                  {selectedMethod === 'mango' && (
                    <>
                      <div className="bg-white p-1.5 sm:p-2 rounded border border-green-300">
                        <p className="font-semibold text-green-700 mb-0.5 sm:mb-1 text-[10px] sm:text-xs">📱 Mango a Mango:</p>
                        <p className="text-[10px] sm:text-xs break-all"><strong>Arroba:</strong> <span className="text-sm sm:text-base font-mono">{paymentMethods.find(m => m.id === selectedMethod)?.alias}</span></p>
                        <p className="text-[10px] sm:text-xs break-all"><strong>Tel:</strong> {paymentMethods.find(m => m.id === selectedMethod)?.phone}</p>
                      </div>
                      <div className="bg-white p-1.5 sm:p-2 rounded border border-green-300">
                        <p className="font-semibold text-green-700 mb-0.5 sm:mb-1 text-[10px] sm:text-xs">🏦 SIPAP:</p>
                        <p className="text-[10px] sm:text-xs break-all"><strong>Alias CI:</strong> {paymentMethods.find(m => m.id === selectedMethod)?.sipapAlias}</p>
                        <p className="text-[10px] sm:text-xs break-all"><strong>Entidad:</strong> {paymentMethods.find(m => m.id === selectedMethod)?.sipapDetails?.entidad}</p>
                        <p className="text-[10px] sm:text-xs break-all"><strong>Cuenta:</strong> {paymentMethods.find(m => m.id === selectedMethod)?.sipapDetails?.cuenta}</p>
                        <p className="text-[10px] sm:text-xs break-words"><strong>Titular:</strong> {paymentMethods.find(m => m.id === selectedMethod)?.sipapDetails?.titular}</p>
                        <p className="text-[10px] sm:text-xs break-all"><strong>CI:</strong> {paymentMethods.find(m => m.id === selectedMethod)?.sipapDetails?.cedula}</p>
                      </div>
                    </>
                  )}
                  {selectedMethod === 'ueno' && (
                    <div className="bg-white p-1.5 sm:p-2 rounded border border-green-300">
                      <p className="font-semibold text-green-700 mb-0.5 sm:mb-1 text-[10px] sm:text-xs">🏦 Ueno Bank:</p>
                      <p className="text-[10px] sm:text-xs break-words"><strong>Titular:</strong> {paymentMethods.find(m => m.id === selectedMethod)?.titular}</p>
                      <p className="text-[10px] sm:text-xs break-all"><strong>CI:</strong> {paymentMethods.find(m => m.id === selectedMethod)?.cedula}</p>
                      <p className="text-[10px] sm:text-xs break-all"><strong>Cuenta:</strong> {paymentMethods.find(m => m.id === selectedMethod)?.accountNumber}</p>
                      <p className="text-[10px] sm:text-xs break-all"><strong>Moneda:</strong> {paymentMethods.find(m => m.id === selectedMethod)?.moneda}</p>
                      <p className="text-[10px] sm:text-xs break-all"><strong>Alias:</strong> <span className="text-sm sm:text-base font-mono">{paymentMethods.find(m => m.id === selectedMethod)?.alias}</span></p>
                    </div>
                  )}
                  <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-green-300">
                    <p className="text-xs sm:text-sm"><strong>Monto:</strong> <span className="text-base sm:text-lg font-bold text-green-700">${amount.toFixed(2)}</span></p>
                    <p className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 break-words"><strong>Concepto:</strong> {stageName} - {projectName}</p>
                  </div>
                </div>
              </div>

              <div className="mb-2.5 sm:mb-3">
                <h4 className="font-medium text-gray-700 mb-1.5 sm:mb-2 text-xs sm:text-sm">Comprobante (opcional):</h4>
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                  className="w-full p-1.5 sm:p-2 border border-gray-300 rounded-md text-[10px] sm:text-xs"
                />
                <p className="text-[9px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                  JPG, PNG, PDF
                </p>
              </div>

              <div className="bg-blue-50 p-1.5 sm:p-2 rounded-lg mb-2.5 sm:mb-3">
                <p className="text-[10px] sm:text-xs text-blue-800">
                  💡 Realiza la transferencia y haz clic en "Enviar" para notificarnos.
                </p>
              </div>

              <button 
                onClick={handleSendProof}
                disabled={isUploading}
                className={`w-full py-2 sm:py-2.5 px-3 sm:px-4 rounded-md font-medium text-xs sm:text-sm transition-all ${
                  isUploading 
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                    : 'bg-green-500 text-white hover:bg-green-600 active:scale-[0.98]'
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                    <span className="text-[10px] sm:text-xs">{selectedFile ? 'Subiendo...' : 'Enviando...'}</span>
                  </div>
                ) : (
                  '📧 Enviar Comprobante'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface PaymentStage {
  id: number;
  projectId: number;
  stageName: string;
  stagePercentage: number;
  amount: string;
  requiredProgress: number;
  status: string;
  paymentLink?: string;
  mercadoPagoId?: string;
  dueDate?: string;
  paidDate?: string;
  createdAt: string;
}

interface ClientPaymentStagesProps {
  projectId: number;
  projectProgress: number;
  projectPrice: number;
}

export default function ClientPaymentStages({ 
  projectId, 
  projectProgress = 0,
  projectPrice = 0 
}: ClientPaymentStagesProps) {
  const { toast } = useToast();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState<PaymentStage | null>(null);

  const { data: stages, isLoading, error } = useQuery({
    queryKey: ["payment-stages", projectId],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/projects/${projectId}/payment-stages`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Asegurar orden correcto por progreso requerido
        return data.sort((a: any, b: any) => a.requiredProgress - b.requiredProgress);
      } catch (error) {
        console.error("Error fetching payment stages:", error);
        throw error;
      }
    },
    enabled: !!projectId,
    retry: 2,
    staleTime: 30000,
  });

  const { data: projectInfo } = useQuery({
    queryKey: ["project-info", projectId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/projects/${projectId}`);
      return await response.json();
    },
    enabled: !!projectId,
  });

  const getStatusInfo = (status: string, stage: PaymentStage) => {
    const configs = {
      pending: { 
        label: "Pendiente", 
        variant: "secondary" as const, 
        icon: Clock,
        color: "text-gray-500",
        bgColor: "bg-gray-50 border-gray-200",
        description: `Se activará cuando el proyecto tenga ${stage.requiredProgress}% de progreso`
      },
      available: { 
        label: "¡Disponible para Pagar!", 
        variant: "default" as const, 
        icon: Wallet,
        color: "text-blue-600",
        bgColor: "bg-blue-50 border-blue-300",
        description: "Esta etapa está lista para ser pagada"
      },
      paid: { 
        label: "✅ Pagado", 
        variant: "default" as const, 
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50 border-green-200",
        description: stage.paidDate ? `Pagado el ${new Date(stage.paidDate).toLocaleDateString()}` : "Completado"
      },
      overdue: { 
        label: "Vencido", 
        variant: "destructive" as const, 
        icon: AlertCircle,
        color: "text-red-600",
        bgColor: "bg-red-50 border-red-200",
        description: "Esta etapa necesita ser pagada"
      },
      pending_verification: { // Nuevo estado para pendiente de verificación
        label: "Verificando Pago",
        variant: "default" as const,
        icon: Clock,
        color: "text-yellow-700",
        bgColor: "bg-yellow-50 border-yellow-200",
        description: "El comprobante de pago está siendo revisado por el administrador."
      }
    };

    return configs[status as keyof typeof configs] || configs.pending;
  };

  const getTotalPaid = () => {
    if (!stages) return 0;
    return stages
      .filter((stage: PaymentStage) => stage.status === 'paid')
      .reduce((total: number, stage: PaymentStage) => total + parseFloat(stage.amount), 0);
  };

  const getNextPaymentStage = () => {
    // Prioritize 'available' status, but also consider 'pending_verification' if no 'available' stage exists
    const availableStage = stages?.find((stage: PaymentStage) => stage.status === 'available');
    if (availableStage) {
      return availableStage;
    }
    // If no 'available' stage, check for 'pending_verification' stage
    const pendingVerificationStage = stages?.find((stage: PaymentStage) => stage.status === 'pending_verification');
    if (pendingVerificationStage) {
      return pendingVerificationStage;
    }
    // Fallback to any other stage if necessary, though not ideal for direct payment action
    return stages?.find((stage: PaymentStage) => stage.status === 'pending');
  };

  const handlePaymentClick = (stage: PaymentStage) => {
    setSelectedStage(stage);
    setShowPaymentModal(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-32 bg-muted rounded-lg"></div>
        <div className="animate-pulse h-96 bg-muted rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    console.error("Payment stages error details:", error);
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Error al cargar las etapas de pago
          </h3>
          <p className="text-red-700 mb-4">
            No se pudieron cargar las etapas de pago. Por favor, intenta recargar.
          </p>
          <div className="text-xs text-red-600 mb-4 bg-white p-2 rounded border">
            Error: {error instanceof Error ? error.message : 'Error desconocido'}
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            Recargar Página
          </Button>
        </CardContent>
      </Card>
    );
  }

  console.log("ClientPaymentStages - Project ID:", projectId);
  console.log("ClientPaymentStages - Stages data:", stages);
  console.log("ClientPaymentStages - Is loading:", isLoading);
  console.log("ClientPaymentStages - Error:", error);

  if (!stages || stages.length === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6 text-center">
          <CreditCard className="h-12 w-12 mx-auto mb-4 text-amber-600" />
          <h3 className="text-lg font-semibold text-amber-800 mb-2">
            Etapas de Pago Pendientes
          </h3>
          <p className="text-amber-700 mb-4">
            Las etapas de pago serán configuradas una vez que el proyecto sea aprobado por nuestro equipo.
          </p>
          <div className="bg-white p-4 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-600">
              💡 Una vez configuradas, podrás pagar en 4 etapas del 25% cada una
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const nextPayment = getNextPaymentStage();

  return (
    <div className="space-y-6" data-payment-stages>
      {/* Header with Summary */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <DollarSign className="h-6 w-6" />
            Sistema de Pagos por Etapas - SoftwarePar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-4 rounded-lg border border-blue-200 mb-6">
            <h4 className="font-semibold text-blue-800 mb-3 text-lg">🚀 ¿Cómo funciona nuestro sistema?</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-blue-700 mb-2">📋 Proceso de Pago:</h5>
                <ul className="space-y-1 text-blue-600">
                  <li>• <strong>4 etapas del 25% cada una</strong></li>
                  <li>• Solo pagas cuando hay progreso real</li>
                  <li>• Te avisamos cuando puedes pagar</li>
                  <li>• Cada pago desbloquea la siguiente fase</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-blue-700 mb-2">💡 Ventajas para ti:</h5>
                <ul className="space-y-1 text-blue-600">
                  <li>• <strong>Pago seguro y gradual</strong></li>
                  <li>• Control total del progreso</li>
                  <li>• Sin sorpresas ni pagos adelantados</li>
                  <li>• Garantía de avance constante</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">${projectPrice.toFixed(2)}</div>
              <div className="text-sm text-blue-600">Total del Proyecto</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${getTotalPaid().toFixed(2)}</div>
              <div className="text-sm text-green-600">Ya Pagado</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{projectProgress}%</div>
              <div className="text-sm text-purple-600">Progreso Actual</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Progreso del Proyecto:</span>
              <span className="font-medium">{projectProgress}%</span>
            </div>
            <Progress value={projectProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Next Payment Alert */}
      {nextPayment && (
        <Card className={`border-l-4 ${
            nextPayment.status === 'available' ? 'border-green-400 bg-green-50' :
            nextPayment.status === 'pending_verification' ? 'border-yellow-400 bg-yellow-50' :
            'border-gray-400 bg-gray-50'
          } shadow-lg`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    nextPayment.status === 'available' ? 'bg-green-500' :
                    nextPayment.status === 'pending_verification' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`}>
                  {nextPayment.status === 'available' && <Wallet className="h-6 w-6 text-white" />}
                  {nextPayment.status === 'pending_verification' && <Clock className="h-6 w-6 text-white" />}
                  {nextPayment.status === 'pending' && <Clock className="h-6 w-6 text-white" />}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className={`font-bold text-xl ${
                      nextPayment.status === 'available' ? 'text-green-800' :
                      nextPayment.status === 'pending_verification' ? 'text-yellow-800' :
                      'text-gray-800'
                    }`}>
                    {nextPayment.status === 'available' && '🎉 ¡Tu Pago Está Listo!'}
                    {nextPayment.status === 'pending_verification' && '⏳ ¡Pago Pendiente de Verificación!'}
                    {nextPayment.status === 'pending' && 'ℹ️ Etapa Pendiente'}
                  </h3>
                  {nextPayment.status === 'available' && <Badge className="bg-green-500 text-white">DISPONIBLE</Badge>}
                  {nextPayment.status === 'pending_verification' && <Badge className="bg-yellow-500 text-white">EN VERIFICACIÓN</Badge>}
                </div>

                <div className="bg-white p-3 sm:p-4 rounded-lg border mb-3 sm:mb-4">
                  <h4 className={`font-semibold mb-2 text-sm sm:text-base ${
                      nextPayment.status === 'available' ? 'text-green-800' :
                      nextPayment.status === 'pending_verification' ? 'text-yellow-800' :
                      'text-gray-800'
                    }`}>
                    📋 Detalles del Pago:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div>
                      <span className="text-muted-foreground">Etapa:</span>
                      <div className="font-medium">{nextPayment.stageName}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Monto:</span>
                      <div className={`font-bold text-lg ${
                          nextPayment.status === 'available' ? 'text-green-800' :
                          nextPayment.status === 'pending_verification' ? 'text-yellow-800' :
                          'text-gray-800'
                        }`}>
                        ${parseFloat(nextPayment.amount).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {(nextPayment.status === 'available' || nextPayment.status === 'pending_verification') && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>
                        {nextPayment.status === 'available' ? '🔄 ¿Qué pasa después del pago?' : '⏳ ¿Qué pasa ahora?'}
                      </strong><br />
                      {nextPayment.status === 'available' && 
                        'Una vez confirmado tu pago, nuestro equipo comenzará inmediatamente a trabajar en esta etapa. Recibirás actualizaciones regulares del progreso.'
                      }
                      {nextPayment.status === 'pending_verification' && 
                        'Hemos recibido tu comprobante y lo estamos revisando. Te notificaremos tan pronto como el pago sea verificado y aprobado.'
                      }
                    </p>
                  </div>
                )}

                {nextPayment.status === 'available' && (
                  <Button 
                    onClick={() => handlePaymentClick(nextPayment)}
                    className="bg-green-600 hover:bg-green-700 text-white text-lg py-3 px-6 shadow-lg"
                    size="lg"
                  >
                    <Wallet className="h-5 w-5 mr-2" />
                    Pagar ${parseFloat(nextPayment.amount).toFixed(2)} - Iniciar Trabajo
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Stages List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Etapas de Pago ({stages.length}/4)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stages.map((stage: PaymentStage, index: number) => {
              const statusInfo = getStatusInfo(stage.status, stage);
              const Icon = statusInfo.icon;

              return (
                <div
                  key={stage.id}
                  className={`p-3 sm:p-4 rounded-lg border transition-all ${statusInfo.bgColor}`}
                >
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                          stage.status === 'paid' ? 'bg-green-500 text-white' :
                          stage.status === 'available' ? 'bg-blue-500 text-white' :
                          stage.status === 'pending_verification' ? 'bg-yellow-500 text-white' :
                          'bg-gray-300 text-gray-600'
                        }`}>
                          {stage.status === 'paid' ? '✓' : stage.status === 'pending_verification' ? <Clock size={12} /> : index + 1}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                          <h4 className="font-semibold text-base sm:text-lg break-words">{stage.stageName}</h4>
                          <Badge variant={statusInfo.variant} className="flex items-center gap-1 w-fit text-xs">
                            <Icon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm mb-2">
                          <div>
                            <span className="text-muted-foreground text-[10px] sm:text-xs">Porcentaje:</span>
                            <div className="font-medium text-xs sm:text-sm">{stage.stagePercentage}%</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] sm:text-xs">Monto:</span>
                            <div className="font-bold text-sm sm:text-base">${parseFloat(stage.amount).toFixed(2)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] sm:text-xs">Progreso:</span>
                            <div className="font-medium text-xs sm:text-sm">{stage.requiredProgress}%</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] sm:text-xs">Estado:</span>
                            <div className={`font-medium text-xs sm:text-sm ${statusInfo.color}`}>
                              {statusInfo.label}
                            </div>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                          {statusInfo.description}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                      {stage.status === 'available' && (
                        <Button 
                          onClick={() => {
                            setSelectedStage(stage);
                            setShowPaymentModal(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-initial"
                          size="sm"
                        >
                          <Wallet className="h-4 w-4 mr-1" />
                          Pagar
                        </Button>
                      )}

                      {stage.status === 'pending_verification' && (
                        <div className="text-[10px] sm:text-xs text-center text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200 flex-1 sm:flex-initial">
                          <Clock className="h-3 w-3 mx-auto mb-1" />
                          Verificando comprobante
                        </div>
                      )}

                      {stage.status === 'pending' && (
                        <div className="text-[10px] sm:text-xs text-center text-gray-500 bg-gray-50 p-2 rounded border flex-1 sm:flex-initial">
                          Al {stage.requiredProgress}% progreso
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-purple-800 text-xl">🎯 Metodología SoftwarePar - Desarrollo por Etapas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-3">🏗️ Nuestra Metodología de Trabajo:</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-purple-600 font-bold">1</span>
                  </div>
                  <h5 className="font-medium text-purple-700">Anticipo (25%)</h5>
                  <p className="text-purple-600">Iniciamos desarrollo inmediatamente</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-purple-600 font-bold">2</span>
                  </div>
                  <h5 className="font-medium text-purple-700">50% Progreso (25%)</h5>
                  <p className="text-purple-600">Funcionalidades core desarrolladas</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <h5 className="font-medium text-purple-700">Pre-entrega (25%)</h5>
                  <p className="text-purple-600">90% completo, revisiones finales</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-purple-600 font-bold">4</span>
                  </div>
                  <h5 className="font-medium text-purple-700">Entrega (25%)</h5>
                  <p className="text-purple-600">Proyecto 100% terminado</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Beneficios para Ti:
                </h4>
                <ul className="space-y-1 text-green-700">
                  <li>• <strong>Pago gradual:</strong> Solo pagas por progreso real</li>
                  <li>• <strong>Control total:</strong> Ves el avance antes de cada pago</li>
                  <li>• <strong>Sin riesgo:</strong> No hay pagos adelantados grandes</li>
                  <li>• <strong>Transparencia:</strong> Comunicación constante del progreso</li>
                  <li>• <strong>Calidad:</strong> Cada etapa es revisada antes del siguiente pago</li>
                </ul>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Garantías SoftwarePar:
                </h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• <strong>Inicio inmediato:</strong> Trabajamos desde el primer pago</li>
                  <li>• <strong>Actualizaciones frecuentes:</strong> Te mantenemos informado</li>
                  <li>• <strong>Calidad garantizada:</strong> Revisiones en cada etapa</li>
                  <li>• <strong>Comunicación directa:</strong> Canal de comunicación 24/7</li>
                  <li>• <strong>Entrega puntual:</strong> Cumplimos fechas establecidas</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-1">💡 Importante:</h4>
                  <p className="text-sm text-yellow-700">
                    Este sistema nos permite mantener la mejor calidad en cada proyecto, ya que trabajamos con 
                    recursos asegurados y tu tienes control total del progreso. Es una metodología win-win 
                    que hemos perfeccionado en años de experiencia.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Options Modal */}
      {selectedStage && (
        <PaymentOptionsModal 
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedStage(null);
          }}
          amount={parseFloat(selectedStage.amount)}
          stageName={selectedStage.stageName}
          stageId={selectedStage.id}
          projectName={projectInfo?.name || "Proyecto"}
        />
      )}
    </div>
  );
}