import { useState, useEffect } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { apiRequest } from "@/lib/api";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  Mail,
  Calendar,
  MoreVertical,
  Download,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  projectsCount?: number;
  ticketsCount?: number;
  whatsappNumber?: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  clientUsers: number;
  partnerUsers: number;
  newUsersThisMonth: number;
}

export default function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { isConnected } = useWebSocket();

  // Users data viene del hook useAdmin

  // Importar desde useAdmin hook que ya maneja user stats
  const { users, isLoading: usersLoading, userStats, refetchUsers, refetchUserStats } = useAdmin();

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchUsers();
      refetchUserStats();
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchUsers, refetchUserStats]);

  // Manual refresh function
  const handleManualRefresh = async () => {
    await Promise.all([refetchUsers(), refetchUserStats()]);
    setLastUpdate(new Date());
    toast({
      title: "Datos actualizados",
      description: "La información de usuarios ha sido actualizada",
    });
  };

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: number; updates: Partial<User> }) => {
      const response = await apiRequest("PUT", `/api/users/${userId}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuario actualizado",
        description: "Los datos del usuario han sido actualizados exitosamente.",
      });
      setShowEditDialog(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar usuario",
        description: error.message || "No se pudo actualizar el usuario",
        variant: "destructive",
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      const response = await apiRequest("PUT", `/api/users/${userId}`, { isActive });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Estado actualizado",
        description: "El estado del usuario ha sido actualizado.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar estado",
        description: error.message || "No se pudo actualizar el estado del usuario",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      refetchUsers();
      refetchUserStats();
      toast({
        title: "Usuario eliminado",
        description: "El usuario y todos sus datos han sido eliminados exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar usuario",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    },
  });

  const handleDeleteUser = async (user: User) => {
    // Prevent deleting yourself
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (currentUser.id === user.id) {
      toast({
        title: "Error",
        description: "No puedes eliminar tu propia cuenta",
        variant: "destructive",
      });
      return;
    }

    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar a ${user.fullName}?\n\n` +
      `Esta acción eliminará:\n` +
      `• Todos sus proyectos y datos relacionados\n` +
      `• Todos sus tickets y mensajes\n` +
      `• Todo su historial de pagos\n` +
      `• Todas sus notificaciones\n` +
      `• Si es partner, todos sus referidos\n\n` +
      `⚠️ Esta acción NO se puede deshacer.`
    );

    if (confirmed) {
      try {
        await deleteUserMutation.mutateAsync(user.id);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const filteredUsers = users?.filter((user: User) => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" ||
                         (statusFilter === "active" && user.isActive) ||
                         (statusFilter === "inactive" && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'partner':
        return 'default';
      case 'client':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'partner':
        return 'Partner';
      case 'client':
        return 'Cliente';
      default:
        return role;
    }
  };

  // Usar stats reales de la API
  const realStats: UserStats = userStats ? {
    totalUsers: userStats.totalUsers,
    activeUsers: userStats.activeUsers,
    inactiveUsers: userStats.inactiveUsers || userStats.totalUsers - userStats.activeUsers,
    adminUsers: userStats.adminUsers,
    clientUsers: userStats.clientUsers,
    partnerUsers: userStats.partnerUsers,
    newUsersThisMonth: userStats.newUsersThisMonth,
  } : {
    totalUsers: users?.length || 0,
    activeUsers: users?.filter((u: User) => u.isActive).length || 0,
    inactiveUsers: users?.filter((u: User) => !u.isActive).length || 0,
    adminUsers: users?.filter((u: User) => u.role === 'admin').length || 0,
    clientUsers: users?.filter((u: User) => u.role === 'client').length || 0,
    partnerUsers: users?.filter((u: User) => u.role === 'partner').length || 0,
    newUsersThisMonth: 0,
  };

  if (usersLoading) {
    return (
      <DashboardLayout title="Gestión de Usuarios">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Gestión de Usuarios">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">
              Administra usuarios, roles y permisos del sistema
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {isConnected ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-500" />
                )}
                {isConnected ? "Conectado" : "Desconectado"}
              </div>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                Última actualización: {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={usersLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${usersLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-lg">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                </DialogHeader>
                <CreateUserForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Usuarios</p>
                    <p className="text-2xl font-bold text-foreground">
                      {realStats.totalUsers}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-lg bg-chart-2/10 flex items-center justify-center">
                    <Eye className="h-6 w-6 text-chart-2" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Activos</p>
                    <p className="text-2xl font-bold text-foreground">
                      {realStats.activeUsers}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-lg bg-chart-1/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-chart-1" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Administradores</p>
                    <p className="text-2xl font-bold text-foreground">
                      {realStats.adminUsers}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-lg bg-chart-4/10 flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-chart-4" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Nuevos (Este Mes)</p>
                    <p className="text-2xl font-bold text-foreground">
                      {realStats.newUsersThisMonth}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>

            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Todos los roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                  <SelectItem value="client">Clientes</SelectItem>
                  <SelectItem value="partner">Partners</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Button variant="outline" className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-lg">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                </DialogHeader>
                <CreateUserForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Usuario</TableHead>
                    <TableHead className="min-w-[100px]">Rol</TableHead>
                    <TableHead className="min-w-[120px]">Estado</TableHead>
                    <TableHead className="min-w-[140px] hidden sm:table-cell">Registro</TableHead>
                    <TableHead className="min-w-[140px] hidden md:table-cell">Último Acceso</TableHead>
                    <TableHead className="min-w-[100px] hidden lg:table-cell">Proyectos</TableHead>
                    <TableHead className="min-w-[120px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      </TableRow>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        No se encontraron usuarios que coincidan con los filtros.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers?.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.fullName}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleColor(user.role)}>
                            {getRoleText(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={user.isActive}
                              onCheckedChange={(checked) =>
                                toggleUserStatusMutation.mutate({
                                  userId: user.id,
                                  isActive: checked,
                                })
                              }
                            />
                            <span className="text-sm">
                              {user.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="text-sm">
                            <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                            <div className="text-muted-foreground">
                              {new Date(user.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-sm text-muted-foreground">
                            {user.lastLogin
                              ? new Date(user.lastLogin).toLocaleDateString()
                              : "Nunca"
                            }
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="text-sm">
                            <div>{user.projectsCount || 0} proyectos</div>
                            <div className="text-muted-foreground">
                              {user.ticketsCount || 0} tickets
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowEditDialog(true);
                              }}
                              title="Editar usuario"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedUser(user)}
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteUser(user);
                              }}
                              disabled={deleteUserMutation.isPending}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Eliminar usuario"
                            >
                              {deleteUserMutation.isPending ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <EditUserForm
                user={selectedUser}
                onSubmit={(updates) =>
                  updateUserMutation.mutate({
                    userId: selectedUser.id,
                    updates,
                  })
                }
                isLoading={updateUserMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* User Detail Dialog */}
        <Dialog open={!!selectedUser && !showEditDialog} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles del Usuario</DialogTitle>
            </DialogHeader>
            {selectedUser && <UserDetailView user={selectedUser} />}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function CreateUserForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "client",
    password: "",
    isActive: true,
    whatsappNumber: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/admin/users", formData);
      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Usuario creado",
          description: "El usuario ha sido creado exitosamente.",
        });

        // Reset form
        setFormData({
          fullName: "",
          email: "",
          role: "client",
          password: "",
          isActive: true,
          whatsappNumber: "",
        });

        // Refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      } else {
        throw new Error(result.message || "Error al crear usuario");
      }
    } catch (error: any) {
      toast({
        title: "Error al crear usuario",
        description: error.message || "No se pudo crear el usuario",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="fullName">Nombre Completo</Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="role">Rol</Label>
        <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="client">Cliente</SelectItem>
            <SelectItem value="partner">Partner</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="whatsappNumber">WhatsApp (+595...)</Label>
        <Input
          id="whatsappNumber"
          placeholder="+595981234567"
          value={formData.whatsappNumber}
          onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label>Usuario activo</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creando..." : "Crear Usuario"}
        </Button>
      </div>
    </form>
  );
}

function EditUserForm({
  user,
  onSubmit,
  isLoading,
}: {
  user: User;
  onSubmit: (updates: Partial<User>) => void;
  isLoading: boolean;
}) {
  const [editingUser, setEditingUser] = useState({
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    whatsappNumber: user.whatsappNumber || "", // Initialize whatsappNumber
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(editingUser);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="fullName">Nombre Completo</Label>
        <Input
          id="fullName"
          value={editingUser?.fullName || ""}
          onChange={(e) =>
            setEditingUser(prev => ({
              ...prev!,
              fullName: e.target.value
            }))
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsappNumber">WhatsApp (+595...)</Label>
        <Input
          id="whatsappNumber"
          placeholder="+595981234567"
          value={editingUser?.whatsappNumber || ""}
          onChange={(e) =>
            setEditingUser(prev => ({
              ...prev!,
              whatsappNumber: e.target.value
            }))
          }
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={editingUser.email}
          onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="role">Rol</Label>
        <Select value={editingUser.role} onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="client">Cliente</SelectItem>
            <SelectItem value="partner">Partner</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={editingUser.isActive}
          onCheckedChange={(checked) => setEditingUser({ ...editingUser, isActive: checked })}
        />
        <Label>Usuario activo</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Actualizando..." : "Actualizar Usuario"}
        </Button>
      </div>
    </form>
  );
}

function UserDetailView({ user }: { user: User }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Nombre Completo</Label>
          <p className="text-lg font-semibold">{user.fullName}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Email</Label>
          <p>{user.email}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Rol</Label>
          <Badge variant="outline">{user.role}</Badge>
        </div>
        <div>
          <Label className="text-sm font-medium">Estado</Label>
          <Badge variant={user.isActive ? "default" : "destructive"}>
            {user.isActive ? "Activo" : "Inactivo"}
          </Badge>
        </div>
        <div>
          <Label className="text-sm font-medium">Fecha de Registro</Label>
          <p>{new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Última Actualización</Label>
          <p>{new Date(user.updatedAt).toLocaleDateString()}</p>
        </div>
        {user.whatsappNumber && (
          <div>
            <Label className="text-sm font-medium">WhatsApp</Label>
            <p>{user.whatsappNumber}</p>
          </div>
        )}
      </div>

      <div className="pt-4 border-t">
        <h4 className="font-medium mb-2">Estadísticas</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground">Proyectos Totales</Label>
            <p className="text-2xl font-bold">{user.projectsCount || 0}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Tickets Creados</Label>
            <p className="text-2xl font-bold">{user.ticketsCount || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}