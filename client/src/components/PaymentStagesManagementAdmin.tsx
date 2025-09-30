import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  Plus,
  AlertCircle,
  ExternalLink,
  Calendar,
  TrendingUp,
  Eye,
  X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Textarea } from "./ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface PaymentStage {
  id: number;
  projectId: number;
  stageName: string;
  stagePercentage: number;
  amount: string;
  requiredProgress: number;
  status: string;
  dueDate?: string;
  paidDate?: string;
  createdAt: string;
  paymentMethod?: string; // Añadido para mostrar el método de pago
  paymentData?: { // Añadido para almacenar datos del comprobante
    confirmedBy?: string;
    confirmedAt?: string;
    originalFileName?: string;
    fileInfo?: {
      fileSize: number;
      fileType: string;
    };
    note?: string; // Campo para notas adicionales en el comprobante
  };
}

interface PaymentStagesManagementAdminProps {
  projectId: number;
  projectProgress: number;
  projectPrice: number;
}

export default function PaymentStagesManagementAdmin({ 
  projectId, 
  projectProgress,
  projectPrice 
}: PaymentStagesManagementAdminProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [showCreateStages, setShowCreateStages] = useState(false);

  const { data: stages, isLoading, error } = useQuery({
    queryKey: ["/api/projects", projectId, "payment-stages"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/projects/${projectId}/payment-stages`);
      // Asegurar que la respuesta es JSON y manejar posibles errores
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al cargar las etapas de pago");
      }
      const data = await response.json();
      // Mapear los datos para asegurar la estructura correcta y manejar tipos
      return data.map((stage: any) => ({
        ...stage,
        amount: stage.amount ? String(stage.amount) : "0.00",
        stagePercentage: stage.stagePercentage ? Number(stage.stagePercentage) : 0,
        requiredProgress: stage.requiredProgress ? Number(stage.requiredProgress) : 0,
        paymentData: stage.paymentData ? {
          ...stage.paymentData,
          fileInfo: stage.paymentData.fileInfo ? {
            fileSize: Number(stage.paymentData.fileInfo.fileSize),
            fileType: String(stage.paymentData.fileInfo.fileType)
          } : undefined
        } : undefined
      })).sort((a: any, b: any) => a.requiredProgress - b.requiredProgress); // Asegurar orden correcto por progreso requerido
    },
    enabled: !!projectId, // Solo ejecutar la consulta si projectId está definido
  });

  const createStagesMutation = useMutation({
    mutationFn: async () => {
      console.log("🚀 Iniciando creación de etapas para proyecto:", projectId);
      const defaultStages = [
        { name: "Anticipo - Inicio del Proyecto", percentage: 25, requiredProgress: 0 },
        { name: "Avance 50% - Desarrollo", percentage: 25, requiredProgress: 50 },
        { name: "Pre-entrega - 90% Completado", percentage: 25, requiredProgress: 90 },
        { name: "Entrega Final", percentage: 25, requiredProgress: 100 }
      ];

      console.log("📋 Etapas a crear:", defaultStages);
      const response = await apiRequest("POST", `/api/projects/${projectId}/payment-stages`, {
        stages: defaultStages
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear las etapas de pago");
      }
      const result = await response.json();
      console.log("✅ Respuesta del servidor:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "payment-stages"] });
      toast({
        title: "✅ Sistema de Pagos Activado",
        description: "4 etapas creadas automáticamente + Timeline generado. La primera etapa ya está disponible para el cliente.",
      });
      setShowCreateStages(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear etapas",
        description: error.message,
        variant: "destructive",
      });
    },
  });


  const markAsPaidMutation = useMutation({
    mutationFn: async (stageId: number) => {
      const response = await apiRequest("POST", `/api/payment-stages/${stageId}/complete`);
       if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al marcar la etapa como pagada");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "payment-stages"] });
      toast({
        title: "Marcado como pagado",
        description: "La etapa ha sido marcada como pagada.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al marcar como pagado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendiente", variant: "secondary" as const, icon: Clock },
      available: { label: "Disponible", variant: "default" as const, icon: CreditCard },
      pending_verification: { label: "Verificando", variant: "secondary" as const, icon: Clock },
      paid: { label: "Pagado", variant: "default" as const, icon: CheckCircle },
      overdue: { label: "Vencido", variant: "destructive" as const, icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "secondary" as const,
      icon: Clock
    };

    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const approvePaymentMutation = useMutation({
    mutationFn: async (stageId: number) => {
      const response = await apiRequest("POST", `/api/payment-stages/${stageId}/approve-payment`);
       if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al aprobar el pago");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "payment-stages"] });
      toast({
        title: "Pago aprobado",
        description: "El pago ha sido aprobado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al aprobar pago",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [selectedStageForRejection, setSelectedStageForRejection] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const rejectPaymentMutation = useMutation({
    mutationFn: async ({ stageId, reason }: { stageId: number; reason: string }) => {
      const response = await apiRequest("POST", `/api/payment-stages/${stageId}/reject-payment`, {
        reason
      });
       if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al rechazar el pago");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "payment-stages"] });
      setRejectionDialogOpen(false);
      setSelectedStageForRejection(null);
      setRejectionReason("");
      toast({
        title: "Pago rechazado",
        description: "El pago ha sido rechazado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al rechazar pago",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getTotalPaid = () => {
    if (!stages) return 0;
    return stages
      .filter((stage: PaymentStage) => stage.status === 'paid')
      .reduce((total: number, stage: PaymentStage) => total + parseFloat(stage.amount), 0);
  };

  const getTotalPending = () => {
    if (!stages) return 0;
    return stages
      .filter((stage: PaymentStage) => stage.status !== 'paid')
      .reduce((total: number, stage: PaymentStage) => total + parseFloat(stage.amount), 0);
  };

  const rejectionFormSchema = z.object({
    reason: z.string().min(10, "El motivo debe tener al menos 10 caracteres").max(500, "El motivo no puede superar los 500 caracteres")
  });

  const rejectionForm = useForm<z.infer<typeof rejectionFormSchema>>({
    resolver: zodResolver(rejectionFormSchema),
    defaultValues: {
      reason: ""
    }
  });

  const handleRejectionSubmit = (values: z.infer<typeof rejectionFormSchema>) => {
    if (selectedStageForRejection) {
      rejectPaymentMutation.mutate({
        stageId: selectedStageForRejection,
        reason: values.reason
      });
    }
  };

  const openRejectionDialog = (stageId: number) => {
    setSelectedStageForRejection(stageId);
    setRejectionDialogOpen(true);
    rejectionForm.reset();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-destructive">
          Error al cargar las etapas de pago: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Proyecto</p>
                <p className="text-xl font-bold">${projectPrice.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cobrado</p>
                <p className="text-xl font-bold text-green-600">${getTotalPaid().toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendiente</p>
                <p className="text-xl font-bold text-orange-600">${getTotalPending().toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progreso</p>
                <p className="text-xl font-bold">{projectProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${stages?.some((s: PaymentStage) => s.status === 'pending_verification') ? 'border-yellow-400 bg-yellow-50' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className={`h-8 w-8 ${stages?.some((s: PaymentStage) => s.status === 'pending_verification') ? 'text-yellow-600 animate-pulse' : 'text-gray-400'}`} />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Comprobantes</p>
                <p className={`text-xl font-bold ${stages?.some((s: PaymentStage) => s.status === 'pending_verification') ? 'text-yellow-600' : 'text-gray-500'}`}>
                  {stages?.filter((s: PaymentStage) => s.status === 'pending_verification').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso del Proyecto</span>
              <span>{projectProgress}%</span>
            </div>
            <Progress value={projectProgress} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Payment Stages */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Etapas de Pago
            </CardTitle>
            {(!stages || stages.length === 0) && (
              <Button
                onClick={() => createStagesMutation.mutate()}
                disabled={createStagesMutation.isPending}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Crear Etapas
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!stages || stages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No hay etapas de pago configuradas</p>
              <p className="text-sm mb-4">
                Crea las etapas de pago automáticamente para este proyecto
              </p>
              <Button
                onClick={() => createStagesMutation.mutate()}
                disabled={createStagesMutation.isPending}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {createStagesMutation.isPending ? "Creando..." : "Crear Etapas Automáticamente"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {stages.map((stage: PaymentStage, index: number) => (
                <div
                  key={stage.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    stage.status === 'available' ? 'border-blue-200 bg-blue-50' : 
                    stage.status === 'paid' ? 'border-green-200 bg-green-50' :
                    stage.status === 'pending_verification' ? 'border-yellow-200 bg-yellow-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        stage.status === 'paid' ? 'bg-green-500 text-white' :
                        stage.status === 'available' ? 'bg-blue-500 text-white' :
                        stage.status === 'pending_verification' ? 'bg-yellow-500 text-white' :
                        'bg-gray-300 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{stage.stageName}</h4>
                        {getStatusBadge(stage.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">{stage.stagePercentage}%</span> • 
                        <span className="font-medium ml-1">${parseFloat(stage.amount).toFixed(2)}</span> • 
                        <span className="ml-1">Requerido: {stage.requiredProgress}% progreso</span>
                      </div>
                      {stage.paidDate && (
                        <div className="text-xs text-green-600 mt-1">
                          Pagado: {new Date(stage.paidDate).toLocaleDateString()}
                        </div>
                      )}
                      {stage.status === 'pending_verification' && stage.paymentMethod && (
                        <div className="text-xs text-yellow-700 mt-1 font-medium">
                          💰 Comprobante recibido vía {stage.paymentMethod} - Pendiente de verificación
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {stage.status === "available" && (
                      <Button
                        size="sm"
                        onClick={() => markAsPaidMutation.mutate(stage.id)}
                        disabled={markAsPaidMutation.isPending}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Marcar Pagado
                      </Button>
                    )}

                    {stage.status === "pending_verification" && (
                      <div className="space-y-3">
                        {/* Información del comprobante */}
                        {stage.paymentData && (
                          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 rounded-lg p-5 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                              <h5 className="font-bold text-yellow-800 text-lg">📄 Comprobante de Pago Recibido</h5>
                              <div className="ml-auto bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                                PENDIENTE VERIFICACIÓN
                              </div>
                            </div>

                            {/* Resumen del pago */}
                            <div className="bg-white rounded-lg border border-yellow-200 p-4 mb-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-yellow-600 uppercase tracking-wide font-medium">Etapa</p>
                                  <p className="text-sm font-bold text-yellow-900">{stage.stageName}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-yellow-600 uppercase tracking-wide font-medium">Monto</p>
                                  <p className="text-lg font-bold text-green-700">${parseFloat(stage.amount).toFixed(2)}</p>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {/* Información del pago */}
                              <div className="bg-white rounded-lg border border-yellow-200 p-4">
                                <h6 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                                  💳 Detalles del Pago
                                </h6>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-yellow-700">Método:</span>
                                    <span className="text-sm text-yellow-900 font-semibold bg-yellow-100 px-2 py-1 rounded">
                                      {stage.paymentMethod}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-yellow-700">Cliente ID:</span>
                                    <span className="text-sm text-yellow-800 font-mono">
                                      #{stage.paymentData.confirmedBy || 'N/A'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-yellow-700">Fecha y Hora:</span>
                                    <span className="text-sm text-yellow-800">
                                      {stage.paymentData.confirmedAt ? new Date(stage.paymentData.confirmedAt).toLocaleDateString('es-ES', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      }) : 'No disponible'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Archivo del comprobante */}
                              <div className="bg-white rounded-lg border border-yellow-200 p-4">
                                <h6 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                                  📎 Comprobante Adjunto
                                </h6>
                                {stage.paymentData.originalFileName ? (
                                  <div className="space-y-3">
                                    <div className="bg-gray-50 rounded-lg p-3 border">
                                      <p className="text-xs text-gray-600 uppercase tracking-wide font-medium mb-1">Archivo</p>
                                      <p className="text-sm font-medium text-gray-900 break-all">
                                        {stage.paymentData.originalFileName}
                                      </p>
                                    </div>
                                    {stage.paymentData.fileInfo && (
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-blue-50 rounded p-2">
                                          <p className="text-xs text-blue-600 font-medium">Tamaño</p>
                                          <p className="text-sm font-bold text-blue-800">
                                            {(stage.paymentData.fileInfo.fileSize / 1024 / 1024).toFixed(2)} MB
                                          </p>
                                        </div>
                                        <div className="bg-purple-50 rounded p-2">
                                          <p className="text-xs text-purple-600 font-medium">Tipo</p>
                                          <p className="text-sm font-bold text-purple-800">
                                            {stage.paymentData.fileInfo.fileType.split('/')[1]?.toUpperCase() || 'N/A'}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                    <div className="pt-2">
                                      {/* Enlace para ver la imagen */}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={async () => {
                                          try {
                                            const token = localStorage.getItem("auth_token");
                                            const response = await fetch(`/api/payment-stages/${stage.id}/receipt-file`, {
                                              method: 'GET',
                                              headers: {
                                                "Authorization": `Bearer ${token}`,
                                                "Content-Type": "application/json"
                                              },
                                              credentials: 'include'
                                            });

                                            if (response.ok) {
                                              const data = await response.json();

                                              // Crear modal para mostrar información del comprobante
                                              const modal = document.createElement('div');
                                              modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                                              modal.innerHTML = `
                                                <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                                                  <div class="flex justify-between items-center mb-4">
                                                    <h3 class="text-lg font-semibold text-gray-900">📋 Información del Comprobante</h3>
                                                    <button class="close-modal text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
                                                  </div>
                                                  <div class="space-y-3 text-sm">
                                                    <div class="bg-gray-50 p-3 rounded-lg">
                                                      <p class="font-medium text-gray-700">📁 Archivo:</p>
                                                      <p class="text-gray-600">${data.fileName || 'N/A'}</p>
                                                    </div>
                                                    <div class="bg-gray-50 p-3 rounded-lg">
                                                      <p class="font-medium text-gray-700">📏 Tamaño:</p>
                                                      <p class="text-gray-600">${(data.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                    <div class="bg-gray-50 p-3 rounded-lg">
                                                      <p class="font-medium text-gray-700">🗂️ Tipo:</p>
                                                      <p class="text-gray-600">${data.fileType || 'N/A'}</p>
                                                    </div>
                                                    <div class="bg-gray-50 p-3 rounded-lg">
                                                      <p class="font-medium text-gray-700">📅 Subido:</p>
                                                      <p class="text-gray-600">${new Date(data.uploadedAt).toLocaleString('es-ES')}</p>
                                                    </div>
                                                    ${data.note ? `
                                                    <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                      <p class="font-medium text-blue-800">💡 Nota:</p>
                                                      <p class="text-blue-700">${data.note}</p>
                                                    </div>
                                                    ` : ''}
                                                  </div>
                                                  <div class="mt-6 text-center">
                                                    <button class="close-modal bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">
                                                      Cerrar
                                                    </button>
                                                  </div>
                                                </div>
                                              `;

                                              document.body.appendChild(modal);

                                              const closeButtons = modal.querySelectorAll('.close-modal');
                                              closeButtons.forEach(button => {
                                                button.addEventListener('click', () => {
                                                  document.body.removeChild(modal);
                                                });
                                              });

                                              modal.addEventListener('click', (e) => {
                                                if (e.target === modal) {
                                                  document.body.removeChild(modal);
                                                }
                                              });
                                            } else {
                                              const error = await response.json();
                                              toast({
                                                title: "Error",
                                                description: error.message || "No se pudo obtener el comprobante",
                                                variant: "destructive"
                                              });
                                            }
                                          } catch (error) {
                                            toast({
                                              title: "Error",
                                              description: "Error al obtener información del comprobante",
                                              variant: "destructive"
                                            });
                                          }
                                        }}
                                        className="text-xs h-7 border-blue-400 text-blue-800 hover:bg-blue-100"
                                      >
                                        <Eye className="h-3 w-3 mr-1" />
                                        Ver Comprobante
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500">
                                    No hay archivo adjunto
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Instrucciones */}
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-blue-800">
                                <strong>💡 Instrucciones:</strong> Revisa el comprobante y verifica el pago. 
                                El cliente puede contactarte por WhatsApp para consultas adicionales.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Botones de acción */}
                        <div className="flex items-center gap-3 pt-2">
                          <Button
                            size="sm"
                            onClick={() => approvePaymentMutation.mutate(stage.id)}
                            disabled={approvePaymentMutation.isPending}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Aprobar Pago
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openRejectionDialog(stage.id)}
                            disabled={rejectPaymentMutation.isPending}
                            variant="destructive"
                            className="flex items-center gap-2"
                          >
                            <X className="h-4 w-4" />
                            Rechazar Pago
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Instructions */}
      {stages && stages.some((s: PaymentStage) => s.status === 'available') && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  Instrucciones para Cobros
                </h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>1. <strong>Generar Link:</strong> Crea el link de pago para la etapa disponible</p>
                  <p>2. <strong>Enviar al Cliente:</strong> Comparte el link con el cliente</p>
                  <p>3. <strong>Confirmar Pago:</strong> Marca como pagado una vez confirmado</p>
                  <p>4. <strong>Actualizar Progreso:</strong> Las siguientes etapas se activarán automáticamente</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Rechazo de Pago */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Rechazar Pago
            </DialogTitle>
          </DialogHeader>

          <Form {...rejectionForm}>
            <form onSubmit={rejectionForm.handleSubmit(handleRejectionSubmit)} className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-1">
                      ⚠️ Importante
                    </h4>
                    <p className="text-sm text-yellow-700">
                      Al rechazar este pago, se enviará una notificación al cliente explicando el motivo del rechazo. 
                      La etapa volverá a estar disponible para un nuevo pago.
                    </p>
                  </div>
                </div>
              </div>

              <FormField
                control={rejectionForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Motivo del rechazo <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ejemplo: El comprobante no coincide con el monto requerido, la transferencia no ha sido recibida, etc."
                        className="min-h-[120px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between items-center">
                      <FormMessage />
                      <span className="text-xs text-gray-500">
                        {field.value?.length || 0}/500 caracteres
                      </span>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectionDialogOpen(false)}
                  disabled={rejectPaymentMutation.isPending}
                  className="flex items-center gap-2"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={rejectPaymentMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {rejectPaymentMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Rechazando...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4" />
                      Rechazar Pago
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}