import { useState, useEffect } from "react";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Venta, getSalesHistory, downloadSaleFile } from "@/integrations/supabase/sales"; // Usamos la nueva API
import { format } from "date-fns"; // Para formatear fechas (opcional pero recomendado)
// Si no tienes date-fns: npm install date-fns

const NotasVenta = () => {
  const [sales, setSales] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null); // Para saber qué ID se está descargando

  useEffect(() => {
    const loadSales = async () => {
      try {
        setLoading(true);
        const salesData = await getSalesHistory();
        setSales(salesData);
      } catch (error: any) {
        toast.error(`Error al cargar el historial: ${error.message}`);
        console.error('Error fetching sales:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSales();
  }, []);

  const handleDownload = async (ventaId: number, format: 'pdf' | 'excel') => {
    try {
      setDownloading(ventaId); // Bloquea el botón
      toast.info(`Generando ${format.toUpperCase()} para venta #${ventaId}...`);
      
      await downloadSaleFile(ventaId, format);
      
      toast.success(`${format.toUpperCase()} descargado exitosamente.`);
    } catch (error: any) {
      toast.error(`Error al descargar: ${error.message}`);
      console.error('Download error:', error);
    } finally {
      setDownloading(null); // Desbloquea el botón
    }
  };
  
  // Función para dar color al estado
  const getBadgeVariant = (estado: string): "default" | "secondary" | "destructive" | "outline" => {
    if (estado === 'COMPLETADO') return 'default';
    if (estado === 'PROCESANDO') return 'secondary';
    if (estado === 'CANCELADO') return 'destructive';
    return 'outline';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Mis Notas de Venta</h1>
        
        {sales.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tienes ninguna nota de venta registrada.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sales.map((venta) => (
              <Card key={venta.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Venta #{venta.id}</CardTitle>
                    <CardDescription>
                      {/* Formateamos la fecha */}
                      {format(new Date(venta.fecha_creacion), "dd/MM/yyyy 'a las' HH:mm")}
                    </CardDescription>
                  </div>
                  <Badge variant={getBadgeVariant(venta.estado)}>
                    {venta.get_estado_display}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible>
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Ver Detalles del Pedido</AccordionTrigger>
                      <AccordionContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Producto</TableHead>
                              <TableHead className="text-right">Cantidad</TableHead>
                              <TableHead className="text-right">P. Unitario</TableHead>
                              <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {venta.detalles.map((detalle) => (
                              <TableRow key={detalle.id}>
                                <TableCell>{detalle.nombre_producto}</TableCell>
                                <TableCell className="text-right">{detalle.cantidad}</TableCell>
                                <TableCell className="text-right">Bs. {Number(detalle.precio_unitario).toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                  Bs. {(Number(detalle.precio_unitario) * detalle.cantidad).toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <div className="text-lg font-bold">
                    Total: <span className="text-primary">Bs. {Number(venta.total).toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={downloading === venta.id}
                      onClick={() => handleDownload(venta.id, 'pdf')}
                    >
                      {downloading === venta.id ? 
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                        <FileText className="mr-2 h-4 w-4" />
                      }
                      PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={downloading === venta.id}
                      onClick={() => handleDownload(venta.id, 'excel')}
                    >
                      {downloading === venta.id ? 
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                      }
                      Excel
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default NotasVenta;