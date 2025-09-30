
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  FolderOpen,
  Handshake,
  Calendar,
  Target,
  Activity,
  Award,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react";

interface AnalyticsData {
  revenue: {
    total: number;
    monthly: number;
    growth: number;
    chart: Array<{ month: string; revenue: number; projects: number }>;
  };
  users: {
    total: number;
    active: number;
    growth: number;
    chart: Array<{ month: string; users: number; active: number }>;
  };
  projects: {
    total: number;
    completed: number;
    success_rate: number;
    chart: Array<{ status: string; count: number; color: string }>;
  };
  partners: {
    total: number;
    active: number;
    conversion: number;
    earnings: Array<{ partner: string; earnings: number; referrals: number }>;
  };
  kpis: {
    customer_lifetime_value: number;
    churn_rate: number;
    satisfaction_score: number;
    avg_project_value: number;
  };
}

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState("30");
  const [refreshing, setRefreshing] = useState(false);

  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/analytics", dateRange],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/analytics?period=${dateRange}`);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      return await response.json();
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Mock data for development
  const mockAnalytics: AnalyticsData = {
    revenue: {
      total: 45750,
      monthly: 12500,
      growth: 15.3,
      chart: [
        { month: "Ene", revenue: 8500, projects: 3 },
        { month: "Feb", revenue: 9200, projects: 4 },
        { month: "Mar", revenue: 11300, projects: 5 },
        { month: "Abr", revenue: 12500, projects: 6 },
        { month: "May", revenue: 14750, projects: 7 },
        { month: "Jun", revenue: 16200, projects: 8 },
      ],
    },
    users: {
      total: 156,
      active: 89,
      growth: 12.8,
      chart: [
        { month: "Ene", users: 120, active: 65 },
        { month: "Feb", users: 128, active: 72 },
        { month: "Mar", users: 135, active: 78 },
        { month: "Abr", users: 142, active: 82 },
        { month: "May", users: 149, active: 86 },
        { month: "Jun", users: 156, active: 89 },
      ],
    },
    projects: {
      total: 42,
      completed: 35,
      success_rate: 83.3,
      chart: [
        { status: "Completados", count: 35, color: "#22c55e" },
        { status: "En Desarrollo", count: 5, color: "#3b82f6" },
        { status: "Pendientes", count: 2, color: "#f59e0b" },
      ],
    },
    partners: {
      total: 12,
      active: 8,
      conversion: 45.2,
      earnings: [
        { partner: "Partner A", earnings: 2250, referrals: 8 },
        { partner: "Partner B", earnings: 1875, referrals: 6 },
        { partner: "Partner C", earnings: 1640, referrals: 5 },
        { partner: "Partner D", earnings: 1420, referrals: 4 },
        { partner: "Partner E", earnings: 1150, referrals: 3 },
      ],
    },
    kpis: {
      customer_lifetime_value: 2850,
      churn_rate: 5.2,
      satisfaction_score: 4.6,
      avg_project_value: 1890,
    },
  };

  const analyticsData = analytics || mockAnalytics;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const exportReport = () => {
    // TODO: Implement PDF/Excel export
    console.log("Exporting analytics report...");
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Analytics Dashboard">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-muted rounded"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Analytics Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Métricas avanzadas y análisis del negocio
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="90">Últimos 90 días</SelectItem>
                <SelectItem value="365">Último año</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            
            <Button onClick={exportReport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${analyticsData.revenue.total.toLocaleString()}
                    </p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-500 font-medium">
                        +{analyticsData.revenue.growth}%
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-500" />
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Usuarios Activos</p>
                    <p className="text-2xl font-bold text-foreground">
                      {analyticsData.users.active}
                    </p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                      <span className="text-sm text-blue-500 font-medium">
                        +{analyticsData.users.growth}%
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-500" />
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tasa de Éxito</p>
                    <p className="text-2xl font-bold text-foreground">
                      {analyticsData.projects.success_rate}%
                    </p>
                    <div className="flex items-center mt-2">
                      <Target className="h-4 w-4 text-purple-500 mr-1" />
                      <span className="text-sm text-muted-foreground">
                        {analyticsData.projects.completed}/{analyticsData.projects.total} proyectos
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Award className="h-6 w-6 text-purple-500" />
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Satisfacción</p>
                    <p className="text-2xl font-bold text-foreground">
                      {analyticsData.kpis.satisfaction_score}/5.0
                    </p>
                    <div className="flex items-center mt-2">
                      <Activity className="h-4 w-4 text-orange-500 mr-1" />
                      <span className="text-sm text-orange-500 font-medium">
                        Excelente
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="revenue">Ingresos</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="projects">Proyectos</TabsTrigger>
            <TabsTrigger value="partners">Partners</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Evolución de Ingresos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData.revenue.chart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, "Ingresos"]} />
                      <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>KPIs Financieros</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Valor Promedio por Proyecto</span>
                      <span className="font-medium">${analyticsData.kpis.avg_project_value}</span>
                    </div>
                    <Progress value={75} className="mt-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Customer Lifetime Value</span>
                      <span className="font-medium">${analyticsData.kpis.customer_lifetime_value}</span>
                    </div>
                    <Progress value={85} className="mt-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Tasa de Abandono</span>
                      <span className="font-medium text-red-500">{analyticsData.kpis.churn_rate}%</span>
                    </div>
                    <Progress value={analyticsData.kpis.churn_rate} className="mt-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Crecimiento de Usuarios</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.users.chart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="active" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Usuarios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total de Usuarios</span>
                    <Badge variant="outline">{analyticsData.users.total}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Usuarios Activos</span>
                    <Badge variant="default">{analyticsData.users.active}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tasa de Actividad</span>
                    <Badge variant="secondary">
                      {Math.round((analyticsData.users.active / analyticsData.users.total) * 100)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estado de Proyectos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.projects.chart}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="count"
                        label={({ status, count }) => `${status}: ${count}`}
                      >
                        {analyticsData.projects.chart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento de Proyectos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Tasa de Finalización</span>
                      <span className="font-medium">{analyticsData.projects.success_rate}%</span>
                    </div>
                    <Progress value={analyticsData.projects.success_rate} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Proyectos Completados</span>
                      <span className="font-medium">{analyticsData.projects.completed}</span>
                    </div>
                    <Progress value={(analyticsData.projects.completed / analyticsData.projects.total) * 100} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="partners" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Partners por Ganancias</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.partners.earnings}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="partner" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, "Ganancias"]} />
                      <Bar dataKey="earnings" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas de Partners</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Partners</span>
                    <Badge variant="outline">{analyticsData.partners.total}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Partners Activos</span>
                    <Badge variant="default">{analyticsData.partners.active}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Conversión Promedio</span>
                    <Badge variant="secondary">{analyticsData.partners.conversion}%</Badge>
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
