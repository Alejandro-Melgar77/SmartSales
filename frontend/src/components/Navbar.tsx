import { useState } from "react";
import { Menu, Search, Mic, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertDialogCancel, AlertDialogContent, AlertDialogDescription } from "@radix-ui/react-alert-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";

const Navbar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada correctamente");
    navigate("/");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleRegister = () => {
    navigate("/register");
  };

  // --- 👇 INICIO DE LA MODIFICACIÓN ---
  const handleNotasVenta = () => {
    // toast.info("Funcionalidad de notas de venta en desarrollo"); // Comentado
    navigate("/notas-venta"); // <-- ACTIVADO
  };


  const handleBackup = () => {
    toast.success("Copia de seguridad creada exitosamente");
  };

  const handleRestore = () => {
    toast.success("Datos restaurados exitosamente");
  };
  // --- 👆 FIN DE LA MODIFICACIÓN ---

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: Menu and Logo */}
        <div className="flex items-center gap-4">
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-muted">
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-popover">
            <DropdownMenuItem onClick={() => navigate("/")}>Inicio</DropdownMenuItem>
            
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                Categorías
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Televisores</DropdownMenuItem>
                <DropdownMenuItem>Celulares</DropdownMenuItem>
                <DropdownMenuItem>Electrodomésticos</DropdownMenuItem>
                <DropdownMenuItem>Accesorios</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuItem onClick={() => navigate("/reportes")}>
              Reportes
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  Backup
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>¿Crear copia de seguridad?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se guardará una copia de todos los datos actuales.
                </AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBackup}>Confirmar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <DropdownMenuItem onClick={handleRestore}>
              Restore
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => navigate("/graficos")}>
              Gráficos
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                Gestión
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => navigate("/productos")}>
                  Producto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/usuarios")}>
                  Usuario
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>

          <h1 className="text-xl font-bold">SmartSales</h1>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-2xl mx-4">
          {searchOpen ? (
            <div className="flex gap-2">
              <Input placeholder="Buscar productos..." className="flex-1" />
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen(false)}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex justify-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Right: User Menu */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isAuthenticated ? (
                <>
                  <div className="px-2 py-1.5 text-sm font-semibold">
                    Hola, {user?.first_name}!
                  </div>
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    {user?.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleNotasVenta}>
                    📄 Notas de Venta
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    🚪 Cerrar Sesión
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={handleLogin}>
                    🔑 Iniciar Sesión
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleRegister}>
                    👤 Registrarse
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;