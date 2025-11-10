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

interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  precio_venta: number;
  categoria: number;
  categoria_nombre?: string;
  imagen: string;
  destacado: boolean;
  activo: boolean;
}

interface Category {
  id: string;
  nombre: string;
  caracteristicas: string;
}

const Productos = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar productos y categorías
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/products/productos/');
      const data = await response.json();
      setProducts(data.results || data);
    } catch (error) {
      toast.error("Error al cargar productos");
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/products/categorias/');
      const data = await response.json();
      setCategories(data.results || data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const productData = {
      nombre: formData.get("nombre") as string,
      descripcion: formData.get("descripcion") as string,
      precio_venta: Number(formData.get("precio_venta")),
      categoria: formData.get("categoria") as string, // <-- BIEN (lo pasas como string)
      imagen: formData.get("imagen") as string || "/placeholder.svg",
      destacado: formData.get("destacado") === "true",
      activo: true
    };

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
          fetchProducts(); // Recargar la lista
        } else {
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
          fetchProducts(); // Recargar la lista
        } else {
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

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/products/productos/${id}/`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success("Producto eliminado");
        fetchProducts(); // Recargar la lista
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
                        <SelectItem key={category.id} value={category.id}>
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
                
                <Button type="submit" className="w-full">
                  {editingProduct ? "Actualizar" : "Crear"} Producto
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <img 
                  src={product.imagen || "/placeholder.svg"} 
                  alt={product.nombre} 
                  className="mb-4 h-48 w-full rounded-lg object-cover" 
                />
                <h3 className="font-semibold">{product.nombre}</h3>
                <p className="text-sm text-muted-foreground">{product.descripcion}</p>
                <p className="text-lg font-bold text-primary">${product.precio_venta}</p>
                <p className="text-sm text-muted-foreground">
                  Categoría: {product.categoria_nombre}
                  {product.destacado && " • ⭐ Destacado"}
                </p>
                <div className="mt-4 flex gap-2">
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