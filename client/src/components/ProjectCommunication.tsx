import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiRequest } from "@/lib/api";
import { Send, MessageCircle, User } from "lucide-react";

interface ProjectMessage {
  id: number;
  message: string;
  fullName: string;
  role: string;
  createdAt: string;
}

interface ProjectCommunicationProps {
  projectId?: number;
}

export default function ProjectCommunication({ projectId }: ProjectCommunicationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const { lastMessage } = useWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "messages"],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await apiRequest("GET", `/api/projects/${projectId}/messages`);
      return await response.json();
    },
    enabled: !!projectId,
  });

  // Scroll automático hacia abajo cuando hay nuevos mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Actualizar mensajes automáticamente cuando llegue una notificación por WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'notification' && lastMessage.data) {
      const notification = lastMessage.data;
      // Si es una notificación de nuevo mensaje, refrescar los mensajes
      if (notification.title?.includes('💬 Nuevo Mensaje') && projectId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/projects", projectId, "messages"] 
        });
      }
    }
  }, [lastMessage, projectId, queryClient]);

  // Scroll automático cuando cambian los mensajes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/messages`, {
        message,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "messages"] });
      setNewMessage("");
      toast({
        title: "Mensaje enviado",
        description: "Tu respuesta ha sido enviada al cliente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al enviar mensaje",
        description: error.message || "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage);
  };

  if (!projectId) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Selecciona un proyecto para ver la comunicación</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse h-16 bg-muted rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {messages?.length ? (
          <>
            {messages
              .sort((a: ProjectMessage, b: ProjectMessage) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              )
              .map((message: ProjectMessage) => (
                <div key={message.id} className="flex space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {message.role === 'admin' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-medium">
                        {message.fullName ? message.fullName.split(' ').map(n => n[0]).join('') : 'C'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">{message.fullName}</span>
                      <Badge variant={message.role === 'admin' ? 'default' : 'outline'}>
                        {message.role === 'admin' ? 'Admin' : 'Cliente'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className={`p-3 rounded-lg ${
                      message.role === 'admin' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay mensajes aún</p>
            <p className="text-sm text-muted-foreground">Envía el primer mensaje al cliente</p>
          </div>
        )}
      </div>

      {/* Send Message */}
      <div className="space-y-4 border-t pt-4">
        <div className="bg-primary/5 p-3 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Respondiendo como administrador</strong> - El cliente recibirá una notificación
          </p>
        </div>
        <Textarea
          placeholder="Escribe tu respuesta al cliente..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            {sendMessageMutation.isPending ? "Enviando..." : "Enviar Respuesta"}
          </Button>
        </div>
      </div>
    </div>
  );
}