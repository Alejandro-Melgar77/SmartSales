import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom"; // <-- Importar para la búsqueda
import { Plus, Edit, Trash2, SearchX } from "lucide-react";
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
  id: number;
  nombre: string;
  descripcion: string;
  precio_venta: number;
  categoria: number;
  categoria_nombre?: string;
  imagen: string | null;
  destacado: boolean;
  activo: boolean;
}

interface Category {
  id: number;
  nombre: string;
  caracteristicas: string;
}

const Productos = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // 👇 Hook para leer la URL
  const [searchParams] = useSearchParams();
  const currentSearch = searchParams.get("search");

  // Cargar productos y categorías (al inicio y cuando cambia la búsqueda)
  useEffect(() => {
    loadData();
  }, [currentSearch]); // <-- Se ejecuta al buscar

  const loadData = async () => {
    setLoading(true);
    try {
      // 👇 Construir URL dinámica
      let productsUrl = 'http://localhost:8000/api/products/productos/';
      if (currentSearch) {
        productsUrl += `?search=${encodeURIComponent(currentSearch)}`;
      }

      const [prodRes, catRes] = await Promise.all([
        fetch(productsUrl),
        fetch('http://localhost:8000/api/products/categorias/')
      ]);
      
      const prodData = await prodRes.json();
      const catData = await catRes.json();

      setProducts(Array.isArray(prodData) ? prodData : prodData.results || []);
      setCategories(Array.isArray(catData) ? catData : catData.results || []);
    } catch (error) {
      toast.error("Error al cargar datos");
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formElement = e.currentTarget;
    const formData = new FormData(formElement);

    if (selectedImage) {
      formData.append('imagen', selectedImage);
    } else {
      formData.delete('imagen');
    }

    if (!formData.has('destacado')) {
        formData.append('destacado', editingProduct?.destacado ? 'true' : 'false');
    }
    formData.append('activo', 'true');

    try {
      const url = editingProduct
        ? `http://localhost:8000/api/products/productos/${editingProduct.id}/`
        : 'http://localhost:8000/api/products/productos/';
      
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        body: formData 
      });

      if (response.ok) {
        toast.success(editingProduct ? "Producto actualizado" : "Producto creado");
        loadData();
        setDialogOpen(false);
        setEditingProduct(null);
        setSelectedImage(null);
      } else {
        const errorData = await response.json();
        console.error('🔥 Error del backend:', errorData);
        
        let msg = "Error al guardar.";
        if (errorData.imagen) msg += ` Imagen: ${errorData.imagen}`;
        if (errorData.detail) msg += ` ${errorData.detail}`;
        
        toast.error(msg);
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor");
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/products/productos/${id}/`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success("Producto eliminado");
        loadData();
      } else {
        throw new Error('Error al eliminar');
      }
    } catch (error) {
      toast.error("Error al eliminar el producto");
    }
  };

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingProduct(null);
      setSelectedImage(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 flex justify-center">
          <p>Cargando productos...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          {/* 👇 Título dinámico según búsqueda */}
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-foreground">
              {currentSearch ? `Resultados para: "${currentSearch}"` : "Gestión de Productos"}
            </h1>
            {currentSearch && (
               <p className="text-sm text-muted-foreground">Mostrando {products.length} resultados</p>
            )}
          </div>

          <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingProduct(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
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
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="imagen">Imagen del Producto</Label>
                  <div className="space-y-2">
                    <Input 
                      id="imagen" 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedImage(e.target.files[0]);
                        }
                      }}
                    />
                    {(editingProduct?.imagen && !selectedImage) && (
                      <p className="text-xs text-muted-foreground">
                        Imagen actual: <a href={editingProduct.imagen} target="_blank" rel="noreferrer" className="underline">Ver imagen</a>
                      </p>
                    )}
                    {selectedImage && (
                      <p className="text-xs text-green-600">
                        Nueva imagen seleccionada: {selectedImage.name}
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="destacado">Destacado</Label>
                  <Select name="destacado" defaultValue={editingProduct?.destacado ? "true" : "false"}>
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

        {/* 👇 Mensaje de "No resultados" mejorado */}
        {products.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <div className="flex justify-center mb-4">
                <SearchX className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">
                {currentSearch ? `No encontramos productos que coincidan con "${currentSearch}".` : "No hay productos registrados."}
            </p>
            {currentSearch && (
                <Button variant="link" onClick={() => window.location.href='/productos'}>
                    Ver todos los productos
                </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <div className="aspect-square w-full mb-4 overflow-hidden rounded-lg bg-gray-100">
                    {product.imagen ? (
                      <img 
                        src={product.imagen} 
                        alt={product.nombre} 
                        className="h-full w-full object-cover" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        Sin imagen
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold">{product.nombre}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{product.descripcion}</p>
                  <p className="text-lg font-bold text-primary mt-2">Bs {product.precio_venta}</p>
                  <p className="text-sm text-muted-foreground">
                    Categoría: {product.categoria_nombre || "Sin categoría"}
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
        )}
      </main>
    </div>
  );
};

export default Productos;