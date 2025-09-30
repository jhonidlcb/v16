import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import {
  DollarSign,
  Download,
  Eye,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Receipt,
} from "lucide-react";

interface Invoice {
  id: number;
  invoiceNumber: string;
  projectName: string;
  amount: number | string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  dueDate: string;
  paidAt?: string;
  createdAt: string;
  downloadUrl?: string;
  stageName?: string;
  stagePercentage?: number;
  type?: 'stage_payment' | 'traditional';
}

interface PaymentMethod {
  id: number;
  type: 'card' | 'bank_transfer';
  details?: {
    last4?: string;
    brand?: string;
    expiryDate?: string;
    bankName?: string;
    accountNumber?: string;
  }
  isDefault: boolean;
}

interface Transaction {
  id: number;
  type: 'payment' | 'refund' | 'fee';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  invoiceId?: number;
  paymentMethodId?: number;
}

export default function BillingDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { data: billingData, isLoading: billingLoading } = useQuery({
    queryKey: ["/api/client/billing"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/client/billing");
      return await response.json();
    },
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/client/invoices"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/client/invoices");
      return await response.json();
    },
  });

  

  const downloadInvoice = async (invoice: Invoice) => {
    try {
      let downloadUrl = `/api/client/invoices/${invoice.id}/download`;
      
      // Si es una factura de etapa de pago, usar endpoint específico
      if (invoice.type === 'stage_payment') {
        downloadUrl = `/api/client/stage-invoices/${invoice.id}/download`;
      }
      
      console.log(`Descargando factura desde: ${downloadUrl}`);
      
      const response = await apiRequest("GET", downloadUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('El archivo PDF está vacío');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SoftwarePar_${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "✅ Factura descargada",
        description: `Factura ${invoice.invoiceNumber} descargada exitosamente`,
      });
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({
        title: "❌ Error al descargar",
        description: error.message || "No se pudo descargar la factura",
        variant: "destructive",
      });
    }
  };

  const downloadResimple = async (invoice: Invoice) => {
    try {
      const downloadUrl = `/api/client/stage-invoices/${invoice.id}/download-resimple`;
      
      console.log(`Descargando RESIMPLE desde: ${downloadUrl}`);
      
      const response = await apiRequest("GET", downloadUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('El archivo PDF está vacío');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SoftwarePar_Boleta_RESIMPLE_${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "✅ Boleta RESIMPLE descargada",
        description: `Boleta RESIMPLE para ${invoice.invoiceNumber} descargada exitosamente`,
      });
    } catch (error) {
      console.error("Error downloading RESIMPLE:", error);
      toast({
        title: "❌ Error al descargar",
        description: error.message || "No se pudo descargar la Boleta RESIMPLE",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'overdue':
      case 'failed':
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
      case 'completed':
        return 'Completado';
      case 'failed':
        return 'Fallido';
      default:
        return status;
    }
  };

  // Mock data for development
  const mockBillingData = {
    currentBalance: 0,
    totalPaid: 15750,
    pendingPayments: 2500,
    nextPaymentDue: '2024-02-15',
  };

  const mockInvoices: Invoice[] = [
    {
      id: 1,
      invoiceNumber: 'INV-STAGE-1-1',
      projectName: 'Desarrollo App Mobile',
      amount: 1250,
      status: 'paid',
      dueDate: '2024-01-15',
      paidAt: '2024-01-14',
      createdAt: '2024-01-01',
      stageName: 'Anticipo del Proyecto',
      stagePercentage: 25,
      type: 'stage_payment',
    },
    {
      id: 2,
      invoiceNumber: 'INV-STAGE-1-2',
      projectName: 'Desarrollo App Mobile',
      amount: 1250,
      status: 'paid',
      dueDate: '2024-02-15',
      paidAt: '2024-02-14',
      createdAt: '2024-02-01',
      stageName: '50% de Progreso',
      stagePercentage: 25,
      type: 'stage_payment',
    },
    {
      id: 3,
      invoiceNumber: 'INV-2024-002',
      projectName: 'Sistema de Gestión',
      amount: 2500,
      status: 'pending',
      dueDate: '2024-02-15',
      createdAt: '2024-01-15',
      type: 'traditional',
    },
  ];

  const mockPaymentMethods: PaymentMethod[] = [
    {
      id: 1,
      type: 'card',
      details: {
        last4: '4532',
        brand: 'Visa',
        expiryDate: '12/26',
      },
      isDefault: true,
    },
    {
      id: 2,
      type: 'bank_transfer',
      details: {
        bankName: 'Banco Santander',
        accountNumber: '****5678',
      },
      isDefault: false,
    },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 1,
      type: 'payment',
      amount: 5000,
      description: 'Pago de factura INV-2024-001',
      status: 'completed',
      date: '2024-01-14',
      invoiceId: 1,
      paymentMethodId: 1,
    },
    {
      id: 2,
      type: 'fee',
      amount: 150,
      description: 'Comisión MercadoPago',
      status: 'completed',
      date: '2024-01-14',
    },
  ];

  const data = {
    billing: billingData || mockBillingData,
    invoices: invoices || mockInvoices,
  };

  if (billingLoading || invoicesLoading) {
    return (
      <DashboardLayout title="Facturación">
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
    <DashboardLayout title="Facturación y Pagos">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Facturación y Pagos</h1>
          <p className="text-muted-foreground">
            Gestiona tus facturas, métodos de pago y historial de transacciones
          </p>
        </div>

        {/* Billing Stats */}
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
                    <p className="text-sm font-medium text-muted-foreground">Balance Actual</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${data.billing.currentBalance.toLocaleString()}
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
                    <CheckCircle className="h-6 w-6 text-chart-2" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Pagado</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${data.billing.totalPaid.toLocaleString()}
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
                    <Clock className="h-6 w-6 text-chart-1" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Pagos Pendientes</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${data.billing.pendingPayments.toLocaleString()}
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
                    <Calendar className="h-6 w-6 text-chart-4" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Próximo Vencimiento</p>
                    <p className="text-2xl font-bold text-foreground">
                      {data.billing.nextPaymentDue
                        ? new Date(data.billing.nextPaymentDue).toLocaleDateString()
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Facturas Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Mis Facturas</span>
              <Badge variant="outline">
                {data.invoices.filter(inv => inv.status === 'pending').length} pendientes
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.invoices.map((invoice: Invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{invoice.invoiceNumber}</div>
                          {invoice.type === 'stage_payment' && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Etapa: {invoice.stageName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.projectName}</div>
                          {invoice.type === 'stage_payment' && (
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                Pago por Etapa
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {invoice.stagePercentage}% del proyecto
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">
                        ${typeof invoice.amount === 'string' ? parseFloat(invoice.amount).toLocaleString() : invoice.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(invoice.status)}>
                          {getStatusText(invoice.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invoice.paidAt 
                          ? new Date(invoice.paidAt).toLocaleDateString()
                          : new Date(invoice.dueDate).toLocaleDateString()
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedInvoice(invoice)}
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => invoice.type === 'stage_payment' ? downloadResimple(invoice) : downloadInvoice(invoice)}
                            title={invoice.type === 'stage_payment' ? "Descargar Boleta RESIMPLE" : "Descargar Factura"}
                            className="text-xs"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            {invoice.type === 'stage_payment' ? 'RESIMPLE' : 'PDF'}
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

        {/* Invoice Detail Modal */}
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalle de Factura</DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <InvoiceDetailView 
                invoice={selectedInvoice} 
                onDownloadInvoice={downloadInvoice}
                onDownloadResimple={downloadResimple}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}



function InvoiceDetailView({ invoice, onDownloadInvoice, onDownloadResimple }: { 
  invoice: Invoice;
  onDownloadInvoice: (invoice: Invoice) => void;
  onDownloadResimple: (invoice: Invoice) => void;
}) {
  return (
    <div className="space-y-4">
      {invoice.type === 'stage_payment' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Factura de Etapa de Pago
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-blue-600">Etapa:</span>
              <p className="font-medium">{invoice.stageName}</p>
            </div>
            <div>
              <span className="text-blue-600">Porcentaje:</span>
              <p className="font-medium">{invoice.stagePercentage}%</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Número de Factura</Label>
          <p className="text-lg font-semibold">{invoice.invoiceNumber}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Estado</Label>
          <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
            {invoice.status === 'paid' ? 'Pagado' : 'Pendiente'}
          </Badge>
        </div>
        <div>
          <Label className="text-sm font-medium">Proyecto</Label>
          <p>{invoice.projectName}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Monto</Label>
          <p className="text-lg font-bold">
            ${typeof invoice.amount === 'string' ? parseFloat(invoice.amount).toLocaleString() : invoice.amount.toLocaleString()}
          </p>
        </div>
        <div>
          <Label className="text-sm font-medium">Fecha de Creación</Label>
          <p>{new Date(invoice.createdAt).toLocaleDateString()}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">
            {invoice.paidAt ? 'Fecha de Pago' : 'Fecha de Vencimiento'}
          </Label>
          <p>{new Date(invoice.paidAt || invoice.dueDate).toLocaleDateString()}</p>
        </div>
        {invoice.type === 'stage_payment' && (
          <div className="col-span-2">
            <Label className="text-sm font-medium">Tipo de Factura</Label>
            <p className="text-sm text-muted-foreground">
              Esta factura corresponde al pago de la etapa "{invoice.stageName}" del proyecto {invoice.projectName}
            </p>
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => invoice.type === 'stage_payment' ? onDownloadResimple(invoice) : onDownloadInvoice(invoice)}
        >
          <Download className="h-4 w-4 mr-2" />
          {invoice.type === 'stage_payment' ? 'Descargar RESIMPLE' : 'Descargar PDF'}
        </Button>
        <Button variant="outline" className="flex-1" disabled>
          <FileText className="h-4 w-4 mr-2" />
          Ver Detalles
        </Button>
      </div>
    </div>
  );
}