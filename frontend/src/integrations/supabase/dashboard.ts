const API_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

export interface ChartDataPoint {
  fecha: string;
  valor?: number; // Histórico
  prediccion?: number; // Futuro
}

export interface DashboardFilters {
  categoria_id: string;
  producto_id: string;
  metric: 'monto' | 'cantidad';
  start_date?: string;
  end_date?: string;
  months?: number; // Para proyección
}

export async function getHistoricalData(filters: DashboardFilters): Promise<ChartDataPoint[]> {
  const url = `${API_URL}/sales/dashboard/historical-data/`;
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error("No estás autenticado.");

  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      "Authorization": `Token ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(filters)
  });
  
  if (!response.ok) throw new Error("Error al cargar historial");
  return response.json();
}

export async function getProjections(filters: DashboardFilters): Promise<ChartDataPoint[]> {
  const url = `${API_URL}/sales/dashboard/generate-prediction/`;
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error("No estás autenticado.");

  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      "Authorization": `Token ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(filters)
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Error al generar proyección");
  return data;
}