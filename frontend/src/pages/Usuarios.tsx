import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  role_display: string;
  phone: string;
  address: string;
  ciudad: string;
  pais: string;
  fecha_nacimiento: string;
  genero: string;
  puntos_fidelidad: number;
  total_compras: number;
  is_active: boolean;
  date_joined: string;
}

const Usuarios = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Cargar usuarios
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/users/users/');
      const data = await response.json();
      setUsers(data.results || data);
    } catch (error) {
      toast.error("Error al cargar usuarios");
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const userData = {
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
      role: formData.get("role") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      ciudad: formData.get("ciudad") as string,
      pais: formData.get("pais") as string,
      fecha_nacimiento: formData.get("fecha_nacimiento") as string,
      genero: formData.get("genero") as string,
    };

    try {
      if (editingUser) {
        // Actualizar usuario existente
        const response = await fetch(`http://localhost:8000/api/users/users/${editingUser.id}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData)
        });

        if (response.ok) {
          toast.success("Usuario actualizado");
          fetchUsers();
        } else {
          throw new Error('Error al actualizar');
        }
      } else {
        // Crear nuevo usuario
        const createData = {
          ...userData,
          password: "temp123",
          password_confirm: "temp123"
        };

        const response = await fetch('http://localhost:8000/api/users/users/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createData)
        });

        if (response.ok) {
          toast.success("Usuario creado");
          fetchUsers();
        } else {
          throw new Error('Error al crear');
        }
      }
      
      setDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      toast.error("Error al guardar el usuario");
      console.error('Error saving user:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/users/users/${id}/`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success("Usuario desactivado");
        fetchUsers();
      } else {
        throw new Error('Error al eliminar');
      }
    } catch (error) {
      toast.error("Error al eliminar el usuario");
      console.error('Error deleting user:', error);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'seller': return 'default';
      case 'customer': return 'secondary';
      default: return 'outline';
    }
  };

  const filteredUsers = roleFilter === "all" 
    ? users 
    : users.filter(user => user.role === roleFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <p>Cargando usuarios...</p>
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
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
            <p className="text-muted-foreground mt-2">
              Total: {users.length} usuarios registrados
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingUser(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingUser ? "Editar" : "Nuevo"} Usuario</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Usuario</Label>
                    <Input 
                      id="username" 
                      name="username" 
                      defaultValue={editingUser?.username} 
                      required 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      defaultValue={editingUser?.email} 
                      required 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="first_name">Nombre</Label>
                    <Input 
                      id="first_name" 
                      name="first_name" 
                      defaultValue={editingUser?.first_name} 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="last_name">Apellido</Label>
                    <Input 
                      id="last_name" 
                      name="last_name" 
                      defaultValue={editingUser?.last_name} 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="role">Rol</Label>
                    <Select name="role" defaultValue={editingUser?.role || "customer"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="seller">Vendedor</SelectItem>
                        <SelectItem value="customer">Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="genero">Género</Label>
                    <Select name="genero" defaultValue={editingUser?.genero || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona género" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Femenino</SelectItem>
                        <SelectItem value="O">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      defaultValue={editingUser?.phone} 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="ciudad">Ciudad</Label>
                    <Input 
                      id="ciudad" 
                      name="ciudad" 
                      defaultValue={editingUser?.ciudad} 
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input 
                    id="address" 
                    name="address" 
                    defaultValue={editingUser?.address} 
                  />
                </div>
                
                <div>
                  <Label htmlFor="pais">País</Label>
                  <Input 
                    id="pais" 
                    name="pais" 
                    defaultValue={editingUser?.pais || "Bolivia"} 
                  />
                </div>
                
                <div>
                  <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                  <Input 
                    id="fecha_nacimiento" 
                    name="fecha_nacimiento" 
                    type="date"
                    defaultValue={editingUser?.fecha_nacimiento} 
                  />
                </div>
                
                <Button type="submit" className="w-full">
                  {editingUser ? "Actualizar" : "Crear"} Usuario
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex gap-4">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar por rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="admin">Administradores</SelectItem>
              <SelectItem value="seller">Vendedores</SelectItem>
              <SelectItem value="customer">Clientes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => (
            <Card key={user.id} className={!user.is_active ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {user.first_name} {user.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role_display}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                  
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  
                  {user.ciudad && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{user.ciudad}, {user.pais}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Registrado: {new Date(user.date_joined).toLocaleDateString()}</span>
                  </div>
                </div>

                {user.puntos_fidelidad > 0 && (
                  <div className="mt-3 p-2 bg-primary/10 rounded-lg">
                    <p className="text-sm font-medium text-center">
                      🎯 {user.puntos_fidelidad} puntos de fidelidad
                    </p>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEditingUser(user);
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
                        Esta acción desactivará el usuario. Podrás reactivarlo más tarde.
                      </AlertDialogDescription>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(user.id)}>
                          Desactivar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay usuarios registrados.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Haz clic en "Agregar Usuario" para comenzar.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Usuarios;