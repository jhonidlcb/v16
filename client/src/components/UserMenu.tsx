import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import ProfileSettingsModal from "@/components/ProfileSettingsModal";
import {
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  BellRing,
} from "lucide-react";

export default function UserMenu() {
  const { user } = useAuth();
  const { toast } = useToast();
  const logoutMutation = useLogout();
  const { isConnected, lastMessage, notifications, clearNotifications, markAsRead, unreadCount } = useWebSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  // Debug: Log WebSocket status and notifications
  useEffect(() => {
    console.log('🔔 UserMenu WebSocket Status:', {
      isConnected,
      notificationsCount: notifications?.length || 0,
      unreadCount,
      lastMessage: lastMessage?.type,
      notifications: notifications
    });
  }, [isConnected, notifications, lastMessage, unreadCount]);


  const handleLogout = async () => {
    try {
      toast({
        title: "Cerrando sesión...",
        description: "Redirigiendo al inicio",
      });
      await logoutMutation.mutateAsync();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cerrar sesión",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "partner":
        return "Partner";
      case "client":
        return "Cliente";
      default:
        return role;
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center space-x-4">
      {/* Notifications */}
      <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
          <DropdownMenuLabel className="flex items-center justify-between">
              Notificaciones
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unreadCount}
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications && notifications.length > 0 ? (
              notifications.slice(0, 5).map((notification, index) => (
                <DropdownMenuItem 
                  key={notification.id || index} 
                  className="flex flex-col items-start p-3 cursor-pointer hover:bg-muted"
                  onClick={() => markAsRead(notification.id || index)}
                >
                  <div className="flex items-center w-full">
                    <div className="font-medium flex-1">{notification.title}</div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{notification.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.createdAt || Date.now()).toLocaleString()}
                  </div>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>
                No hay notificaciones
              </DropdownMenuItem>
            )}
            {notifications && notifications.length > 5 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-center">
                  Ver todas las notificaciones
                </DropdownMenuItem>
              </>
            )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-user-menu">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {getInitials(user.fullName)}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-foreground">{user.fullName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="p-2 border-b">
            <p className="text-sm font-medium">{user.fullName}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <Badge variant="secondary" className="mt-1">
              {getRoleText(user.role)}
            </Badge>
          </div>

          <DropdownMenuItem data-testid="menu-item-profile">
            <User className="h-4 w-4 mr-2" />
            Mi Perfil
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => setShowProfileSettings(true)}
            data-testid="menu-item-settings"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem 
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            data-testid="menu-item-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {logoutMutation.isPending ? "Cerrando..." : "Cerrar Sesión"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal de Configuración de Perfil */}
      <ProfileSettingsModal
        open={showProfileSettings}
        onOpenChange={setShowProfileSettings}
      />
    </div>
  );
}