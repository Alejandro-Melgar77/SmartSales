import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader,
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { processPayment } from "@/integrations/supabase/payments";
import { useCart } from "@/contexts/CartContext";
import Navbar from "@/components/Navbar";

const Pago = () => {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { items, total, clearCart } = useCart(); // 'items' y 'total' ya están aquí
  const navigate = useNavigate();

  const handleConfirmPayment = async () => {
    if (!paymentMethod) {
      toast.error("Seleccione un método de pago");
      return;
    }

    if (items.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    setIsProcessing(true);

    try {
      console.log('🛒 Starting payment process...');
      
      // --- 👇 MODIFICACIÓN CLAVE ---
      // Ahora pasamos 'items' (el carrito) en lugar de 'total'
      const result = await processPayment(items, paymentMethod, `Compra de ${items.length} productos`);
      // --- 👆 FIN DE LA MODIFICACIÓN ---

      console.log('📄 Payment result:', result);

      if (result.error) {
        console.error("❌ Payment error:", result.error);
        // 'result.error' puede ser un array de errores del serializer
        const errorMessage = Array.isArray(result.error) ? result.error.join(', ') : result.error;
        toast.error(errorMessage || "Error al procesar el pago");
        return;
      }

      // Manejar respuesta exitosa
      // El 'result.status' ahora viene de 'pago_status'
      if (result.status === "Completado" || result.status === "Pendiente") {
        const statusMessage = result.status === 'Completado' ? 'completado' : 'registrado';
        toast.success(`Pago ${statusMessage} exitosamente`);
        
        console.log("✅ Payment details:", result);
        
        // Limpiar carrito y redirigir
        clearCart();
        setTimeout(() => navigate("/"), 2000);
      } else {
        toast.info(`Pago procesado. Estado: ${result.status || "desconocido"}`);
      }

    } catch (err) {
      console.error("💥 Unexpected error:", err);
      toast.error("Error inesperado al procesar el pago");
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentMethodDisplay = (method: string) => {
    const methods: { [key: string]: string } = {
      'efectivo': 'Efectivo',
      'paypal': 'PayPal', 
      'stripe': 'Stripe',
      'cash': 'Efectivo'
    };
    return methods[method] || method;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Proceso de Pago</h1>
        
        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Método de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="paypal" id="paypal" />
                  <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      <span>PayPal</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pago seguro con PayPal
                    </p>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                  {/* 👇 Corregido: el valor debe ser 'efectivo' para coincidir con el estado */}
                  <RadioGroupItem value="efectivo" id="efectivo" />
                  <Label htmlFor="efectivo" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      <span>Efectivo</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pago al momento de la entrega
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="max-h-60 overflow-y-auto space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                      </div>
                      <span className="font-semibold">Bs. {item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">Bs. {total}</span>
                  </div>
                </div>

                {paymentMethod && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Método seleccionado: <span className="font-medium text-foreground">
                        {getPaymentMethodDisplay(paymentMethod)}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    className="mt-6 w-full" 
                    disabled={!paymentMethod || isProcessing || items.length === 0}
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Confirmar Pago"
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Pago</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Está seguro de realizar este pago de <strong>Bs. {total}</strong> 
                      mediante <strong>{getPaymentMethodDisplay(paymentMethod)}</strong>?
                      Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleConfirmPayment}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Confirmar Pago
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Pago;