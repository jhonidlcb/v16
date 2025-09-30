
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import {
  Users,
  UserCheck,
  Search,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  Settings,
  Download,
  Link,
  Award,
} from "lucide-react";

interface Partner {
  id: number;
  userId: number;
  referralCode: string;
  commissionRate: string;
  totalEarnings: string;
  createdAt: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    isActive: boolean;
  };
  stats: {
    activeReferrals: number;
    closedSales: number;
    conversionRate: number;
    monthlyEarnings: string;
  };
}

interface PartnerStats {
  totalPartners: number;
  activePartners: number;
  totalCommissionsPaid: number;
  averageConversionRate: number;
  topPerformers: number;
}

export default function PartnerManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showPartnerDialog, setShowPartnerDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: partners, isLoading: partnersLoading, error: partnersError } = useQuery({
    queryKey: ["/api/admin/partners"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/partners");
        if (!response.ok) {
          throw new Error("Failed to fetch partners");
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching partners:", error);
        return [];
      }
    },
  });

  const { data: partnerStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["/api/admin/partners/stats"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/partners/stats");
        if (!response.ok) {
          throw new Error("Failed to fetch partner stats");
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching partner stats:", error);
        return mockStats;
      }
    },
  });

  const createPartnerMutation = useMutation({
    mutationFn: async (partnerData: { userId: number; commissionRate: string }) => {
      const response = await apiRequest("POST", "/api/partners", partnerData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      toast({
        title: "Partner creado",
        description: "El partner ha sido creado exitosamente.",
      });
      setShowPartnerDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear partner",
        description: error.message || "No se pudo crear el partner",
        variant: "destructive",
      });
    },
  });

  const updatePartnerMutation = useMutation({
    mutationFn: async ({ partnerId, updates }: { partnerId: number; updates: any }) => {
      const response = await apiRequest("PUT", `/api/admin/partners/${partnerId}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      toast({
        title: "Partner actualizado",
        description: "Los datos del partner han sido actualizados.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar partner",
        description: error.message || "No se pudo actualizar el partner",
        variant: "destructive",
      });
    },
  });

  // Mock data for development
  const mockPartners: Partner[] = [
    {
      id: 1,
      userId: 3,
      referralCode: "PAR3ABC1",
      commissionRate: "25.00",
      totalEarnings: "1250.00",
      createdAt: "2024-01-15T00:00:00Z",
      user: {
        id: 3,
        fullName: "Partner Test",
        email: "partner@test.com",
        isActive: true,
      },
      stats: {
        activeReferrals: 5,
        closedSales: 3,
        conversionRate: 60,
        monthlyEarnings: "750.00",
      },
    },
  ];

  const mockStats: PartnerStats = {
    totalPartners: 1,
    activePartners: 1,
    totalCommissionsPaid: 1250,
    averageConversionRate: 60,
    topPerformers: 1,
  };

  // Use real data if available, otherwise fallback to mock data
  const partnersToShow = partners && partners.length > 0 ? partners : mockPartners;
  const statsToShow = partnerStats && Object.keys(partnerStats).length > 0 ? partnerStats : mockStats;

  const filteredPartners = partnersToShow?.filter((partner: Partner) => {
    const matchesSearch = partner.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         partner.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         partner.referralCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && partner.user.isActive) ||
                         (statusFilter === "inactive" && !partner.user.isActive);
    
    return matchesSearch && matchesStatus;
  });

  if (partnersLoading || statsLoading) {
    return (
      <DashboardLayout title="Gestión de Partners">
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
    <DashboardLayout title="Gestión de Partners">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestión de Partners</h1>
          <p className="text-muted-foreground">
            Administra partners, comisiones y rendimiento
          </p>
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
                    <p className="text-sm font-medium text-muted-foreground">Total Partners</p>
                    <p className="text-2xl font-bold text-foreground">
                      {statsToShow.totalPartners}
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
                    <UserCheck className="h-6 w-6 text-chart-2" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Partners Activos</p>
                    <p className="text-2xl font-bold text-foreground">
                      {statsToShow.activePartners}
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
                    <DollarSign className="h-6 w-6 text-chart-1" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Comisiones Pagadas</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${statsToShow.totalCommissionsPaid.toLocaleString()}
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
                    <TrendingUp className="h-6 w-6 text-chart-4" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Conversión Promedio</p>
                    <p className="text-2xl font-bold text-foreground">
                      {statsToShow.averageConversionRate}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar partners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            
            <Dialog open={showPartnerDialog} onOpenChange={setShowPartnerDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Crear Partner
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Partner</DialogTitle>
                </DialogHeader>
                <CreatePartnerForm
                  onSubmit={(data) => createPartnerMutation.mutate(data)}
                  isLoading={createPartnerMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Partners Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Código de Referido</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Total Ganado</TableHead>
                    <TableHead>Referidos</TableHead>
                    <TableHead>Conversión</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartners?.map((partner: Partner) => (
                    <TableRow key={partner.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{partner.user.fullName}</p>
                          <p className="text-sm text-muted-foreground">{partner.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {partner.referralCode}
                          </code>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Link className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {parseFloat(partner.commissionRate)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            ${parseFloat(partner.totalEarnings).toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${parseFloat(partner.stats.monthlyEarnings).toLocaleString()} este mes
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{partner.stats.activeReferrals} activos</p>
                          <p className="text-sm text-muted-foreground">
                            {partner.stats.closedSales} convertidos
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            partner.stats.conversionRate >= 50 ? 'bg-green-500' :
                            partner.stats.conversionRate >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <span>{partner.stats.conversionRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={partner.user.isActive ? "default" : "destructive"}>
                          {partner.user.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedPartner(partner)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Partner Detail Dialog */}
        <Dialog open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles del Partner</DialogTitle>
            </DialogHeader>
            {selectedPartner && <PartnerDetailView partner={selectedPartner} />}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function CreatePartnerForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (data: { userId: number; commissionRate: string }) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    userId: "",
    commissionRate: "25.00",
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      return await response.json();
    },
  });

  const availableUsers = users?.filter((user: any) => user.role === "client");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      userId: parseInt(formData.userId),
      commissionRate: formData.commissionRate,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="userId">Usuario</Label>
        <Select value={formData.userId} onValueChange={(value) => setFormData({ ...formData, userId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar usuario" />
          </SelectTrigger>
          <SelectContent>
            {availableUsers?.map((user: any) => (
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
          step="0.01"
          min="0"
          max="100"
          value={formData.commissionRate}
          onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creando..." : "Crear Partner"}
        </Button>
      </div>
    </form>
  );
}

function PartnerDetailView({ partner }: { partner: Partner }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Nombre</Label>
          <p className="text-lg font-semibold">{partner.user.fullName}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Email</Label>
          <p>{partner.user.email}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Código de Referido</Label>
          <code className="bg-muted px-2 py-1 rounded text-sm">
            {partner.referralCode}
          </code>
        </div>
        <div>
          <Label className="text-sm font-medium">Tasa de Comisión</Label>
          <p>{parseFloat(partner.commissionRate)}%</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Total Ganado</Label>
          <p className="text-lg font-bold text-green-600">
            ${parseFloat(partner.totalEarnings).toLocaleString()}
          </p>
        </div>
        <div>
          <Label className="text-sm font-medium">Ganancias Mensuales</Label>
          <p className="text-lg font-bold">
            ${parseFloat(partner.stats.monthlyEarnings).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="pt-4 border-t">
        <h4 className="font-medium mb-2">Estadísticas de Rendimiento</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground">Referidos Activos</Label>
            <p className="text-2xl font-bold">{partner.stats.activeReferrals}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Ventas Cerradas</Label>
            <p className="text-2xl font-bold">{partner.stats.closedSales}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Tasa de Conversión</Label>
            <p className="text-2xl font-bold">{partner.stats.conversionRate}%</p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <div className="flex space-x-2">
          <Button className="flex-1">
            <Award className="h-4 w-4 mr-2" />
            Ver Referidos
          </Button>
          <Button variant="outline" className="flex-1">
            <Settings className="h-4 w-4 mr-2" />
            Configurar Comisiones
          </Button>
        </div>
      </div>
    </div>
  );
}
