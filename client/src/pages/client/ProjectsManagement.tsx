import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { useProjects } from "@/hooks/useProjects";
import {
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  MessageCircle,
  FileText,
  Calendar,
  DollarSign,
  AlertTriangle,
  FolderOpen,
  Trash2,
  Send,
} from "lucide-react";
import ProjectCommunication from "@/components/ProjectCommunication";
import PaymentStagesManagement from "@/components/PaymentStagesManagement";
import ClientPaymentStages from "@/components/ClientPaymentStages";
import TimelinePreview from "@/components/TimelinePreview";
import BudgetNegotiationClient from "@/components/BudgetNegotiationClient";
import { Progress } from "@/components/ui/progress";

interface ProjectTimeline {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending';
  completedAt?: string;
  estimatedDate?: string;
}

export default function ProjectsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { projects, isLoading } = useProjects();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Mutation para eliminar proyecto
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const response = await apiRequest("DELETE", `/api/projects/${projectId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al eliminar proyecto");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Proyecto eliminado",
        description: "El proyecto ha sido eliminado exitosamente.",
      });
      setSelectedProject(null);
      setShowDeleteDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para enviar mensaje
  const sendMessageMutation = useMutation({
    mutationFn: async ({ projectId, message }: { projectId: number; message: string }) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/messages`, { message });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProject?.id}/messages`] });
      setNewMessage("");
      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje ha sido enviado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al enviar mensaje",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "outline" as const, icon: Clock, color: "text-yellow-500" },
      in_progress: { variant: "secondary" as const, icon: Settings, color: "text-blue-500" },
      completed: { variant: "default" as const, icon: CheckCircle, color: "text-green-500" },
      cancelled: { variant: "destructive" as const, icon: XCircle, color: "text-red-500" },
      negotiating: { variant: "outline" as const, icon: DollarSign, color: "text-orange-500" },
    };

    const config = variants[status as keyof typeof variants];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status === 'pending' ? 'Pendiente' :
         status === 'in_progress' ? 'En Desarrollo' :
         status === 'completed' ? 'Completado' : 
         status === 'cancelled' ? 'Cancelado' :
         'Negociando Presupuesto'}
      </Badge>
    );
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedProject) return;
    sendMessageMutation.mutate({ 
      projectId: selectedProject.id, 
      message: newMessage 
    });
  };

  const handleDeleteProject = () => {
    if (selectedProject) {
      deleteProjectMutation.mutate(selectedProject.id);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Gestión de Proyectos">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!selectedProject) {
    return (
      <DashboardLayout title="Gestión de Proyectos">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Mis Proyectos</h1>
            <p className="text-muted-foreground">Selecciona un proyecto para ver los detalles</p>
          </div>

          <div className="grid gap-4">
            {projects?.map((project: any) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-lg transition-all cursor-pointer" 
                      onClick={() => setSelectedProject(project)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <h3 className="text-xl font-semibold">{project.name}</h3>
                        <p className="text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                        <div className="flex items-center space-x-4">
                          {getStatusBadge(project.status)}
                          <span className="text-sm text-muted-foreground">
                            ${project.price}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Progreso: {project.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {!projects?.length && (
            <div className="text-center py-12">
              <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tienes proyectos</h3>
              <p className="text-muted-foreground">Solicita tu primer proyecto para comenzar</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Proyecto: ${selectedProject.name}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => setSelectedProject(null)} className="mb-2">
              ← Volver a proyectos
            </Button>
            <h1 className="text-3xl font-bold">{selectedProject.name}</h1>
            <div className="flex items-center space-x-4 mt-2">
              {getStatusBadge(selectedProject.status)}
              <span className="text-muted-foreground">
                Progreso: {selectedProject.progress}%
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={selectedProject.status === 'in_progress' || selectedProject.status === 'completed'}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso del Proyecto</span>
                <span>{selectedProject.progress}%</span>
              </div>
              <Progress value={selectedProject.progress} className="w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Project Details Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Resumen</TabsTrigger>
            <TabsTrigger value="budget" className="text-xs sm:text-sm">Negociación</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs sm:text-sm">Pagos</TabsTrigger>
            <TabsTrigger value="communication" className="text-xs sm:text-sm">Comunicación</TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs sm:text-sm">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalles del Proyecto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Descripción</h4>
                  <p className="text-muted-foreground">{selectedProject.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-1">Precio</h4>
                    <p className="text-2xl font-bold text-green-600">${selectedProject.price}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Estado</h4>
                    {getStatusBadge(selectedProject.status)}
                  </div>
                </div>
                {selectedProject.deliveryDate && (
                  <div>
                    <h4 className="font-medium mb-1">Fecha de Entrega</h4>
                    <p className="text-muted-foreground">
                      {new Date(selectedProject.deliveryDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            <BudgetNegotiationClient 
              projectId={selectedProject.id}
              currentPrice={selectedProject.price}
              projectStatus={selectedProject.status}
            />
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            {selectedProject && (
              <ClientPaymentStages 
                projectId={selectedProject.id}
                projectProgress={selectedProject.progress || 0}
                projectPrice={parseFloat(selectedProject.price) || 0}
              />
            )}
          </TabsContent>

          <TabsContent value="communication" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Comunicación con el Equipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectCommunication projectId={selectedProject.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Timeline del Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TimelinePreview projectId={selectedProject.id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Confirmar Eliminación
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>¿Estás seguro de que deseas eliminar el proyecto "{selectedProject?.name}"?</p>
              <p className="text-sm text-muted-foreground mt-2">
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteProject}
                disabled={deleteProjectMutation.isPending}
              >
                {deleteProjectMutation.isPending ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}