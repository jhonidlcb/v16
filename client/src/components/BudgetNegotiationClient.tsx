
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { DollarSign, CheckCircle, XCircle, ArrowRightLeft, AlertCircle } from "lucide-react";

interface BudgetNegotiationClientProps {
  projectId: number;
  currentPrice: string;
  projectStatus: string;
}

export default function BudgetNegotiationClient({ 
  projectId, 
  currentPrice, 
  projectStatus 
}: BudgetNegotiationClientProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [counterPrice, setCounterPrice] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [showCounterForm, setShowCounterForm] = useState(false);

  const { data: negotiations, isLoading, error } = useQuery({
    queryKey: ["/api/projects", projectId, "budget-negotiations"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/projects/${projectId}/budget-negotiations`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching budget negotiations:", error);
        throw error;
      }
    },
    enabled: projectStatus === "negotiating" && !!projectId,
  });

  const respondMutation = useMutation({
    mutationFn: async (data: { negotiationId: number; status: string; message?: string; counterPrice?: number }) => {
      const response = await apiRequest("PUT", `/api/budget-negotiations/${data.negotiationId}/respond`, {
        status: data.status,
        message: data.message,
        counterPrice: data.counterPrice,
      });
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "budget-negotiations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      
      setCounterPrice("");
      setResponseMessage("");
      setShowCounterForm(false);

      const statusMessages = {
        accepted: "¡Propuesta aceptada! El proyecto iniciará pronto.",
        rejected: "Propuesta rechazada. El equipo será notificado.",
        countered: "Tu contrapropuesta ha sido enviada.",
      };

      toast({
        title: "Respuesta enviada",
        description: statusMessages[variables.status as keyof typeof statusMessages],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al responder",
        variant: "destructive",
      });
    },
  });

  const handleRespond = (negotiationId: number, status: string) => {
    if (status === "countered") {
      const price = parseFloat(counterPrice);
      if (isNaN(price) || price <= 0) {
        toast({
          title: "Error de validación",
          description: "Ingresa un precio válido para la contrapropuesta",
          variant: "destructive",
        });
        return;
      }
      
      respondMutation.mutate({
        negotiationId,
        status,
        message: responseMessage,
        counterPrice: price,
      });
    } else {
      respondMutation.mutate({
        negotiationId,
        status,
        message: responseMessage,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { variant: "outline" as const, icon: AlertCircle, text: "Esperando tu Respuesta", color: "text-orange-500" },
      accepted: { variant: "default" as const, icon: CheckCircle, text: "Aceptado", color: "text-green-500" },
      rejected: { variant: "destructive" as const, icon: XCircle, text: "Rechazado", color: "text-red-500" },
      countered: { variant: "secondary" as const, icon: ArrowRightLeft, text: "Contrapropuesta", color: "text-blue-500" },
    };

    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {config.text}
      </Badge>
    );
  };

  // Find the latest pending negotiation
  const latestPending = negotiations?.find((n: any) => n.status === "pending");

  if (projectStatus !== "negotiating") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Negociación de Presupuesto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Sin Negociación Activa</h3>
            <p>Actualmente no hay una negociación de presupuesto en proceso.</p>
            <p className="text-sm mt-2">
              Estado del proyecto: <Badge variant="outline">{projectStatus === 'pending' ? 'Pendiente' :
               projectStatus === 'in_progress' ? 'En Desarrollo' :
               projectStatus === 'completed' ? 'Completado' : 
               projectStatus === 'cancelled' ? 'Cancelado' : projectStatus}</Badge>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/2"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert for pending negotiations */}
      {latestPending && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              Nueva Propuesta de Presupuesto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tu Precio Original</Label>
                  <div className="text-2xl font-bold text-muted-foreground">
                    ${parseFloat(latestPending.originalPrice).toLocaleString()}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Precio Propuesto</Label>
                  <div className="text-2xl font-bold text-primary">
                    ${parseFloat(latestPending.proposedPrice).toLocaleString()}
                  </div>
                </div>
              </div>
              
              {latestPending.message && (
                <div className="bg-muted/50 p-3 rounded-md mb-4">
                  <h4 className="font-medium mb-1">Mensaje del equipo:</h4>
                  <p className="text-sm">{latestPending.message}</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleRespond(latestPending.id, "accepted")}
                    disabled={respondMutation.isPending}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aceptar Propuesta
                  </Button>
                  
                  <Button 
                    variant="destructive"
                    onClick={() => handleRespond(latestPending.id, "rejected")}
                    disabled={respondMutation.isPending}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar
                  </Button>
                </div>

                <Button 
                  variant="outline"
                  onClick={() => setShowCounterForm(!showCounterForm)}
                  disabled={respondMutation.isPending}
                  className="w-full"
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Hacer Contrapropuesta
                </Button>

                {showCounterForm && (
                  <div className="border-t pt-4 space-y-3">
                    <div>
                      <Label htmlFor="counter-price">Tu Contrapropuesta (USD)</Label>
                      <Input
                        id="counter-price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={counterPrice}
                        onChange={(e) => setCounterPrice(e.target.value)}
                        placeholder="60000.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="counter-message">Mensaje (opcional)</Label>
                      <Textarea
                        id="counter-message"
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        placeholder="Explica tu contrapropuesta..."
                        rows={2}
                      />
                    </div>
                    <Button 
                      onClick={() => handleRespond(latestPending.id, "countered")}
                      disabled={respondMutation.isPending}
                      className="w-full"
                    >
                      {respondMutation.isPending ? "Enviando..." : "Enviar Contrapropuesta"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Historial de Negociación
          </CardTitle>
        </CardHeader>
        <CardContent>
          {negotiations?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aún no hay propuestas de presupuesto.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {negotiations?.map((negotiation: any) => (
                <div key={negotiation.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold">
                        ${parseFloat(negotiation.originalPrice).toLocaleString()} → ${parseFloat(negotiation.proposedPrice).toLocaleString()}
                      </div>
                      {getStatusBadge(negotiation.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(negotiation.createdAt).toLocaleString()}
                    </div>
                  </div>
                  
                  {negotiation.message && (
                    <div className="bg-muted/50 p-3 rounded-md">
                      <p className="text-sm">{negotiation.message}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
