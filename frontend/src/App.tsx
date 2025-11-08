import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext"; // Nuevo
import Index from "./pages/Index";
import Reportes from "./pages/Reportes";
import Graficos from "./pages/Graficos";
import Productos from "./pages/Productos";
import Usuarios from "./pages/Usuarios";
import Pago from "./pages/Pago";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login"; // Nuevo
import Register from "./pages/Register"; // Nuevo

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider> {/* Envuelve con AuthProvider */}
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="/graficos" element={<Graficos />} />
              <Route path="/productos" element={<Productos />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/pago" element={<Pago />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;