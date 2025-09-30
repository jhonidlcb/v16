
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import {
  DollarSign,
  Plus,
  Eye,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
} from "lucide-react";

interface Invoice {
  id: number;
  invoiceNumber: string;
  projectName: string;
  clientName: string;
  amount: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

interface Project {
  id: number;
  name: string;
  clientId: number;
  clientName: string;
  price: string;
  status: string;
}

export default function InvoiceManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/admin/invoices"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/invoices");
      if (!response.ok) throw new Error('Error al cargar facturas');
      return await response.json();
    },
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/admin/projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/projects");
      if (!response.ok) throw new Error('Error al cargar proyectos');
      return await response.json();
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: { projectId: number; amount: string; dueDate: string }) => {
      const response = await apiRequest("POST", "/api/admin/invoices", invoiceData);
      if (!response.ok) throw new Error('Error al crear factura');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({
        title: "Factura creada",
        description: "La factura ha sido creada exitosamente.",
      });
      setShowCreateDialog(false);
      setSelectedProject(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear factura",
        description: error.message || "No se pudo crear la factura",
        variant: "destructive",
      });
    },
  });

  const updateInvoiceStatusMutation = useMutation({
    mutationFn: async ({ invoiceId, status }: { invoiceId: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/admin/invoices/${invoiceId}`, { status });
      if (!response.ok) throw new Error('Error al actualizar factura');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({
        title: "Estado actualizado",
        description: "El estado de la factura ha sido actualizado.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar",
        description: error.message || "No se pudo actualizar la factura",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pagado';
      case 'pending':
        return 'Pendiente';
      case 'overdue':
        return 'Vencido';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const amount = formData.get('amount') as string;
    const dueDate = formData.get('dueDate') as string;

    createInvoiceMutation.mutate({
      projectId: selectedProject.id,
      amount,
      dueDate,
    });
  };

  // Calculate stats
  const stats = {
    total: invoices?.length || 0,
    pending: invoices?.filter((inv: Invoice) => inv.status === 'pending').length || 0,
    paid: invoices?.filter((inv: Invoice) => inv.status === 'paid').length || 0,
    totalRevenue: invoices?.reduce((sum: number, inv: Invoice) => 
      inv.status === 'paid' ? sum + parseFloat(inv.amount) : sum, 0) || 0,
  };

  if (invoicesLoading || projectsLoading) {
    return (
      <DashboardLayout title="Gestión de Facturas">
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
    <DashboardLayout title="Gestión de Facturas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Facturas</h1>
            <p className="text-muted-foreground">
              Administra las facturas y pagos de todos los proyectos
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Crear Factura
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Factura</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div>
                  <Label htmlFor="project">Proyecto</Label>
                  <Select 
                    onValueChange={(value) => {
                      const project = projects?.find((p: Project) => p.id === parseInt(value));
                      setSelectedProject(project || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((project: Project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name} - {project.clientName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProject && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Cliente:</strong> {selectedProject.clientName}
                    </p>
                    <p className="text-sm">
                      <strong>Precio del proyecto:</strong> ${selectedProject.price}
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="amount">Monto</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={selectedProject?.price || ''}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createInvoiceMutation.isPending || !selectedProject}
                  >
                    {createInvoiceMutation.isPending ? "Creando..." : "Crear Factura"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Facturas</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
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
                  <div className="w-12 h-12 rounded-lg bg-chart-1/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-chart-1" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
                    <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
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
                  <div className="w-12 h-12 rounded-lg bg-chart-2/10 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-chart-2" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Pagadas</p>
                    <p className="text-2xl font-bold text-foreground">{stats.paid}</p>
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
                  <div className="w-12 h-12 rounded-lg bg-chart-3/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-chart-3" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${stats.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Todas las Facturas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices?.map((invoice: Invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>{invoice.clientName}</TableCell>
                      <TableCell>{invoice.projectName}</TableCell>
                      <TableCell className="font-bold">
                        ${parseFloat(invoice.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(invoice.status)}>
                          {getStatusText(invoice.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                          {invoice.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateInvoiceStatusMutation.mutate({
                                invoiceId: invoice.id,
                                status: 'paid'
                              })}
                              disabled={updateInvoiceStatusMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Marcar Pagado
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {(!invoices || invoices.length === 0) && (
                <div className="text-center py-12">
                  <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No hay facturas</h3>
                  <p className="text-muted-foreground mb-4">
                    Comienza creando una factura para un proyecto
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
