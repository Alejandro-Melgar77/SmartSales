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
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Navbar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  // 👇 1. Estado para el texto del buscador
  const [searchTerm, setSearchTerm] = useState("");
  
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

  const handleNotasVenta = () => {
    navigate("/notas-venta");
  };

  const handleBackup = () => {
    // Aquí podrías llamar a una API real en el futuro
    toast.success("Copia de seguridad creada exitosamente");
  };

  const handleRestore = () => {
    // Aquí podrías llamar a una API real en el futuro
    toast.success("Datos restaurados exitosamente");
  };

  // 👇 2. Función para ejecutar la búsqueda
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault(); 
    
    if (searchTerm.trim()) {
      navigate(`/productos?search=${encodeURIComponent(searchTerm)}`);
      setSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        
        {/* Left: Menu and Logo */}
        <div className="flex items-center gap-4">
          {/* Dropdown Menu (Menú Principal) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-muted">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-popover">
              <DropdownMenuItem onClick={() => navigate("/")}>
                Inicio
              </DropdownMenuItem>
              
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  Categorías
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => navigate("/productos?search=Televisores")}>Televisores</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/productos?search=Celulares")}>Celulares</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/productos?search=Electrodomésticos")}>Electrodomésticos</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/productos?search=Accesorios")}>Accesorios</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuItem onClick={() => navigate("/reportes")}>
                Reportes
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Opción de Backup (con confirmación) */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Backup
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Crear copia de seguridad?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se guardará una copia de todos los datos actuales del sistema.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBackup}>Confirmar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Opción de Restore (con confirmación) */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Restore
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Restaurar datos?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción podría sobrescribir los datos actuales con la última copia de seguridad.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRestore}>Confirmar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

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

          {/* Logo con enlace al inicio */}
          <h1 
            className="text-xl font-bold cursor-pointer select-none" 
            onClick={() => { setSearchTerm(""); navigate("/"); }}
          >
            SmartSales
          </h1>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-2xl mx-4">
          {searchOpen ? (
            // Buscador versión móvil (expandido)
            <div className="flex gap-2">
              <Input 
                placeholder="Buscar productos..." 
                className="flex-1" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                autoFocus
              />
              <Button variant="ghost" size="icon" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen(false)}>
                X
              </Button>
            </div>
          ) : (
            // Buscador normal
            <div className="flex justify-center gap-2 w-full">
               {/* Input visible en pantallas medianas/grandes */}
               <div className="hidden md:flex w-full max-w-lg gap-2">
                  <Input 
                    placeholder="Buscar productos..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button variant="ghost" size="icon" onClick={handleSearch}>
                    <Search className="h-4 w-4" />
                  </Button>
               </div>

               {/* Botón lupa solo para pantallas pequeñas */}
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSearchOpen(true)}>
                <Search className="h-4 w-4" />
              </Button>
              
              {/* Botón micrófono (placeholder para futura funcionalidad global) */}
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