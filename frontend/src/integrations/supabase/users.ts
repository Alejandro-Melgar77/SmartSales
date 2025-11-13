// Crea este archivo en: frontend/src/integrations/supabase/users.ts

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role_display: string;
}

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

export async function getAllUsers(): Promise<User[]> {
  const url = `${API_URL}/users/users/`;
  console.log('🔗 Fetching all users from:', url);
  
  const token = localStorage.getItem('auth_token');
  if (!token) {
    console.error('❌ Token no encontrado');
    return []; // Devuelve vacío si no está autenticado
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
    
    // Asumimos paginación
    const users = Array.isArray(data.results) ? data.results : [];
    console.log(`✅ ${users.length} users fetched.`);
    return users;

  } catch (err) {
    console.error('💥 Error fetching all users:', err);
    return [];
  }
}