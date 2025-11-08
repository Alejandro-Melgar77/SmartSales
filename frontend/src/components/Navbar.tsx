import { Menu, Search, Mic, User, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const Navbar = () => {
  const navigate = useNavigate();

  const handleBackup = () => {
    toast.success("Copia de seguridad creada exitosamente");
  };

  const handleRestore = () => {
    toast.success("Datos restaurados exitosamente");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: Menu Button */}
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

        {/* Center: Brand + Search + Voice */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="hover:bg-muted">
            <Search className="h-5 w-5" />
          </Button>
          
          <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-xl font-bold text-transparent sm:text-2xl">
            SmartSales
          </h1>
          
          <Button variant="ghost" size="icon" className="hover:bg-muted">
            <Mic className="h-5 w-5" />
          </Button>
        </div>

        {/* Right: Profile Button */}
        <Button variant="ghost" size="icon" className="hover:bg-muted">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
