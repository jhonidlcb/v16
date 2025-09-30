import { useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { usePartner } from "@/hooks/usePartner";
import {
  DollarSign,
  Users,
  Handshake,
  TrendingUp,
  Copy,
  Calculator,
  Download,
  ExternalLink,
} from "lucide-react";

export default function PartnerDashboard() {
  const { toast } = useToast();
  const { partner, referrals, isLoading } = usePartner();
  const [calculatorAmount, setCalculatorAmount] = useState<string>("");

  const copyReferralLink = () => {
    if (partner?.referralCode) {
      const link = `${window.location.origin}/ref/${partner.referralCode}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "Enlace copiado",
        description: "El enlace de referido ha sido copiado al portapapeles",
      });
    }
  };

  const calculateCommission = (amount: number) => {
    if (!partner?.commissionRate) return 0;
    return (amount * parseFloat(partner.commissionRate)) / 100;
  };

  const statsCards = [
    {
      title: "Ganancias Totales",
      value: `$${partner?.totalEarnings || "0.00"}`,
      icon: DollarSign,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Referencias Activas",
      value: partner?.activeReferrals || 0,
      icon: Users,
      color: "bg-chart-2/10 text-chart-2",
    },
    {
      title: "Ventas Cerradas",
      value: partner?.closedSales || 0,
      icon: Handshake,
      color: "bg-chart-1/10 text-chart-1",
    },
    {
      title: "Tasa de Conversión",
      value: `${partner?.conversionRate || 0}%`,
      icon: TrendingUp,
      color: "bg-chart-4/10 text-chart-4",
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard de Partner">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-40 bg-muted rounded"></div>
              </CardContent>
            </Card>
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-40 bg-muted rounded"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard de Partner">
      <div className="space-y-6">
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

        {/* Referral Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Referral Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Tu Enlace de Referido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                  <input
                    type="text"
                    value={partner?.referralCode ? `${window.location.origin}/ref/${partner.referralCode}` : ""}
                    readOnly
                    className="flex-1 bg-transparent text-foreground font-mono text-sm"
                    data-testid="input-referral-link"
                  />
                  <Button size="sm" onClick={copyReferralLink} data-testid="button-copy-referral">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Comparte este enlace para ganar comisiones del {partner?.commissionRate || 25}% por cada venta
                </p>
                
                <div className="mt-4 flex space-x-2">
                  <Button variant="outline" size="sm" data-testid="button-download-materials">
                    <Download className="h-4 w-4 mr-2" />
                    Material de Marketing
                  </Button>
                  <Button variant="outline" size="sm" data-testid="button-share-social">
                    Compartir en Redes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Earnings Calculator */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Calculadora de Ganancias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="projectPrice">Precio del Proyecto (USD)</Label>
                    <Input
                      id="projectPrice"
                      type="number"
                      placeholder="5000"
                      value={calculatorAmount}
                      onChange={(e) => setCalculatorAmount(e.target.value)}
                      data-testid="input-calculator-amount"
                    />
                  </div>
                  
                  <div className="p-4 bg-primary/5 rounded-md border border-primary/20">
                    <p className="text-sm text-muted-foreground">Tu comisión estimada:</p>
                    <p className="text-2xl font-bold text-primary" data-testid="text-estimated-commission">
                      ${calculatorAmount ? calculateCommission(parseFloat(calculatorAmount)).toFixed(2) : "0.00"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Basado en {partner?.commissionRate || 25}% de comisión
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Referrals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Referencias Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {referrals && referrals.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Valor Proyecto</TableHead>
                        <TableHead>Tu Comisión</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referrals.map((referral) => (
                        <TableRow key={referral.id} data-testid={`referral-row-${referral.id}`}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">
                                {referral.clientName || "Cliente"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {referral.clientEmail}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                referral.status === 'paid' ? 'default' :
                                referral.status === 'converted' ? 'secondary' : 'outline'
                              }
                            >
                              {referral.status === 'paid' ? 'Pagado' :
                               referral.status === 'converted' ? 'Convertido' : 'Pendiente'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            ${referral.projectPrice || "0.00"}
                          </TableCell>
                          <TableCell className="font-bold text-primary">
                            ${referral.commissionAmount || "0.00"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(referral.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground mb-2">No hay referencias aún</p>
                  <p className="text-muted-foreground">
                    Comparte tu enlace de referido para comenzar a generar comisiones
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
