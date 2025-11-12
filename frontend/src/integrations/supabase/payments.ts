// src/integrations/payments.ts

// --- 👇 AÑADIDO: Importamos el tipo de item del carrito ---
import { CartItem } from "@/contexts/CartContext"; 

export type PaymentResult = {
  id?: number;
  amount?: string;
  method?: string;
  status?: string;
  transaction_id?: string | null;
  approval_url?: string | null;
  error?: any;
  user?: number;
  description?: string;
  created_at?: string;

  // --- 👇 AÑADIDO: Campos que esperamos de la Venta ---
  total?: number;
  estado?: string;
  detalles?: any[]; // Array de detalles de la venta
};

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

export async function processPayment(
  // --- 👇 MODIFICADO: Recibimos los items, no el 'amount' ---
  items: CartItem[], 
  method: string,
  description = "" // Description ya no se usa, pero la dejamos por compatibilidad
): Promise<PaymentResult> {
  
  // --- 👇 MODIFICADO: Nueva URL del endpoint de Ventas ---
  const url = `${API_URL}/sales/ventas/crear-desde-carrito/`;
  
  console.log('🔗 Making SALE request to:', url);
  
  const backendMethod = method === 'efectivo' ? 'cash' : 
                        method === 'paypal' ? 'paypal' : 
                        method;

  // --- 👇 AÑADIDO: Transformamos los items del carrito ---
  // El frontend usa 'id' (string), el backend espera 'producto_id' (number)
  const transformedItems = items.map(item => ({
    producto_id: Number(item.id),
    cantidad: item.quantity
  }));

  // --- 👇 MODIFICADO: Nuevo cuerpo para el VentaCreateSerializer ---
  const body = { 
    items: transformedItems,
    payment_method: backendMethod 
  };

  console.log('📦 Request body:', body);

  try {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      console.error('❌ Token no encontrado en localStorage');
      return { error: "No estás autenticado. Por favor, inicia sesión de nuevo." };
    }
    
    console.log('🔑 Using token:', 'Yes');

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${token}`,
      },
      body: JSON.stringify(body),
    });

    console.log('📡 Response status:', res.status);

    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      console.error('❌ Sale API error:', data);
      // El serializer nos dará errores por campo (ej. "items: [...]")
      const errorDetail = data.error || data.detail || data.items || data.message;
      return { 
        error: errorDetail || `Error ${res.status}: ${res.statusText}` 
      };
    }
    
    console.log('✅ Sale created successfully:', data);
    // 'data' ahora es el objeto VentaSerializer que incluye el estado del pago
    // Lo "aplanamos" para que coincida con el PaymentResult
    return {
      ...data,
      status: data.pago_status // Mapeamos el estado del pago
    } as PaymentResult;
    
  } catch (err) {
    console.error('💥 Network error:', err);
    return { error: "Error de conexión con el servidor" };
  }
}