// src/integrations/supabase/dashboard.ts

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

// --- Tipo de dato para las ventas históricas ---
export interface HistoricalDataPoint {
  fecha: string; // "2025-08-01"
  total: string; // "15000.00"
}

// --- Tipo de dato para las predicciones ---
export interface PredictionDataPoint {
  fecha: string; // "2025-11-01"
  prediccion: number; // 16000.50
}

/**
 * Obtiene los datos de ventas históricas (agrupados por mes)
 * para la gráfica de barras.
 */
export async function getHistoricalSummary(): Promise<HistoricalDataPoint[]> {
  const url = `${API_URL}/sales/dashboard/historical-summary/`;
  const token = localStorage.getItem('auth_token');

  if (!token) throw new Error("No estás autenticado.");

  try {
    const response = await fetch(url, {
      headers: { "Authorization": `Token ${token}` },
    });
    if (!response.ok) throw new Error("Error al cargar el historial");
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("💥 Error en getHistoricalSummary:", err);
    throw err;
  }
}

/**
 * Obtiene las predicciones de ventas futuras del modelo de IA
 * para la gráfica de líneas.
 */
export async function getPredictions(): Promise<PredictionDataPoint[]> {
  const url = `${API_URL}/sales/dashboard/predictions/`;
  const token = localStorage.getItem('auth_token');

  if (!token) throw new Error("No estás autenticado.");

  try {
    const response = await fetch(url, {
      headers: { "Authorization": `Token ${token}` },
    });
    if (!response.ok) throw new Error("Error al cargar predicciones");
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("💥 Error en getPredictions:", err);
    throw err;
  }
}

/**
 * (Admin) Lanza el re-entrenamiento del modelo de IA en el backend.
 */
export async function triggerRetrainModel(): Promise<any> {
  const url = `${API_URL}/sales/dashboard/retrain-model/`;
  const token = localStorage.getItem('auth_token');

  if (!token) throw new Error("No estás autenticado.");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Token ${token}` },
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Error al re-entrenar el modelo");
    }
    return data;
  } catch (err) {
    console.error("💥 Error en triggerRetrainModel:", err);
    throw err;
  }
}