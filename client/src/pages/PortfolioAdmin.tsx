
import { useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { usePortfolio, usePortfolioAdmin } from "@/hooks/usePortfolio";
import type { Portfolio, InsertPortfolio } from "@shared/schema";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Star,
  Calendar,
  Image,
  ExternalLink,
} from "lucide-react";

export default function PortfolioAdmin() {
  const { portfolio, isLoading } = usePortfolio();
  const { createPortfolio, updatePortfolio, deletePortfolio, isCreating, isUpdating, isDeleting } = usePortfolioAdmin();
  const [selectedItem, setSelectedItem] = useState<Portfolio | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleEdit = (item: Portfolio) => {
    setSelectedItem(item);
    setShowEditDialog(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar este elemento del portfolio?")) {
      deletePortfolio(id);
    }
  };

  const handleCreate = (data: InsertPortfolio) => {
    createPortfolio(data);
    setShowCreateDialog(false);
  };

  const handleUpdate = (id: number, updates: Partial<Portfolio>) => {
    updatePortfolio({ id, updates });
    setShowEditDialog(false);
    setSelectedItem(null);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Gestión del Portfolio">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Portfolio</h1>
            <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted rounded-t-lg"></div>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-20 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Gestión del Portfolio">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>
            <p className="text-muted-foreground">Gestiona los proyectos mostrados en la página principal</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-portfolio">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Proyecto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agregar Proyecto al Portfolio</DialogTitle>
              </DialogHeader>
              <PortfolioForm
                onSubmit={handleCreate}
                isLoading={isCreating}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolio?.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="group hover:shadow-lg transition-all duration-200">
                <div className="aspect-video overflow-hidden rounded-t-lg bg-muted relative">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex space-x-1">
                    {item.featured && (
                      <Badge variant="secondary" className="bg-primary text-primary-foreground">
                        <Star className="h-3 w-3 mr-1" />
                        Destacado
                      </Badge>
                    )}
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground line-clamp-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {JSON.parse(item.technologies || '[]').slice(0, 3).map((tech: string, techIndex: number) => (
                        <Badge key={techIndex} variant="outline" className="text-xs">{tech}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(item.completedAt).getFullYear()}
                      </div>
                      <div className="flex space-x-1">
                        {item.demoUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(item.demoUrl!, '_blank')}
                            data-testid={`button-view-demo-${item.id}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          data-testid={`button-edit-portfolio-${item.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item.id)}
                          data-testid={`button-delete-portfolio-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {portfolio && portfolio.length === 0 && (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Image className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No hay proyectos en el portfolio</h3>
                <p className="text-muted-foreground">Agrega tu primer proyecto para mostrar tu trabajo.</p>
              </div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Proyecto
              </Button>
            </div>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Proyecto</DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <PortfolioForm
                initialData={selectedItem}
                onSubmit={(data) => handleUpdate(selectedItem.id, data)}
                isLoading={isUpdating}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

interface PortfolioFormProps {
  initialData?: Portfolio;
  onSubmit: (data: InsertPortfolio) => void;
  isLoading: boolean;
}

function PortfolioForm({ initialData, onSubmit, isLoading }: PortfolioFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    technologies: initialData?.technologies || "[]",
    imageUrl: initialData?.imageUrl || "",
    demoUrl: initialData?.demoUrl || "",
    completedAt: initialData?.completedAt ? new Date(initialData.completedAt).toISOString().split('T')[0] : "",
    featured: initialData?.featured || false,
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
  });

  const [techInput, setTechInput] = useState("");
  const technologies = JSON.parse(formData.technologies || "[]");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      completedAt: new Date(formData.completedAt),
    });
  };

  const addTechnology = () => {
    if (techInput.trim()) {
      const newTechs = [...technologies, techInput.trim()];
      setFormData({ ...formData, technologies: JSON.stringify(newTechs) });
      setTechInput("");
    }
  };

  const removeTechnology = (index: number) => {
    const newTechs = technologies.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, technologies: JSON.stringify(newTechs) });
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
            data-testid="input-portfolio-title"
          />
        </div>
        <div>
          <Label htmlFor="category">Categoría *</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger data-testid="select-portfolio-category">
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="E-commerce">E-commerce</SelectItem>
              <SelectItem value="Dashboard">Dashboard</SelectItem>
              <SelectItem value="Mobile App">Mobile App</SelectItem>
              <SelectItem value="Web App">Web App</SelectItem>
              <SelectItem value="CRM">CRM</SelectItem>
              <SelectItem value="E-learning">E-learning</SelectItem>
              <SelectItem value="Cloud">Cloud</SelectItem>
              <SelectItem value="API">API</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          required
          data-testid="textarea-portfolio-description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="imageUrl">URL de Imagen *</Label>
          <Input
            id="imageUrl"
            type="url"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="https://example.com/image.jpg"
            required
            data-testid="input-portfolio-image"
          />
        </div>
        <div>
          <Label htmlFor="demoUrl">URL de Demo</Label>
          <Input
            id="demoUrl"
            type="url"
            value={formData.demoUrl}
            onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
            placeholder="https://demo.example.com"
            data-testid="input-portfolio-demo"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="completedAt">Fecha de Finalización *</Label>
        <Input
          id="completedAt"
          type="date"
          value={formData.completedAt}
          onChange={(e) => setFormData({ ...formData, completedAt: e.target.value })}
          required
          data-testid="input-portfolio-date"
        />
      </div>

      <div>
        <Label>Tecnologías</Label>
        <div className="flex space-x-2 mb-2">
          <Input
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            placeholder="ej: React, Node.js"
            data-testid="input-portfolio-tech"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
          />
          <Button type="button" onClick={addTechnology} variant="outline">
            Agregar
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {technologies.map((tech: string, index: number) => (
            <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTechnology(index)}>
              {tech} ✕
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="featured"
            checked={formData.featured}
            onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
            data-testid="switch-portfolio-featured"
          />
          <Label htmlFor="featured">Proyecto destacado</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            data-testid="switch-portfolio-active"
          />
          <Label htmlFor="isActive">Activo</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading} data-testid="button-submit-portfolio">
          {isLoading ? "Guardando..." : (initialData ? "Actualizar" : "Crear")}
        </Button>
      </div>
    </form>
  );
}
