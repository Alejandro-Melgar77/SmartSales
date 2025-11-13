import { useState, useEffect } from "react";
import { Download, Mic, Loader2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { generateReport } from "@/integrations/supabase/sales";
import { Category, getAllProducts, getCategories } from "@/integrations/supabase/products";
import { Product } from "@/integrations/supabase/products";
import { User, getAllUsers } from "@/integrations/supabase/users";

// --- Configuración de la API de Voz ---
const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
let recognition: any = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'es-ES';
  recognition.interimResults = false;
}
// --- ----------------------------- ---

const Reportes = () => {
  // --- Estados para los datos de los filtros ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // --- Estados para los filtros seleccionados ---
  const [categoriaId, setCategoriaId] = useState("all");
  const [productoId, setProductoId] = useState("all");
  const [usuarioId, setUsuarioId] = useState("all");
  const [periodo, setPeriodo] = useState("mes_actual");
  const [agruparPor, setAgruparPor] = useState("producto");
  const [formato, setFormato] = useState("pdf");
  const [prompt, setPrompt] = useState("");

  // --- Estados de carga ---
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // --- Cargar datos para los Selects (Categorías, Productos, Usuarios) ---
  useEffect(() => {
    const loadFilters = async () => {
      try {
        setIsLoadingData(true);
        const [catData, prodData, userData] = await Promise.all([
          getCategories(),
          getAllProducts(),
          getAllUsers(),
        ]);
        setCategories(catData);
        setProducts(prodData);
        setUsers(userData.filter(u => u.role_display === 'Cliente'));
      } catch (error) {
        toast.error("Error al cargar filtros");
      } finally {
        setIsLoadingData(false);
      }
    };
    loadFilters();
  }, []);

  // --- Lógica para calcular fechas ---
  const getFechasFromPeriodo = (periodo: string): { fecha_inicio: string, fecha_fin: string } => {
    const hoy = new Date();
    let fecha_inicio = new Date();
    let fecha_fin = new Date(hoy);

    if (periodo === 'mes_actual') {
      fecha_inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    } else if (periodo === 'mes_agosto') {
      fecha_inicio = new Date(2025, 7, 1);
      fecha_fin = new Date(2025, 7, 31);
    } else if (periodo === 'mes_septiembre') {
      fecha_inicio = new Date(2025, 8, 1);
      fecha_fin = new Date(2025, 8, 30);
    } else if (periodo === 'mes_octubre') {
      fecha_inicio = new Date(2025, 9, 1);
      fecha_fin = new Date(2025, 9, 31);
    }
    
    return {
      fecha_inicio: fecha_inicio.toISOString().split('T')[0],
      fecha_fin: fecha_fin.toISOString().split('T')[0],
    };
  };

  // --- Lógica de Descarga (Botón Manual) ---
  const handleDownload = async () => {
    const { fecha_inicio, fecha_fin } = getFechasFromPeriodo(periodo);

    const filters = {
      formato: formato,
      agrupar_por: agruparPor,
      fecha_inicio: fecha_inicio,
      fecha_fin: fecha_fin,
      categoria_id: categoriaId !== "all" ? categoriaId : null,
      producto_id: productoId !== "all" ? productoId : null,
      usuario_id: usuarioId !== "all" ? usuarioId : null,
    };

    try {
      setIsDownloading(true);
      toast.info(`Generando reporte en ${formato.toUpperCase()}...`);
      await generateReport(filters);
      toast.success("Reporte descargado exitosamente.");
    } catch (error: any) {
      toast.error(`Error al generar reporte: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // --- Lógica de Prompt (Voz o Texto) ---
  const handlePromptDownload = async (promptText: string) => {
    if (!promptText) {
      toast.error("El prompt no puede estar vacío");
      return;
    }

    // --- 👇 CORRECCIÓN AQUÍ ---
    // Eliminamos 'formato: pdf' para que el backend decida
    const filters = {
      prompt: promptText,
    };
    // --- -------------------- ---
    
    try {
      setIsDownloading(true);
      toast.info("🤖 Interpretando prompt y generando reporte...");
      await generateReport(filters);
      toast.success("Reporte por prompt descargado.");
    } catch (error: any) {
      toast.error(`Error al generar reporte: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // --- Lógica de Reconocimiento de Voz ---
  const handleListen = () => {
    if (!SpeechRecognition) {
      toast.error("Tu navegador no soporta el reconocimiento de voz.");
      return;
    }
    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }
    recognition.start();
    recognition.onstart = () => {
      setIsListening(true);
      toast.info("🎙️ Escuchando... Habla ahora.");
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPrompt(transcript);
      toast.success("Texto reconocido. Presiona 'Generar' para confirmar.");
    };
    recognition.onerror = (event: any) => {
      toast.error(`Error de micrófono: ${event.error}`);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Reportes</h1>
        
        {/* --- Card de Filtros Manuales --- */}
        <Card className="max-w-2xl mb-8">
          <CardHeader>
            <CardTitle>Filtros de Reporte</CardTitle>
            <CardDescription>
              Selecciona los filtros manuales para tu reporte.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Fila 1: Categoría y Producto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoría</label>
                <Select value={categoriaId} onValueChange={setCategoriaId} disabled={isLoadingData}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingData ? "Cargando..." : "Todas las categorías"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Producto</label>
                <Select value={productoId} onValueChange={setProductoId} disabled={isLoadingData}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingData ? "Cargando..." : "Todos los productos"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los productos</SelectItem>
                    {products.map(prod => (
                      <SelectItem key={prod.id} value={prod.id.toString()}>{prod.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fila 2: Usuario y Período */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cliente</label>
                <Select value={usuarioId} onValueChange={setUsuarioId} disabled={isLoadingData}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingData ? "Cargando..." : "Todos los clientes"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los clientes</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id.toString()}>{user.first_name} {user.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Período</label>
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mes_actual">Este mes (Demo)</SelectItem>
                    <SelectItem value="mes_agosto">Agosto 2025</SelectItem>
                    <SelectItem value="mes_septiembre">Septiembre 2025</SelectItem>
                    <SelectItem value="mes_octubre">Octubre 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fila 3: Agrupación y Formato */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Agrupar por</label>
                <Select value={agruparPor} onValueChange={setAgruparPor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Agrupar reporte por..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="producto">Producto</SelectItem>
                    <SelectItem value="categoria">Categoría</SelectItem>
                    <SelectItem value="cliente">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Formato</label>
                <Select value={formato} onValueChange={setFormato}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Fila 4: Botón de Descarga */}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleDownload} disabled={isDownloading || isLoadingData} className="flex-1">
                {isDownloading ? 
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                  <Download className="mr-2 h-4 w-4" />
                }
                Descargar Reporte
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* --- Card de Reporte por Voz/IA --- */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Reporte por Voz (IA)</CardTitle>
            <CardDescription>
              Usa el micrófono para pedir un reporte.
              Ej: "Reporte de ventas de septiembre agrupado por producto en PDF"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="O escribe tu prompt aquí..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <Button 
                variant={isListening ? "destructive" : "outline"} 
                size="icon"
                onClick={handleListen}
                disabled={!SpeechRecognition}
              >
                <Mic className={`h-4 w-4 ${isListening ? 'animate-pulse' : ''}`} />
              </Button>
            </div>
            <Button 
              onClick={() => handlePromptDownload(prompt)} 
              disabled={isDownloading || !prompt} 
              className="w-full mt-4"
            >
              {isDownloading ? 
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                <Brain className="mr-2 h-4 w-4" />
              }
              Generar con IA
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Reportes;