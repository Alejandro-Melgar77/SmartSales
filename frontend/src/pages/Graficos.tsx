import { useState, useEffect } from "react";
import { Loader2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { 
  getHistoricalSummary, 
  getPredictions, 
  triggerRetrainModel,
  HistoricalDataPoint,
  PredictionDataPoint
} from "@/integrations/supabase/dashboard"; // <-- Usamos la nueva API
import { 
  ResponsiveContainer, 
  LineChart, 
  BarChart,
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Line, 
  Bar 
} from 'recharts'; // <-- Librería de gráficas
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// --- Formateador para el Tooltip (Ayuda) ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border p-3 rounded-lg shadow-lg">
        <p className="font-bold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: Bs. {Number(entry.value).toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// --- Componente Principal ---
const Graficos = () => {
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [predictionData, setPredictionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);

  // --- Función para cargar todos los datos del dashboard ---
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        const [histData, predData] = await Promise.all([
          getHistoricalSummary(),
          getPredictions(),
        ]);

        // 1. Formatear datos históricos para la gráfica
        const formattedHist = histData.map(item => ({
          ...item,
          total: parseFloat(item.total),
          // Formatear fecha a "Ene 2025"
          name: format(parseISO(item.fecha), "MMM yyyy", { locale: es }),
          "Ventas Históricas": parseFloat(item.total),
        }));
        setHistoricalData(formattedHist);

        // 2. Formatear datos de predicción para la gráfica
        const formattedPred = predData.map(item => ({
          ...item,
          name: format(parseISO(item.fecha), "MMM yyyy", { locale: es }),
          "Predicción": item.prediccion,
        }));

        // 3. Combinar datos para la gráfica de línea
        if (formattedHist.length > 0) {
          const lastHistorical = formattedHist[formattedHist.length - 1];
          // Conectar la línea: el primer punto de predicción es el último punto histórico
          setPredictionData([
            { ...lastHistorical, "Predicción": lastHistorical.total }, 
            ...formattedPred
          ]);
        } else {
          setPredictionData(formattedPred);
        }

      } catch (error: any) {
        toast.error(`Error al cargar datos del dashboard: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // --- Función para el botón de Re-entrenar ---
  const handleRetrain = async () => {
    try {
      setRetraining(true);
      toast.info("🤖 Iniciando re-entrenamiento del modelo... Esto puede tardar.");
      const result = await triggerRetrainModel();
      toast.success(result.status || "Modelo re-entrenado exitosamente.");
    } catch (error: any) {
      toast.error(`Error al re-entrenar: ${error.message}`);
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard de IA</h1>
          <Button onClick={handleRetrain} disabled={retraining}>
            {retraining ? 
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :
              <Brain className="mr-2 h-4 w-4" />
            }
            {retraining ? "Re-entrenando..." : "Re-entrenar Modelo"}
          </Button>
        </div>
        
        {loading ? (
          <div className="flex h-[400px] items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-1">
            
            {/* --- GRÁFICA 1: PREDICCIÓN (LÍNEAS) --- */}
            <Card>
              <CardHeader>
                <CardTitle>Ventas Históricas vs. Predicción de IA</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={[...historicalData, ...predictionData]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `Bs. ${value}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="Ventas Históricas" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Predicción" 
                      stroke="#82ca9d" 
                      strokeWidth={2} 
                      strokeDasharray="5 5" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* --- GRÁFICA 2: HISTÓRICO (BARRAS) --- */}
            <Card>
              <CardHeader>
                <CardTitle>Ventas Históricas Mensuales</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `Bs. ${value}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="total" 
                      fill="#8884d8" 
                      name="Ventas Totales" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          </div>
        )}
      </main>
    </div>
  );
};

export default Graficos;