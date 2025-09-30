
import React, { useState } from 'react';
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import {
  Plus,
  Edit,
  Trash2,
  Star,
  CheckCircle,
  MoveUp,
  MoveDown,
} from "lucide-react";

interface WorkModality {
  id: number;
  title: string;
  subtitle?: string;
  badgeText?: string;
  badgeVariant: string;
  description: string;
  priceText: string;
  priceSubtitle?: string;
  features: string[];
  buttonText: string;
  buttonVariant: string;
  isPopular: boolean;
  isActive: boolean;
  displayOrder: number;
}

export default function WorkModalitiesManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedModality, setSelectedModality] = useState<WorkModality | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: modalities, isLoading, error } = useQuery({
    queryKey: ["admin", "work-modalities"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/work-modalities");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Procesar las modalidades para asegurar que features es un array
        return data.map((modality: any) => ({
          ...modality,
          features: typeof modality.features === 'string' 
            ? JSON.parse(modality.features) 
            : Array.isArray(modality.features) 
              ? modality.features 
              : []
        }));
      } catch (error) {
        console.error("Error fetching work modalities:", error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<WorkModality>) => {
      const response = await apiRequest("POST", "/api/admin/work-modalities", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "work-modalities"] });
      queryClient.invalidateQueries({ queryKey: ["work-modalities"] });
      toast({
        title: "Modalidad creada",
        description: "La modalidad de trabajo ha sido creada exitosamente.",
      });
      setShowCreateDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear",
        description: error.message || "No se pudo crear la modalidad",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<WorkModality> }) => {
      const response = await apiRequest("PUT", `/api/admin/work-modalities/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "work-modalities"] });
      queryClient.invalidateQueries({ queryKey: ["work-modalities"] });
      toast({
        title: "Modalidad actualizada",
        description: "La modalidad ha sido actualizada exitosamente.",
      });
      setShowEditDialog(false);
      setSelectedModality(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar",
        description: error.message || "No se pudo actualizar la modalidad",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/work-modalities/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "work-modalities"] });
      queryClient.invalidateQueries({ queryKey: ["work-modalities"] });
      toast({
        title: "Modalidad eliminada",
        description: "La modalidad ha sido eliminada exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar la modalidad",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (modality: WorkModality) => {
    setSelectedModality(modality);
    setShowEditDialog(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta modalidad?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Gestión de Modalidades de Trabajo">
        <div className="space-y-6">
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-96 bg-muted rounded"></div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Gestión de Modalidades de Trabajo">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Modalidades de Trabajo</h1>
            <p className="text-muted-foreground">
              Gestiona las modalidades de trabajo que se muestran en la página principal
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Modalidad
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nueva Modalidad</DialogTitle>
              </DialogHeader>
              <ModalityForm
                onSubmit={(data) => createMutation.mutate(data)}
                isLoading={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Modalities Table */}
        <Card>
          <CardHeader>
            <CardTitle>Modalidades Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Orden</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Popular</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modalities?.map((modality: WorkModality) => (
                    <TableRow key={modality.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm">{modality.displayOrder}</span>
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateMutation.mutate({
                                id: modality.id,
                                data: { displayOrder: modality.displayOrder - 1 }
                              })}
                            >
                              <MoveUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateMutation.mutate({
                                id: modality.id,
                                data: { displayOrder: modality.displayOrder + 1 }
                              })}
                            >
                              <MoveDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{modality.title}</div>
                          {modality.subtitle && (
                            <div className="text-sm text-muted-foreground">{modality.subtitle}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{modality.priceText}</div>
                          {modality.priceSubtitle && (
                            <div className="text-sm text-muted-foreground">{modality.priceSubtitle}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={modality.isActive ? "default" : "secondary"}>
                          {modality.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {modality.isPopular && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Star className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(modality)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(modality.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Modalidad</DialogTitle>
            </DialogHeader>
            {selectedModality && (
              <ModalityForm
                modality={selectedModality}
                onSubmit={(data) => updateMutation.mutate({ id: selectedModality.id, data })}
                isLoading={updateMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

interface ModalityFormProps {
  modality?: WorkModality;
  onSubmit: (data: Partial<WorkModality>) => void;
  isLoading: boolean;
}

function ModalityForm({ modality, onSubmit, isLoading }: ModalityFormProps) {
  const [formData, setFormData] = useState({
    title: modality?.title || "",
    subtitle: modality?.subtitle || "",
    badgeText: modality?.badgeText || "",
    badgeVariant: modality?.badgeVariant || "secondary",
    description: modality?.description || "",
    priceText: modality?.priceText || "",
    priceSubtitle: modality?.priceSubtitle || "",
    features: modality?.features?.join("\n") || "",
    buttonText: modality?.buttonText || "Solicitar Cotización",
    buttonVariant: modality?.buttonVariant || "default",
    isPopular: modality?.isPopular || false,
    isActive: modality?.isActive !== undefined ? modality.isActive : true,
    displayOrder: modality?.displayOrder || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const features = formData.features
      .split("\n")
      .map(f => f.trim())
      .filter(f => f.length > 0);

    onSubmit({
      ...formData,
      features,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="subtitle">Subtítulo</Label>
          <Input
            id="subtitle"
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priceText">Texto del Precio *</Label>
          <Input
            id="priceText"
            value={formData.priceText}
            onChange={(e) => setFormData({ ...formData, priceText: e.target.value })}
            placeholder="$2,500 - $15,000"
            required
          />
        </div>
        <div>
          <Label htmlFor="priceSubtitle">Subtítulo del Precio</Label>
          <Input
            id="priceSubtitle"
            value={formData.priceSubtitle}
            onChange={(e) => setFormData({ ...formData, priceSubtitle: e.target.value })}
            placeholder="Precio según complejidad"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="features">Características (una por línea) *</Label>
        <Textarea
          id="features"
          value={formData.features}
          onChange={(e) => setFormData({ ...formData, features: e.target.value })}
          placeholder="Código fuente completo incluido&#10;Propiedad intelectual total&#10;Documentación técnica completa"
          rows={6}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="buttonText">Texto del Botón</Label>
          <Input
            id="buttonText"
            value={formData.buttonText}
            onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="displayOrder">Orden de Visualización</Label>
          <Input
            id="displayOrder"
            type="number"
            value={formData.displayOrder}
            onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="badgeText">Texto del Badge</Label>
          <Input
            id="badgeText"
            value={formData.badgeText}
            onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
            placeholder="Más Popular"
          />
        </div>
        <div>
          <Label htmlFor="badgeVariant">Variante del Badge</Label>
          <Select value={formData.badgeVariant} onValueChange={(value) => setFormData({ ...formData, badgeVariant: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="isPopular"
            checked={formData.isPopular}
            onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
          />
          <Label htmlFor="isPopular">Marcar como Popular</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="isActive">Modalidad Activa</Label>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Guardando..." : modality ? "Actualizar Modalidad" : "Crear Modalidad"}
      </Button>
    </form>
  );
}
