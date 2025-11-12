// src/integrations/sales.ts

// --- 1. Definimos los tipos de datos que esperamos del backend ---

export interface VentaDetalle {
  id: number;
  producto: number;
  nombre_producto: string;
  precio_unitario: string; // Django DecimalFields a veces vienen como string
  cantidad: number;
}

export interface Venta {
  id: number;
  usuario: any; // Puedes definir un tipo User simple si quieres
  pago: number;
  pago_status: string;
  pago_method: string;
  total: string; // Django DecimalFields a veces vienen como string
  estado: string;
  get_estado_display: string;
  fecha_creacion: string;
  detalles: VentaDetalle[];
}

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

// --- 2. Función para OBTENER el historial de ventas ---

export async function getSalesHistory(): Promise<Venta[]> {
  const url = `${API_URL}/sales/ventas/`;
  console.log('🔗 Fetching sales history from:', url);
  
  const token = localStorage.getItem('auth_token');
  if (!token) {
    console.error('❌ Token no encontrado');
    throw new Error("No estás autenticado.");
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Recuerda la paginación de Django
    const sales = Array.isArray(data.results) ? data.results : [];
    console.log(`✅ ${sales.length} sales fetched.`);
    return sales;

  } catch (err) {
    console.error('💥 Error fetching sales history:', err);
    throw err; // Relanzamos el error para que la página lo capture
  }
}

// --- 3. Función para DESCARGAR archivos ---

export async function downloadSaleFile(ventaId: number, format: 'pdf' | 'excel'): Promise<void> {
  const url = `${API_URL}/sales/ventas/${ventaId}/download-${format}/`;
  console.log(`🔗 Downloading ${format} from:`, url);
  
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error("No estás autenticado.");
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Token ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    // Convertimos la respuesta en un "Blob" (un archivo binario)
    const blob = await response.blob();
    
    // Creamos una URL temporal en el navegador para ese archivo
    const fileUrl = window.URL.createObjectURL(blob);
    
    // Creamos un link <a> invisible y le hacemos clic para descargar
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = `venta_${ventaId}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    document.body.appendChild(a);
    a.click();
    
    // Limpiamos
    window.URL.revokeObjectURL(fileUrl);
    a.remove();

  } catch (err) {
    console.error(`💥 Error downloading ${format}:`, err);
    throw err;
  }
}