import { useState } from "react";
import { Menu, Search, Mic, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  // --- 👆 FIN DE LA MODIFICACIÓN ---

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: Menu and Logo */}
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px]">
              <div className="flex flex-col gap-4 py-4">
                <h3 className="text-lg font-semibold">Categorías</h3>
                <Button variant="ghost" className="justify-start">Televisores</Button>
                <Button variant="ghost" className="justify-start">Celulares</Button>
                <Button variant="ghost" className="justify-start">Electrodomésticos</Button>
                <Button variant="ghost" className="justify-start">Accesorios</Button>
                
                <h3 className="text-lg font-semibold mt-4">Sistema</h3>
                <Button variant="ghost" className="justify-start">Reportes</Button>
                <Button variant="ghost" className="justify-start">Backup</Button>
                <Button variant="ghost" className="justify-start">Restore</Button>
                <Button variant="ghost" className="justify-start">Gráficos</Button>
                <Button variant="ghost" className="justify-start">Gestión</Button>
              </div>
            </SheetContent>
          </Sheet>

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