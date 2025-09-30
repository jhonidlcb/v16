import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import {
  HeadphonesIcon,
  MessageCircle,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Book,
  FileText,
  Send,
  Phone,
  Mail,
  HelpCircle,
} from "lucide-react";

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  projectId?: number;
  projectName?: string;
  responses: TicketResponse[];
}

interface TicketResponse {
  id: number;
  message: string;
  author: string;
  role: string;
  createdAt: string;
  isFromSupport: boolean;
}

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

interface KnowledgeBaseArticle {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  views: number;
  createdAt: string;
}

export default function SupportCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newTicketResponse, setNewTicketResponse] = useState("");

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/tickets"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/tickets");
      return await response.json();
    },
  });

  const { data: faqData, isLoading: faqLoading } = useQuery({
    queryKey: ["/api/support/faq"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/support/faq");
      return await response.json();
    },
  });

  const { data: knowledgeBase, isLoading: kbLoading } = useQuery({
    queryKey: ["/api/support/knowledge-base"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/support/knowledge-base");
      return await response.json();
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: {
      title: string;
      description: string;
      priority: string;
      category: string;
      projectId?: number;
    }) => {
      const response = await apiRequest("POST", "/api/tickets", ticketData);
      if (!response.ok) {
        throw new Error('Error al crear el ticket');
      }
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

  const sendResponseMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: number; message: string }) => {
      const response = await apiRequest("POST", `/api/tickets/${ticketId}/responses`, { message });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setNewTicketResponse("");
      toast({
        title: "Respuesta enviada",
        description: "Tu respuesta ha sido enviada al equipo de soporte.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al enviar respuesta",
        description: error.message || "No se pudo enviar la respuesta",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'open':
        return 'outline';
      case 'closed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Abierto';
      case 'in_progress':
        return 'En Progreso';
      case 'resolved':
        return 'Resuelto';
      case 'closed':
        return 'Cerrado';
      default:
        return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'Baja';
      case 'medium':
        return 'Media';
      case 'high':
        return 'Alta';
      case 'urgent':
        return 'Urgente';
      default:
        return priority;
    }
  };

  const filteredTickets = tickets?.filter((ticket: Ticket) =>
    ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mockFAQ: FAQItem[] = [
    {
      id: 1,
      question: "¿Cómo puedo hacer seguimiento a mi proyecto?",
      answer: "Puedes hacer seguimiento a tu proyecto desde el panel de 'Mis Proyectos' donde encontrarás el progreso en tiempo real, timeline detallado y comunicación directa con el equipo.",
      category: "Proyectos",
      helpful: 15,
    },
    {
      id: 2,
      question: "¿Qué métodos de pago aceptan?",
      answer: "Aceptamos pagos a través de MercadoPago, incluyendo tarjetas de crédito, débito y transferencias bancarias.",
      category: "Pagos",
      helpful: 23,
    },
    {
      id: 3,
      question: "¿Puedo solicitar cambios durante el desarrollo?",
      answer: "Sí, puedes solicitar cambios menores durante el desarrollo. Los cambios mayores pueden requerir ajustes en el cronograma y presupuesto.",
      category: "Desarrollo",
      helpful: 12,
    },
  ];

  return (
    <DashboardLayout title="Centro de Soporte">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Centro de Soporte</h1>
          <p className="text-muted-foreground">
            Estamos aquí para ayudarte. Crea tickets para resolver tus consultas o problemas.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <HeadphonesIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Tickets Abiertos</p>
                  <p className="text-2xl font-bold text-foreground">
                    {tickets?.filter((t: Ticket) => t.status === 'open' || t.status === 'in_progress').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-lg bg-chart-2/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-chart-2" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Tiempo de Respuesta</p>
                  <p className="text-2xl font-bold text-foreground">&lt; 2h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-lg bg-chart-1/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-chart-1" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Tickets Resueltos</p>
                  <p className="text-2xl font-bold text-foreground">
                    {tickets?.filter((t: Ticket) => t.status === 'resolved').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Options - Removed as per intention */}

        {/* Main Content Tabs */}
        <Tabs defaultValue="tickets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1"> {/* Changed to 1 column to only show tickets */}
            <TabsTrigger value="tickets">Mis Tickets</TabsTrigger>
            {/* Removed FAQ, Knowledge Base, and Chat tabs */}
          </TabsList>

          <TabsContent value="tickets" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
              
              <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Ticket de Soporte</DialogTitle>
                  </DialogHeader>
                  <NewTicketForm
                    onSubmit={(data) => createTicketMutation.mutate(data)}
                    isLoading={createTicketMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {ticketsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse h-24 bg-muted rounded"></div>
                ))}
              </div>
            ) : filteredTickets && filteredTickets.length > 0 ? (
              <div className="space-y-4">
                {filteredTickets.map((ticket: Ticket) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                          onClick={() => setSelectedTicket(ticket)}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-lg">{ticket.title}</h3>
                              <Badge variant={getStatusColor(ticket.status)}>
                                {getStatusText(ticket.status)}
                              </Badge>
                              <Badge variant={getPriorityColor(ticket.priority)}>
                                {getPriorityText(ticket.priority)}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mb-2 line-clamp-2">
                              {ticket.description}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>Ticket #{ticket.id}</span>
                              {ticket.projectName && (
                                <span>Proyecto: {ticket.projectName}</span>
                              )}
                              <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {ticket.responses?.length || 0} respuestas
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <HeadphonesIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No tienes tickets de soporte</h3>
                <p className="text-muted-foreground mb-4">
                  ¿Necesitas ayuda? Crea tu primer ticket de soporte.
                </p>
                <Button onClick={() => setShowNewTicketDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Ticket
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Removed FAQ, Knowledge Base, and Chat tabs content */}

        </Tabs>

        {/* Ticket Detail Modal */}
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>Ticket #{selectedTicket?.id}</span>
                <Badge variant={getStatusColor(selectedTicket?.status || '')}>
                  {getStatusText(selectedTicket?.status || '')}
                </Badge>
                <Badge variant={getPriorityColor(selectedTicket?.priority || '')}>
                  {getPriorityText(selectedTicket?.priority || '')}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            {selectedTicket && (
              <TicketDetailView 
                ticket={selectedTicket}
                newResponse={newTicketResponse}
                setNewResponse={setNewTicketResponse}
                onSendResponse={(message) => 
                  sendResponseMutation.mutate({ ticketId: selectedTicket.id, message })
                }
                isLoading={sendResponseMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function NewTicketForm({ 
  onSubmit, 
  isLoading 
}: { 
  onSubmit: (data: any) => void; 
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "general",
    projectId: undefined as number | undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Categoría</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">Consulta General</SelectItem>
              <SelectItem value="technical">Soporte Técnico</SelectItem>
              <SelectItem value="billing">Facturación</SelectItem>
              <SelectItem value="project">Proyectos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Prioridad</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
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
      </div>

      <div>
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Describe brevemente el problema"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Descripción Detallada</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe detalladamente el problema o consulta..."
          rows={6}
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creando..." : "Crear Ticket"}
        </Button>
      </div>
    </form>
  );
}

function TicketDetailView({ 
  ticket, 
  newResponse, 
  setNewResponse, 
  onSendResponse, 
  isLoading 
}: {
  ticket: Ticket;
  newResponse: string;
  setNewResponse: (value: string) => void;
  onSendResponse: (message: string) => void;
  isLoading: boolean;
}) {
  const handleSendResponse = () => {
    if (!newResponse.trim()) return;
    onSendResponse(newResponse);
  };

  return (
    <div className="space-y-6">
      {/* Ticket Info */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">{ticket.title}</h3>
        <p className="text-muted-foreground mb-4">{ticket.description}</p>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>Creado: {new Date(ticket.createdAt).toLocaleString()}</span>
          {ticket.projectName && <span>Proyecto: {ticket.projectName}</span>}
        </div>
      </div>

      {/* Responses */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        <h4 className="font-medium">Conversación</h4>
        {ticket.responses?.map((response: TicketResponse) => (
          <div key={response.id} className={`flex space-x-3 ${
            response.isFromSupport ? 'flex-row-reverse space-x-reverse' : ''
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              response.isFromSupport ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              <span className="text-sm font-medium">
                {response.author.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className={`flex-1 ${response.isFromSupport ? 'text-right' : ''}`}>
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium">{response.author}</span>
                <Badge variant="outline" className="text-xs">
                  {response.role}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(response.createdAt).toLocaleString()}
                </span>
              </div>
              <div className={`p-3 rounded-lg ${
                response.isFromSupport 
                  ? 'bg-primary text-primary-foreground ml-8' 
                  : 'bg-muted mr-8'
              }`}>
                <p className="text-sm">{response.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Send Response */}
      {ticket.status !== 'closed' && (
        <div className="space-y-3">
          <Label htmlFor="response">Tu Respuesta</Label>
          <Textarea
            id="response"
            value={newResponse}
            onChange={(e) => setNewResponse(e.target.value)}
            placeholder="Escribe tu respuesta..."
            rows={3}
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleSendResponse}
              disabled={!newResponse.trim() || isLoading}
            >
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? "Enviando..." : "Enviar Respuesta"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Removed KnowledgeBaseSection and LiveChatSection components