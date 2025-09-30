import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import {
  HeadphonesIcon,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  TrendingUp,
  Search,
  Filter,
  Send,
  Eye,
  Archive,
  AlertTriangle,
  Timer,
  Star,
  Trash,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface AdminTicket {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  clientName: string;
  clientEmail: string;
  clientId: number;
  projectId?: number;
  projectName?: string;
  assignedAgent?: string;
  responseCount: number;
  lastResponseAt?: string;
}

interface TicketStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  customerSatisfaction: number;
}

export default function SupportAdministration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [showResponseModal, setShowResponseModal] = useState(false); // Added for response modal

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/admin/tickets"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/tickets");
      return await response.json();
    },
  });

  const { data: ticketStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/tickets/stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/tickets/stats");
      return await response.json();
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, updates }: { ticketId: number; updates: any }) => {
      const response = await apiRequest("PUT", `/api/admin/tickets/${ticketId}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets/stats"] });
      toast({
        title: "Ticket actualizado",
        description: "El ticket ha sido actualizado exitosamente.",
      });
    },
  });

  const sendResponseMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: number; message: string }) => {
      const response = await apiRequest("POST", `/api/tickets/${ticketId}/responses`, { message });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
      setResponseMessage("");
      toast({
        title: "Respuesta enviada",
        description: "Tu respuesta ha sido enviada al cliente.",
      });
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/tickets/${ticketId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets/stats"] });
      setShowTicketDialog(false);
      setSelectedTicket(null);
      toast({
        title: "Ticket eliminado",
        description: "El ticket ha sido eliminado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar ticket",
        description: error.message || "No se pudo eliminar el ticket",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      open: { variant: "destructive" as const, icon: AlertCircle },
      in_progress: { variant: "secondary" as const, icon: Clock },
      resolved: { variant: "default" as const, icon: CheckCircle },
      closed: { variant: "outline" as const, icon: Archive },
    };

    const config = variants[status as keyof typeof variants];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status === 'open' ? 'Abierto' :
         status === 'in_progress' ? 'En Progreso' :
         status === 'resolved' ? 'Resuelto' : 'Cerrado'}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: { variant: "outline" as const, color: "text-green-500" },
      medium: { variant: "secondary" as const, color: "text-yellow-500" },
      high: { variant: "default" as const, color: "text-orange-500" },
      urgent: { variant: "destructive" as const, color: "text-red-500" },
    };

    const config = variants[priority as keyof typeof variants];

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <AlertTriangle className={`h-3 w-3 ${config.color}`} />
        {priority === 'low' ? 'Baja' :
         priority === 'medium' ? 'Media' :
         priority === 'high' ? 'Alta' : 'Urgente'}
      </Badge>
    );
  };

  const filteredTickets = tickets?.filter((ticket: AdminTicket) => {
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.clientEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  }) || [];

  // This function is a placeholder and needs to be implemented based on the actual logic required for status changes.
  const handleStatusChange = (ticketId: number, newStatus: string) => {
    console.log(`Changing status of ticket ${ticketId} to ${newStatus}`);
    updateTicketMutation.mutate({ ticketId, updates: { status: newStatus } });
  };

  if (ticketsLoading || statsLoading) {
    return (
      <DashboardLayout title="Administración de Soporte">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Administración de Soporte">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <HeadphonesIcon className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                  <p className="text-2xl font-bold">{ticketStats?.totalTickets || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold">{ticketStats?.openTickets || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Timer className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Tiempo Resp. Prom.</p>
                  <p className="text-2xl font-bold">{ticketStats?.avgResponseTime || 0}h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Satisfacción</p>
                  <p className="text-2xl font-bold">{ticketStats?.customerSatisfaction || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros de Tickets
              </CardTitle>
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full md:w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="open">Abiertos</SelectItem>
                    <SelectItem value="in_progress">En Progreso</SelectItem>
                    <SelectItem value="resolved">Resueltos</SelectItem>
                    <SelectItem value="closed">Cerrados</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tickets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets de Soporte ({filteredTickets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead className="min-w-[200px]">Título</TableHead>
                    <TableHead className="min-w-[160px]">Cliente</TableHead>
                    <TableHead className="w-24">Estado</TableHead>
                    <TableHead className="w-24">Prioridad</TableHead>
                    <TableHead className="min-w-[140px]">Proyecto</TableHead>
                    <TableHead className="w-20">Respuestas</TableHead>
                    <TableHead className="w-24">Creado</TableHead>
                    <TableHead className="w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket: AdminTicket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono">#{ticket.id}</TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="truncate font-medium" title={ticket.title}>
                            {ticket.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate" title={ticket.description}>
                            {ticket.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[160px]">
                          <p className="truncate font-medium" title={ticket.clientName}>
                            {ticket.clientName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate" title={ticket.clientEmail}>
                            {ticket.clientEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>
                        <div className="max-w-[140px]">
                          <p className="truncate text-sm" title={ticket.projectName ? ticket.projectName : "Sin proyecto"}>
                            {ticket.projectName ? ticket.projectName : "Sin proyecto"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowTicketDialog(true);
                          }}
                        >
                          💬 {ticket.responseCount || 0}
                        </Button>
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              title="Acciones"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setShowTicketDialog(true);
                              }}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateTicketMutation.mutate({
                                  ticketId: ticket.id,
                                  updates: {
                                    status: ticket.status === 'open' ? 'in_progress' : 'resolved'
                                  }
                                })
                              }
                              className="flex items-center gap-2"
                            >
                              {ticket.status === 'open' ? (
                                <>
                                  <Timer className="h-4 w-4" />
                                  Tomar ticket
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4" />
                                  Marcar resuelto
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                if (window.confirm('¿Estás seguro de que quieres eliminar este ticket? Esta acción no se puede deshacer.')) {
                                  deleteTicketMutation.mutate(ticket.id);
                                }
                              }}
                              disabled={deleteTicketMutation.isPending}
                              className="flex items-center gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash className="h-4 w-4" />
                              Eliminar ticket
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Detail Dialog */}
        <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>Ticket #{selectedTicket?.id}</span>
                {selectedTicket && getStatusBadge(selectedTicket.status)}
                {selectedTicket && getPriorityBadge(selectedTicket.priority)}
              </DialogTitle>
            </DialogHeader>

            {selectedTicket && (
              <div className="space-y-6">
                {/* Ticket Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Cliente</Label>
                    <p className="font-medium">{selectedTicket.clientName}</p>
                    <p className="text-sm text-muted-foreground">{selectedTicket.clientEmail}</p>
                  </div>
                  <div>
                    <Label>Proyecto Relacionado</Label>
                    <p>{selectedTicket.projectName || "Sin proyecto asociado"}</p>
                  </div>
                </div>

                <div>
                  <Label>Descripción del Problema</Label>
                  <p className="mt-2 p-3 bg-muted rounded">{selectedTicket.description}</p>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateTicketMutation.mutate({
                        ticketId: selectedTicket.id,
                        updates: { status: 'in_progress' }
                      })
                    }
                    disabled={selectedTicket.status === 'in_progress'}
                  >
                    Marcar en Progreso
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateTicketMutation.mutate({
                        ticketId: selectedTicket.id,
                        updates: { status: 'resolved' }
                      })
                    }
                    disabled={selectedTicket.status === 'resolved'}
                  >
                    Marcar como Resuelto
                  </Button>
                  <Select
                    onValueChange={(value) =>
                      updateTicketMutation.mutate({
                        ticketId: selectedTicket.id,
                        updates: { priority: value }
                      })
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Cambiar prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de que quieres eliminar este ticket? Esta acción no se puede deshacer.')) {
                        deleteTicketMutation.mutate(selectedTicket.id);
                      }
                    }}
                    disabled={deleteTicketMutation.isPending}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    {deleteTicketMutation.isPending ? "Eliminando..." : "Eliminar Ticket"}
                  </Button>
                </div>

                {/* Response Form */}
                <div className="space-y-4">
                  <Label>Responder al Cliente</Label>
                  <Textarea
                    placeholder="Escribe tu respuesta aquí..."
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    rows={4}
                  />
                  <Button
                    onClick={() =>
                      sendResponseMutation.mutate({
                        ticketId: selectedTicket.id,
                        message: responseMessage
                      })
                    }
                    disabled={!responseMessage.trim() || sendResponseMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendResponseMutation.isPending ? "Enviando..." : "Enviar Respuesta"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}