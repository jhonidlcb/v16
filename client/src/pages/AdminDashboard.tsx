import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { apiRequest } from "@/lib/api";
import type { User } from "@shared/schema";
import {
  Users,
  Handshake,
  FolderOpen,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Settings,
  AlertCircle,
  Mail,
} from "lucide-react";

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { stats: adminStats, users, isLoading, error } = useAdmin();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreatePartnerDialog, setShowCreatePartnerDialog] = useState(false);
  const [isTestingEmails, setIsTestingEmails] = useState(false);

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: number; updates: Partial<User> }) => {
      const response = await apiRequest("PUT", `/api/users/${userId}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast({
        title: "Usuario actualizado",
        description: "Los datos del usuario han sido actualizados exitosamente.",
      });
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar",
        description: error.message || "No se pudo actualizar el usuario",
        variant: "destructive",
      });
    },
  });

  const createPartnerMutation = useMutation({
    mutationFn: async ({ userId, commissionRate }: { userId: number; commissionRate: string }) => {
      const response = await apiRequest("POST", "/api/partners", { userId, commissionRate });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast({
        title: "Partner creado",
        description: "El usuario ha sido convertido en partner exitosamente.",
      });
      setShowCreatePartnerDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear partner",
        description: error.message || "No se pudo crear el partner",
        variant: "destructive",
      });
    },
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
  };

  const handleUpdateUser = (updates: Partial<User>) => {
    if (selectedUser) {
      updateUserMutation.mutate({ userId: selectedUser.id, updates });
    }
  };

  const handleTestEmailFlow = async () => {
    setIsTestingEmails(true);
    try {
      const response = await apiRequest("POST", "/api/test-email-flow", {});

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "🧪 Prueba de Emails Iniciada",
          description: "Revisa tu email y los logs del servidor. Los cambios de estado ocurren cada 2 segundos.",
        });
      } else {
        const result = await response.json();
        toast({
          title: "Error en prueba",
          description: result.message || "Error al iniciar prueba de emails",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive",
      });
    } finally {
      setIsTestingEmails(false);
    }
  };

  // Manejo de estado de carga
  if (isLoading) {
    return (
      <DashboardLayout title="Panel de Administración">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
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

  // Manejo de errores
  if (error) {
    console.error("Error en AdminDashboard:", error);
    return (
      <DashboardLayout title="Panel de Administración">
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h3 className="text-lg font-semibold">Error al cargar el dashboard</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Ocurrió un error al cargar los datos del panel de administración. Por favor, actualiza la página.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Actualizar página
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Asegurar valores por defecto seguros
  const safeStats = adminStats || {
    totalUsers: "0",
    activePartners: "0",
    totalProjects: "0",
    monthlyRevenue: "$0"
  };

  const statsCards = [
    {
      title: "Total Usuarios",
      value: safeStats.totalUsers,
      icon: Users,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Partners Activos",
      value: safeStats.activePartners,
      icon: Handshake,
      color: "bg-chart-2/10 text-chart-2",
    },
    {
      title: "Proyectos Activos",
      value: safeStats.totalProjects,
      icon: FolderOpen,
      color: "bg-chart-1/10 text-chart-1",
    },
    {
      title: "Ingresos del Mes",
      value: safeStats.monthlyRevenue,
      icon: DollarSign,
      color: "bg-chart-4/10 text-chart-4",
    },
  ];

  return (
    <DashboardLayout title="Panel de Administración">
      <div className="space-y-6">
        {/* Sección de pruebas */}
        <div className="mb-6">
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-orange-600" />
                Herramientas de Prueba
              </CardTitle>
              <CardDescription>
                Herramientas para probar el funcionamiento del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleTestEmailFlow}
                disabled={isTestingEmails}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isTestingEmails ? "Ejecutando prueba..." : "🧪 Probar Flujo Completo de Emails"}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Crea un proyecto de prueba y simula todo el flujo: creación, cambios de estado, tickets y mensajes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          <Button onClick={() => window.location.href = "/admin/portfolio"} variant="outline" data-testid="button-manage-portfolio">
            <FolderOpen className="h-4 w-4 mr-2" />
            Gestionar Portfolio
          </Button>

          <Button onClick={() => window.location.href = "/admin/work-modalities"} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Modalidades de Trabajo
          </Button>

          <Dialog open={showCreatePartnerDialog} onOpenChange={setShowCreatePartnerDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-partner">
                <Plus className="h-4 w-4 mr-2" />
                Crear Partner
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Partner</DialogTitle>
              </DialogHeader>
              <CreatePartnerForm
                users={users?.filter(u => u.role === 'client') || []}
                onSubmit={(userId, commissionRate) =>
                  createPartnerMutation.mutate({ userId, commissionRate })
                }
                isLoading={createPartnerMutation.isPending}
              />
            </DialogContent>
          </Dialog>

          <Button onClick={() => window.location.href = "/admin/invoices"} variant="outline" data-testid="button-manage-invoices">
            <DollarSign className="h-4 w-4 mr-2" />
            Gestionar Facturas
          </Button>
        </div>

        {/* Users Management Table */}
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users && users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{user.fullName || 'Usuario sin nombre'}</p>
                              <p className="text-sm text-muted-foreground">{user.email || 'Email no disponible'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : user.role === 'partner' ? 'secondary' : 'outline'}>
                            {user.role || 'Sin rol'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'default' : 'destructive'}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditUser(user)}
                              data-testid={`button-edit-user-${user.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              data-testid={`button-delete-user-${user.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <Users className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No hay usuarios para mostrar</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <EditUserForm
                user={selectedUser}
                onSubmit={handleUpdateUser}
                isLoading={updateUserMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

interface CreatePartnerFormProps {
  users: User[];
  onSubmit: (userId: number, commissionRate: string) => void;
  isLoading: boolean;
}

function CreatePartnerForm({ users, onSubmit, isLoading }: CreatePartnerFormProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [commissionRate, setCommissionRate] = useState("25.00");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId) {
      onSubmit(selectedUserId, commissionRate);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="userId">Seleccionar Usuario</Label>
        <Select onValueChange={(value) => setSelectedUserId(parseInt(value))}>
          <SelectTrigger data-testid="select-user-partner">
            <SelectValue placeholder="Selecciona un usuario" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id.toString()}>
                {user.fullName} ({user.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="commissionRate">Tasa de Comisión (%)</Label>
        <Input
          id="commissionRate"
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={commissionRate}
          onChange={(e) => setCommissionRate(e.target.value)}
          data-testid="input-commission-rate"
        />
      </div>

      <Button type="submit" disabled={!selectedUserId || isLoading} data-testid="button-submit-partner">
        {isLoading ? "Creando..." : "Crear Partner"}
      </Button>
    </form>
  );
}

interface EditUserFormProps {
  user: User;
  onSubmit: (updates: Partial<User>) => void;
  isLoading: boolean;
}

function EditUserForm({ user, onSubmit, isLoading }: EditUserFormProps) {
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="fullName">Nombre Completo</Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          data-testid="input-edit-fullname"
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          data-testid="input-edit-email"
        />
      </div>

      <div>
        <Label htmlFor="role">Rol</Label>
        <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as any })}>
          <SelectTrigger data-testid="select-edit-role">
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
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          data-testid="checkbox-edit-active"
        />
        <Label htmlFor="isActive">Usuario Activo</Label>
      </div>

      <Button type="submit" disabled={isLoading} data-testid="button-submit-edit-user">
        {isLoading ? "Actualizando..." : "Actualizar Usuario"}
      </Button>
    </form>
  );
}