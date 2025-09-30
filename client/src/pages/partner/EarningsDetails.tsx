
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { CalendarIcon, Download, DollarSign, TrendingUp, Users, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";

interface EarningsData {
  totalEarnings: number;
  monthlyEarnings: number;
  pendingCommissions: number;
  paidCommissions: number;
  conversionRate: number;
  referralsCount: number;
  activeReferrals: number;
}

interface Commission {
  id: number;
  projectName: string;
  clientName: string;
  amount: number;
  status: 'pending' | 'paid' | 'processing';
  date: string;
  paymentDate?: string;
}

export default function EarningsDetails() {
  const { data: earningsData, isLoading: earningsLoading } = useQuery({
    queryKey: ["/api/partner/earnings"],
    queryFn: async (): Promise<EarningsData> => {
      const response = await apiRequest("GET", "/api/partner/earnings");
      return await response.json();
    },
  });

  const { data: commissions, isLoading: commissionsLoading } = useQuery({
    queryKey: ["/api/partner/commissions"],
    queryFn: async (): Promise<Commission[]> => {
      const response = await apiRequest("GET", "/api/partner/commissions");
      return await response.json();
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Pagado</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800">Procesando</Badge>;
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-800">Pendiente</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (earningsLoading) {
    return (
      <DashboardLayout title="Mis Ganancias">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Cargando datos de ganancias...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Mis Ganancias">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Ganado</p>
                  <p className="text-2xl font-bold">${earningsData?.totalEarnings?.toLocaleString() || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Este Mes</p>
                  <p className="text-2xl font-bold">${earningsData?.monthlyEarnings?.toLocaleString() || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Pendiente</p>
                  <p className="text-2xl font-bold">${earningsData?.pendingCommissions?.toLocaleString() || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Conversión</p>
                  <p className="text-2xl font-bold">{earningsData?.conversionRate || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Performance</CardTitle>
            <CardDescription>
              Tu rendimiento como partner en los últimos 30 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Referidos Activos</span>
                  <span>{earningsData?.activeReferrals || 0} / {earningsData?.referralsCount || 0}</span>
                </div>
                <Progress 
                  value={earningsData?.referralsCount ? (earningsData.activeReferrals / earningsData.referralsCount) * 100 : 0} 
                  className="h-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Tasa de Conversión</span>
                  <span>{earningsData?.conversionRate || 0}%</span>
                </div>
                <Progress value={earningsData?.conversionRate || 0} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Tabs */}
        <Tabs defaultValue="commissions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="commissions">Comisiones</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
          </TabsList>

          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Historial de Comisiones</CardTitle>
                    <CardDescription>
                      Todas tus comisiones por referidos exitosos
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {commissionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Cargando comisiones...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Proyecto</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Comisión</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Pago</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions?.map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell className="font-medium">
                            {commission.projectName}
                          </TableCell>
                          <TableCell>{commission.clientName}</TableCell>
                          <TableCell className="text-green-600 font-semibold">
                            ${commission.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>{getStatusBadge(commission.status)}</TableCell>
                          <TableCell>
                            {new Date(commission.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {commission.paymentDate ? 
                              new Date(commission.paymentDate).toLocaleDateString() : 
                              '-'
                            }
                          </TableCell>
                        </TableRow>
                      )) || (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No hay comisiones registradas aún
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics de Performance</CardTitle>
                <CardDescription>
                  Métricas detalladas de tu rendimiento como partner
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Gráficos de analytics en desarrollo</p>
                  <p className="text-sm">Próximamente: gráficos de tendencias y comparativas</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Pagos</CardTitle>
                <CardDescription>
                  Pagos recibidos y programados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Historial de pagos detallado</p>
                  <p className="text-sm">Próximamente: calendario de pagos y detalles bancarios</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
