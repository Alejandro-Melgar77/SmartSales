import { Moon, Sun, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CartSheet } from "@/components/CartSheet";
import { useCart } from "@/contexts/CartContext";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

const BottomNavigation = () => {
  const [isDark, setIsDark] = useState(false);
  const { items } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
    toast.success(isDark ? "Modo claro activado" : "Modo oscuro activado");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleRegister = () => {
    navigate("/register");
  };

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada correctamente");
  };

  const handleNotasVenta = () => {
    toast.info("Funcionalidad de notas de venta en desarrollo");
    // navigate("/notas-venta"); // Para el futuro
  };

  const handleProfile = () => {
    toast.info("Perfil del usuario");
    // navigate("/profile"); // Para el futuro
  };

  return (
    <div className="sticky bottom-0 w-full border-t border-border bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        
        {/* Left: Cart (Mostrado siempre) */}
        <div className="flex items-center gap-2">
          <CartSheet>
            <Button variant="default" size="icon" className="relative h-12 w-12">
              <ShoppingCart className="h-5 w-5" />
              {items.length > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {items.length}
                </Badge>
              )}
            </Button>
          </CartSheet>
        </div>

        {/* Center: Pagination */}
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        {/* Right: Theme Toggle and Auth Buttons */}
        <div className="flex items-center gap-2">
          {!isAuthenticated && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogin}
                className="h-10"
              >
                Iniciar Sesión
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleRegister}
                className="h-10"
              >
                Registrarse
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12"
            onClick={toggleTheme}
          >
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Auth Status Bar */}
      {isAuthenticated && (
        <div className="bg-primary/10 border-t border-primary/20">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">
                Conectado como: <span className="text-primary">{user?.first_name} {user?.last_name}</span>
              </span>
              <span className="text-muted-foreground">
                {user?.role_display}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BottomNavigation;