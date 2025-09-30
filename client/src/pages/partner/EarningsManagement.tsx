import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Calendar,
  Download,
  Eye,
  Share2,
  Gift
} from "lucide-react";

interface Referral {
  id: string;
  clientName: string;
  projectType: string;
  status: "pending" | "converted" | "cancelled";
  referralDate: string;
  commission: number;
  projectValue: number;
}

interface Commission {
  id: string;
  month: string;
  amount: number;
  referrals: number;
  status: "paid" | "pending" | "processing";
  paymentDate?: string;
}

function EarningsManagement() {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data
  const totalEarnings = 2450.00;
  const pendingCommissions = 850.00;
  const totalReferrals = 12;
  const conversionRate = 75;

  const recentReferrals: Referral[] = [
    {
      id: "1",
      clientName: "María González",
      projectType: "E-commerce",
      status: "converted",
      referralDate: "2024-01-15",
      commission: 450.00,
      projectValue: 4500.00
    },
    {
      id: "2", 
      clientName: "Carlos Pérez",
      projectType: "App Móvil",
      status: "pending",
      referralDate: "2024-01-10",
      commission: 600.00,
      projectValue: 6000.00
    },
    {
      id: "3",
      clientName: "Ana Rodríguez",
      projectType: "Web Corporativa",
      status: "converted",
      referralDate: "2024-01-05",
      commission: 300.00,
      projectValue: 3000.00
    }
  ];

  const commissionHistory: Commission[] = [
    {
      id: "1",
      month: "Enero 2024",
      amount: 1200.00,
      referrals: 4,
      status: "paid",
      paymentDate: "2024-02-01"
    },
    {
      id: "2",
      month: "Diciembre 2023", 
      amount: 850.00,
      referrals: 3,
      status: "paid",
      paymentDate: "2024-01-01"
    },
    {
      id: "3",
      month: "Noviembre 2023",
      amount: 400.00,
      referrals: 2,
      status: "paid",
      paymentDate: "2023-12-01"
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      converted: "default", 
      cancelled: "destructive",
      paid: "default",
      processing: "secondary"
    } as const;

    const labels = {
      pending: "Pendiente",
      converted: "Convertido",
      cancelled: "Cancelado", 
      paid: "Pagado",
      processing: "Procesando"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <DashboardLayout title="Gestión de Ganancias">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gestión de Ganancias</h1>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Exportar Reporte
          </Button>
        </div>

        {/* KPIs Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ganado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">+12% vs mes anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comisiones Pendientes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${pendingCommissions.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">A pagar próximo mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referidos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReferrals}</div>
              <p className="text-xs text-muted-foreground">+3 este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate}%</div>
              <Progress value={conversionRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Tabs Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="referrals">Referidos</TabsTrigger>
            <TabsTrigger value="commissions">Comisiones</TabsTrigger>
            <TabsTrigger value="tools">Herramientas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Actividad Reciente</CardTitle>
                  <CardDescription>Últimos referidos y conversiones</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentReferrals.slice(0, 3).map((referral) => (
                      <div key={referral.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{referral.clientName}</p>
                          <p className="text-sm text-muted-foreground">{referral.projectType}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${referral.commission}</p>
                          {getStatusBadge(referral.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento Mensual</CardTitle>
                  <CardDescription>Evolución de tus ganancias</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {commissionHistory.slice(0, 3).map((commission) => (
                      <div key={commission.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{commission.month}</p>
                          <p className="text-sm text-muted-foreground">{commission.referrals} referidos</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${commission.amount}</p>
                          {getStatusBadge(commission.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Referidos</CardTitle>
                <CardDescription>Todos tus referidos y su estado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentReferrals.map((referral) => (
                    <div key={referral.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{referral.clientName}</h3>
                        {getStatusBadge(referral.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Proyecto</p>
                          <p className="font-medium">{referral.projectType}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Fecha</p>
                          <p className="font-medium">{new Date(referral.referralDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Valor Proyecto</p>
                          <p className="font-medium">${referral.projectValue}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Tu Comisión</p>
                          <p className="font-medium text-green-600">${referral.commission}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Comisiones</CardTitle>
                <CardDescription>Detalle de todos tus pagos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {commissionHistory.map((commission) => (
                    <div key={commission.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{commission.month}</h3>
                        {getStatusBadge(commission.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Monto</p>
                          <p className="font-medium text-green-600">${commission.amount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Referidos</p>
                          <p className="font-medium">{commission.referrals}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Estado</p>
                          <p className="font-medium">{commission.status === "paid" ? "Pagado" : "Pendiente"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Fecha Pago</p>
                          <p className="font-medium">
                            {commission.paymentDate ? new Date(commission.paymentDate).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Share2 className="w-5 h-5 mr-2" />
                    Enlace de Referido
                  </CardTitle>
                  <CardDescription>Comparte este enlace para generar comisiones</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-muted rounded border font-mono text-sm">
                      https://softwarepar.lat/ref/abc123xyz
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Previsualizar
                      </Button>
                      <Button size="sm">
                        <Share2 className="w-4 h-4 mr-2" />
                        Copiar Enlace
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Gift className="w-5 h-5 mr-2" />
                    Material Promocional
                  </CardTitle>
                  <CardDescription>Recursos para promocionar SoftwarePar</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Descargar Banners
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Plantillas de Email
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Posts para Redes Sociales
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

export default EarningsManagement;