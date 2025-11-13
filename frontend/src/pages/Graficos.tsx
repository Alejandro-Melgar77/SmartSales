import { useState, useEffect } from "react";
import { BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, TrendingUp, Filter, Calendar, Brain } from "lucide-react";
import { toast } from "sonner";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { getHistoricalData, getProjections, ChartDataPoint } from "@/integrations/supabase/dashboard";
import { getCategories, getAllProducts, Category, Product } from "@/integrations/supabase/products";

const Graficos = () => {
  // --- Estados de Datos ---
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // --- Estados de Filtros Manuales ---
  const [categoriaId, setCategoriaId] = useState("all");
  const [productoId, setProductoId] = useState("all");
  const [metric, setMetric] = useState<'monto' | 'cantidad'>("monto");
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>("area");
  const [startDate, setStartDate] = useState("2025-01-01");
  const [endDate, setEndDate] = useState("2025-12-31");

  // --- Estados de Proyección ---
  const [projectionMonths, setProjectionMonths] = useState("6");
  const [showProjection, setShowProjection] = useState(false);

  // --- UI States ---
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  // Cargar listas iniciales
  useEffect(() => {
    const loadLists = async () => {
      const [cats, prods] = await Promise.all([getCategories(), getAllProducts()]);
      setCategories(cats);
      setProducts(prods);
      fetchData(); // Carga inicial
    };
    loadLists();
  }, []);

  // Función principal de carga
  const fetchData = async () => {
    setLoading(true);
    setShowProjection(false); // Resetear proyección al cambiar filtros base
    try {
      const data = await getHistoricalData({
        categoria_id: categoriaId,
        producto_id: productoId,
        metric: metric,
        start_date: startDate,
        end_date: endDate
      });
      
      // Formatear para gráfico
      const formatted = data.map(d => ({
        ...d,
        name: format(parseISO(d.fecha), "MMM yy", { locale: es }),
        "Histórico": d.valor
      }));
      
      setChartData(formatted);
    } catch (error) {
      toast.error("Error al cargar datos históricos");
    } finally {
      setLoading(false);
    }
  };

  // Función para generar proyección
  const handleGenerateProjection = async () => {
    setGeneratingAI(true);
    try {
      const predictions = await getProjections({
        categoria_id: categoriaId,
        producto_id: productoId,
        metric: metric,
        months: parseInt(projectionMonths)
      });

      // Combinar datos: Tomar el último punto histórico para conectar la línea
      const lastHistorical = chartData[chartData.length - 1];
      
      const formattedPreds = predictions.map(p => ({
        fecha: p.fecha,
        name: format(parseISO(p.fecha), "MMM yy", { locale: es }),
        "Proyección": p.prediccion
      }));

      // Añadir punto de conexión si existe historia
      let finalData = [...chartData];
      if (lastHistorical) {
        formattedPreds.unshift({
          ...lastHistorical,
          "Proyección": lastHistorical["Histórico"] // El punto de unión
          ,
          name: ""
        });
      }

      // Unir arrays (filtrando duplicados de fecha si es necesario)
      // Para visualización simple, solo concatenamos los nuevos puntos de proyección (menos el de unión que ya ajustamos)
      const newPoints = formattedPreds.filter(p => !chartData.find(h => h.fecha === p.fecha));
      
      // Actualizamos el dataset del gráfico mezclando ambos
      // Nota: Recharts maneja claves faltantes (puntos futuros no tienen 'Histórico')
      setChartData([...chartData, ...newPoints]);
      setShowProjection(true);
      toast.success("Proyección generada con IA");

    } catch (error: any) {
      toast.error(error.message || "No se pudo generar la proyección");
    } finally {
      setGeneratingAI(false);
    }
  };

  // Renderizador del Gráfico Dinámico
  const renderChart = () => {
    const CommonAxis = [
      <CartesianGrid key="grid" strokeDasharray="3 3" opacity={0.3} />,
      <XAxis key="xaxis" dataKey="name" style={{ fontSize: '12px' }} />,
      <YAxis key="yaxis" style={{ fontSize: '12px' }} tickFormatter={(val) => metric === 'monto' ? `Bs ${val}` : val} />,
      <Tooltip 
        key="tooltip"
        contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
        formatter={(val: number) => metric === 'monto' ? `Bs ${val.toFixed(2)}` : val}
      />,
      <Legend key="legend" />
    ];

    if (chartType === 'bar') {
      return (
        <BarChart data={chartData}>
          {CommonAxis}
          <Bar dataKey="Histórico" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          {showProjection && <Bar dataKey="Proyección" fill="#10b981" radius={[4, 4, 0, 0]} />}
        </BarChart>
      );
    }
    if (chartType === 'line') {
      return (
        <LineChart data={chartData}>
          {CommonAxis}
          <Line type="monotone" dataKey="Histórico" stroke="#3b82f6" strokeWidth={3} dot={{r:4}} />
          {showProjection && <Line type="monotone" dataKey="Proyección" stroke="#10b981" strokeWidth={3} strokeDasharray="5 5" dot={{r:4}} />}
        </LineChart>
      );
    }
    return (
      <AreaChart data={chartData}>
        {CommonAxis}
        <defs>
          <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="Histórico" stroke="#3b82f6" fillOpacity={1} fill="url(#colorHist)" />
        {showProjection && <Area type="monotone" dataKey="Proyección" stroke="#10b981" fillOpacity={1} fill="url(#colorProj)" />}
      </AreaChart>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
          
          {/* --- ÁREA PRINCIPAL DE GRÁFICO (Izquierda - Grande) --- */}
          <Card className="flex-1 flex flex-col shadow-lg border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <TrendingUp className="h-6 w-6 text-primary" />
                Análisis de {metric === 'monto' ? 'Ingresos' : 'Volumen de Ventas'}
              </CardTitle>
              <CardDescription>
                Visualización dinámica de datos históricos y proyecciones
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pt-4">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary/50" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart()}
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* --- BARRA LATERAL (Derecha - Controles) --- */}
          <div className="w-full lg:w-80 space-y-6 overflow-y-auto pr-1">
            
            {/* 1. Panel de Filtros Históricos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Filtros de Visualización
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="space-y-2">
                  <Label>Métrica</Label>
                  <Select value={metric} onValueChange={(v: any) => setMetric(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monto">💰 Ingresos (Bs)</SelectItem>
                      <SelectItem value="cantidad">📦 Cantidad (Unidades)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={categoriaId} onValueChange={setCategoriaId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las Categorías</SelectItem>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Producto Específico</Label>
                  <Select value={productoId} onValueChange={setProductoId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los productos</SelectItem>
                      {products
                        .filter(p => categoriaId === 'all' || p.categoria.toString() === categoriaId)
                        .map(p => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Gráfico</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant={chartType === 'area' ? 'default' : 'outline'} size="sm" onClick={() => setChartType('area')}>Área</Button>
                    <Button variant={chartType === 'bar' ? 'default' : 'outline'} size="sm" onClick={() => setChartType('bar')}>Barras</Button>
                    <Button variant={chartType === 'line' ? 'default' : 'outline'} size="sm" onClick={() => setChartType('line')}>Línea</Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Desde</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hasta</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>

                <Button className="w-full" onClick={fetchData} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar Gráfico"}
                </Button>
              </CardContent>
            </Card>

            {/* 2. Panel de Proyección (IA) */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" /> Proyección IA
                </CardTitle>
                <CardDescription className="text-xs">
                  Estimar tendencias futuras basadas en los filtros actuales.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Meses a proyectar</Label>
                  <Select value={projectionMonths} onValueChange={setProjectionMonths}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">Próximos 3 meses</SelectItem>
                      <SelectItem value="6">Próximos 6 meses</SelectItem>
                      <SelectItem value="12">Próximo año</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
                  onClick={handleGenerateProjection}
                  disabled={generatingAI || loading}
                >
                  {generatingAI ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculando...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" /> Generar Proyección
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Graficos;