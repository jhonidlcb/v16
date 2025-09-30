import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { CreditCard, Clock, CheckCircle, DollarSign } from "lucide-react";

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

interface PaymentStagesManagementProps {
  projectId: number;
  projectProgress: number;
}

export default function PaymentStagesManagement({
  projectId,
  projectProgress
}: PaymentStagesManagementProps) {
  const [stages, setStages] = useState<PaymentStage[]>([]);
  const [loading, setLoading] = useState(false); // This state is not used in the provided changes, but kept from original
  const [isLoading, setIsLoading] = useState(true); // New state for loading

  useEffect(() => {
    fetchStages();
  }, [projectId]);

  const fetchStages = async () => {
    setIsLoading(true); // Set loading to true before fetching
    try {
      // Original fetch call, assuming it needs to be replaced with apiRequest in a real scenario based on the thinking,
      // but for this specific change, only the rendering logic is being updated.
      const response = await fetch(`/api/projects/${projectId}/payment-stages`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setStages(data);
      }
    } catch (error) {
      console.error("Error fetching payment stages:", error);
    } finally {
      setIsLoading(false); // Set loading to false after fetching
    }
  };

  const generatePaymentLink = async (stageId: number) => {
    setLoading(true); // This state is not used in the provided changes, but kept from original
    try {
      const response = await fetch(`/api/payment-stages/${stageId}/generate-link`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        fetchStages(); // Refresh data
      }
    } catch (error) {
      console.error("Error generating payment link:", error);
    } finally {
      setLoading(false); // This state is not used in the provided changes, but kept from original
    }
  };

  const markAsPaid = async (stageId: number) => {
    setLoading(true); // This state is not used in the provided changes, but kept from original
    try {
      const response = await fetch(`/api/payment-stages/${stageId}/complete`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        fetchStages(); // Refresh data
      }
    } catch (error) {
      console.error("Error marking as paid:", error);
    } finally {
      setLoading(false); // This state is not used in the provided changes, but kept from original
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendiente", variant: "secondary" as const },
      available: { label: "Disponible", variant: "default" as const },
      paid: { label: "Pagado", variant: "success" as const },
      overdue: { label: "Vencido", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "secondary" as const,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "available":
        return <CreditCard className="h-4 w-4 text-blue-500" />;
      case "overdue":
        return <Clock className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  // The changes start here, modifying the return statement and adding a loading state check.
  if (isLoading) {
    return (
      <div className="space-y-6" data-payment-stages>
        <Card>
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-payment-stages>
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Etapas de Pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Progreso del Proyecto:</span>
                <span className="font-medium">{projectProgress}%</span>
              </div>
              <Progress value={projectProgress} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Stages */}
      <Card>
        <CardHeader>
          <CardTitle>💰 ¿Cómo funciona?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <ul className="text-sm space-y-1 text-blue-800">
              <li>• Tu proyecto se divide en 4 etapas de pago</li>
              <li>• Cada etapa se activa cuando el proyecto avanza</li>
              <li>• Recibes notificación cuando puedes pagar la siguiente etapa</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {stages.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            Aún no hay etapas de pago definidas para este proyecto.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(stage.status)}
                <div>
                  <div className="font-medium">{stage.stageName}</div>
                  <div className="text-sm text-muted-foreground">
                    {stage.stagePercentage}% - ${parseFloat(stage.amount).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Requerido: {stage.requiredProgress}% progreso
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(stage.status)}

                {stage.status === "available" && (
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        // Simular apertura del modal de pago
                        const paymentMethods = [
                          { id: 'mango', name: 'Mango', alias: '4220058' },
                          { id: 'ueno', name: 'Ueno Bank', alias: '4220058' },
                          { id: 'solar', name: 'Banco Solar', alias: 'softwarepar.lat@gmail.com' }
                        ];
                        
                        const whatsappMessage = encodeURIComponent(
                          `Hola! Quiero realizar el pago de mi proyecto.\n\n` +
                          `📋 Detalles:\n` +
                          `• Etapa: ${stage.stageName}\n` +
                          `• Monto: $${parseFloat(stage.amount).toFixed(2)}\n\n` +
                          `¿Podrían confirmarme los datos de transferencia? ¡Gracias!`
                        );
                        
                        const whatsappUrl = `https://wa.me/595985990046?text=${whatsappMessage}`;
                        window.open(whatsappUrl, '_blank');
                      }}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pagar ${parseFloat(stage.amount).toFixed(2)}
                    </Button>
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border">
                      Opciones: Mango, Ueno, Banco Solar
                    </div>
                  </div>
                )}

                {stage.status === "paid" && stage.paidDate && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Pagado: {new Date(stage.paidDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}