import { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Product, Category, getAllProducts, getCategories } from "@/integrations/supabase/products";

const Productos = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar productos y categorías
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        getAllProducts(),
        getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      toast.error("Error al cargar datos");
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const productData = {
      nombre: formData.get("nombre") as string,
      descripcion: formData.get("descripcion") as string,
      precio_venta: Number(formData.get("precio_venta")),
      categoria: Number(formData.get("categoria")), // 👈 CORREGIDO: debe ser number, no string
      imagen: formData.get("imagen") as string || "/placeholder.svg",
      destacado: formData.get("destacado") === "true",
      activo: true
    };

    console.log('📦 Enviando datos:', productData); // 👈 Para debug

    try {
      if (editingProduct) {
        // Actualizar producto existente
        const response = await fetch(`http://localhost:8000/api/products/productos/${editingProduct.id}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData)
        });

        if (response.ok) {
          toast.success("Producto actualizado");
          loadData(); // Recargar la lista
        } else {
          const errorData = await response.json();
          console.error('Error del servidor:', errorData);
          throw new Error('Error al actualizar');
        }
      } else {
        // Crear nuevo producto
        const response = await fetch('http://localhost:8000/api/products/productos/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData)
        });

        if (response.ok) {
          toast.success("Producto creado");
          loadData(); // Recargar la lista
        } else {
          const errorData = await response.json();
          console.error('Error del servidor:', errorData);
          throw new Error('Error al crear');
        }
      }
      
      setDialogOpen(false);
      setEditingProduct(null);
    } catch (error) {
      toast.error("Error al guardar el producto");
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (id: number) => { // 👈 CORREGIDO: id debe ser number
    try {
      const response = await fetch(`http://localhost:8000/api/products/productos/${id}/`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success("Producto eliminado");
        loadData(); // Recargar la lista
      } else {
        throw new Error('Error al eliminar');
      }
    } catch (error) {
      toast.error("Error al eliminar el producto");
      console.error('Error deleting product:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <p>Cargando productos...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Gestión de Productos</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingProduct(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Producto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Editar" : "Nuevo"} Producto</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input 
                    id="nombre" 
                    name="nombre" 
                    defaultValue={editingProduct?.nombre} 
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Input 
                    id="descripcion" 
                    name="descripcion" 
                    defaultValue={editingProduct?.descripcion} 
                  />
                </div>
                
                <div>
                  <Label htmlFor="precio_venta">Precio</Label>
                  <Input 
                    id="precio_venta" 
                    name="precio_venta" 
                    type="number" 
                    step="0.01"
                    defaultValue={editingProduct?.precio_venta} 
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select name="categoria" defaultValue={editingProduct?.categoria?.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}> {/* 👈 CORREGIDO: convertir a string */}
                          {category.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="imagen">URL de Imagen</Label>
                  <Input 
                    id="imagen" 
                    name="imagen" 
                    defaultValue={editingProduct?.imagen} 
                    placeholder="/media/productos/imagen.jpg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="destacado">Destacado</Label>
                  <Select name="destacado" defaultValue={editingProduct?.destacado?.toString() || "false"}>
                    <SelectTrigger>
                      <SelectValue placeholder="¿Producto destacado?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sí</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setDialogOpen(false);
                      setEditingProduct(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingProduct ? "Actualizar" : "Crear"} Producto
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={product.imagen || "/placeholder.svg"} 
                    alt={product.nombre} 
                    className="h-full w-full object-cover transition-transform hover:scale-105" 
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{product.nombre}</h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {product.descripcion || "Sin descripción"}
                  </p>
                  <p className="text-lg font-bold text-primary mb-2">${product.precio_venta}</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Categoría: {product.categoria_nombre}
                    {product.destacado && " • ⭐ Destacado"}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingProduct(product);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará el producto permanentemente.
                        </AlertDialogDescription>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(product.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay productos registrados.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Haz clic en "Agregar Producto" para comenzar.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Productos;