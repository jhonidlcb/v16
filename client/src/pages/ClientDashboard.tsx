import { useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useProjects } from "@/hooks/useProjects";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { Ticket } from "@shared/schema";
import {
  FolderOpen,
  CheckCircle,
  HeadphonesIcon,
  Plus,
  Eye,
  MessageCircle,
  Download,
  Calendar,
  AlertCircle,
  FileText,
} from "lucide-react";

export default function ClientDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { projects, isLoading: projectsLoading } = useProjects();
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false);

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/tickets"],
  });

  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: { title: string; description: string; priority: string; projectId?: number }) => {
      const response = await apiRequest("POST", "/api/tickets", ticketData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Ticket creado",
        description: "Tu ticket de soporte ha sido creado exitosamente.",
      });
      setShowNewTicketDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear ticket",
        description: error.message || "No se pudo crear el ticket",
        variant: "destructive",
      });
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (projectData: { name: string; description: string; price: string }) => {
      const response = await apiRequest("POST", "/api/projects", projectData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Proyecto creado",
        description: "Tu solicitud de proyecto ha sido enviada exitosamente.",
      });
      setShowNewProjectDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear proyecto",
        description: error.message || "No se pudo crear el proyecto",
        variant: "destructive",
      });
    },
  });

  const activeProjects = projects?.filter(p => p.status === 'pending' || p.status === 'in_progress') || [];
  const completedProjects = projects?.filter(p => p.status === 'completed') || [];
  const openTickets = (tickets as Ticket[])?.filter((t: Ticket) => t.status === 'open' || t.status === 'in_progress') || [];

  const statsCards = [
    {
      title: "Proyectos Activos",
      value: activeProjects.length,
      icon: FolderOpen,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Completados",
      value: completedProjects.length,
      icon: CheckCircle,
      color: "bg-chart-2/10 text-chart-2",
    },
    {
      title: "Tickets Abiertos",
      value: openTickets.length,
      icon: HeadphonesIcon,
      color: "bg-chart-1/10 text-chart-1",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'in_progress':
        return 'En Desarrollo';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  if (projectsLoading || ticketsLoading) {
    return (
      <DashboardLayout title="Dashboard de Cliente">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-96 bg-muted rounded"></div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard de Cliente">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4">
          <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-project">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Proyecto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Solicitar Nuevo Proyecto</DialogTitle>
              </DialogHeader>
              <NewProjectForm
                onSubmit={(data) => createProjectMutation.mutate(data)}
                isLoading={createProjectMutation.isPending}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-new-ticket">
                <HeadphonesIcon className="h-4 w-4 mr-2" />
                Nuevo Ticket de Soporte
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Ticket de Soporte</DialogTitle>
              </DialogHeader>
              <NewTicketForm
                projects={projects || []}
                onSubmit={(data) => createTicketMutation.mutate(data)}
                isLoading={createTicketMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Mis Proyectos</CardTitle>
            </CardHeader>
            <CardContent>
              {projects && (projects as Project[]).length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                          <TableRow>
                            <TableHead>Proyecto</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Progreso</TableHead>
                            <TableHead>Fecha de Entrega</TableHead>
                          </TableRow>
                        </TableHeader>
                    <TableBody>
                      {(projects as Project[]).map((project) => (
                        <TableRow key={project.id} data-testid={`project-row-${project.id}`}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{project.name}</p>
                              <p className="text-sm text-muted-foreground">{project.description}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(project.status)}>
                              {getStatusText(project.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Progress value={project.progress} className="flex-1" />
                              <span className="text-sm font-medium text-foreground">
                                {project.progress}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                                {project.deliveryDate
                                  ? new Date(project.deliveryDate).toLocaleDateString()
                                  : "Por definir"}
                              </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground mb-2">No tienes proyectos aún</p>
                  <p className="text-muted-foreground mb-4">
                    Solicita tu primer proyecto para comenzar
                  </p>
                  <Button onClick={() => setShowNewProjectDialog(true)} data-testid="button-first-project">
                    <Plus className="h-4 w-4 mr-2" />
                    Solicitar Proyecto
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Tickets */}
        {tickets && (tickets as Ticket[]).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Tickets de Soporte Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(tickets as Ticket[]).slice(0, 5).map((ticket: Ticket) => (
                    <div key={ticket.id} className="flex items-start space-x-4 p-4 border rounded-lg" data-testid={`ticket-item-${ticket.id}`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        ticket.priority === 'urgent' ? 'bg-destructive/10 text-destructive' :
                        ticket.priority === 'high' ? 'bg-chart-1/10 text-chart-1' :
                        ticket.priority === 'medium' ? 'bg-chart-4/10 text-chart-4' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {ticket.priority === 'urgent' ? <AlertCircle className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-foreground">{ticket.title}</h4>
                          <Badge variant={ticket.status === 'resolved' ? 'default' : 'secondary'}>
                            {ticket.status === 'open' ? 'Abierto' :
                             ticket.status === 'in_progress' ? 'En Progreso' :
                             ticket.status === 'resolved' ? 'Resuelto' : 'Cerrado'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}

interface NewProjectFormProps {
  onSubmit: (data: { name: string; description: string; price: string }) => void;
  isLoading: boolean;
}

function NewProjectForm({ onSubmit, isLoading }: NewProjectFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim()) {
      return;
    }
    if (!formData.description.trim()) {
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre del Proyecto</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Mi aplicación web"
          required
          data-testid="input-project-name"
        />
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe las funcionalidades y objetivos de tu proyecto..."
          rows={4}
          required
          data-testid="textarea-project-description"
        />
      </div>

      <div>
        <Label htmlFor="price">Presupuesto Estimado (USD)</Label>
        <Input
          id="price"
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          placeholder="5000"
          required
          data-testid="input-project-price"
        />
      </div>

      <Button type="submit" disabled={isLoading} data-testid="button-submit-project">
        {isLoading ? "Enviando..." : "Solicitar Proyecto"}
      </Button>
    </form>
  );
}

interface NewTicketFormProps {
  projects: any[];
  onSubmit: (data: { title: string; description: string; priority: string; projectId?: number }) => void;
  isLoading: boolean;
}

function NewTicketForm({ projects, onSubmit, isLoading }: NewTicketFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    projectId: undefined as number | undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Describe brevemente el problema"
          required
          data-testid="input-ticket-title"
        />
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe detalladamente el problema o consulta..."
          rows={4}
          required
          data-testid="textarea-ticket-description"
        />
      </div>

      <div>
        <Label htmlFor="priority">Prioridad</Label>
        <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
          <SelectTrigger data-testid="select-ticket-priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Baja</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {projects.length > 0 && (
        <div>
          <Label htmlFor="projectId">Proyecto Relacionado (Opcional)</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, projectId: parseInt(value) })}>
            <SelectTrigger data-testid="select-ticket-project">
              <SelectValue placeholder="Selecciona un proyecto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" disabled={isLoading} data-testid="button-submit-ticket">
        {isLoading ? "Creando..." : "Crear Ticket"}
      </Button>
    </form>
  );
}