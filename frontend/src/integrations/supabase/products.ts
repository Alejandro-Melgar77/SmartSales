// src/integrations/products.ts

// 👇 DEFINIR el tipo Product
export interface Product {
  id: number;
  nombre: string;
  descripcion: string;
  precio_venta: number;
  categoria: number;
  categoria_nombre: string;
  imagen: string | null;
  activo: boolean;
  destacado: boolean;
  fecha_creacion: string;
}

export interface Category {
  id: number;
  nombre: string;
  caracteristicas: string;
}

// 👇 DEFINIR API_URL
const API_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

console.log('🔗 API URL configurada:', API_URL);

export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const url = `${API_URL}/products/productos/destacados/`;
    console.log('🔄 Solicitando productos destacados:', url);
    
    const response = await fetch(url);
    
    console.log('📡 Respuesta productos destacados - Status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Error en respuesta destacados:', response.status, response.statusText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📦 Datos crudos de productos destacados:', data);
    
    // 👇 CORREGIDO: Buscar dentro de .results (o data si no está paginado)
    const products = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
    
    console.log(`✅ ${products.length} productos destacados obtenidos correctamente`);
    return products;
    
  } catch (error) {
    console.error('💥 Error fetching featured products:', error);
    return [];
  }
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const url = `${API_URL}/products/productos/`;
    console.log('🔄 Solicitando todos los productos:', url);
    
    const response = await fetch(url);
    
    console.log('📡 Respuesta todos los productos - Status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Error en respuesta todos los productos:', response.status, response.statusText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📦 Datos crudos de todos los productos:', data);
    
    // 👇 CORREGIDO: La API devuelve { count:..., results: [...] }
    const products = Array.isArray(data.results) ? data.results : [];
    
    console.log(`✅ ${products.length} productos totales obtenidos correctamente`);
    return products;
    
  } catch (error) {
    console.error('💥 Error fetching all products:', error);
    return [];
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const url = `${API_URL}/products/categorias/`;
    console.log('🔄 Solicitando todas las categorias:', url);
    
    const response = await fetch(url);
    
    console.log('📡 Respuesta todas las categorias - Status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Error en respuesta todas las categorias:', response.status, response.statusText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📦 Datos crudos de todas las categorias:', data);
    
    // 👇 CORREGIDO: La API devuelve { count:..., results: [...] }
    const categories = Array.isArray(data.results) ? data.results : [];
    
    console.log(`✅ ${categories.length} categorias totales obtenidos correctamente`);
    return categories;
    
  } catch (error) {
    console.error('💥 Error fetching all categories:', error);
    return [];
  }
}

export async function getProductsByCategory(categoryId: number): Promise<Product[]> {
  try {
    const url = `${API_URL}/products/productos/por_categoria/?categoria_id=${categoryId}`;
    console.log('🔄 Solicitando productos por categoría:', url);
    
    const response = await fetch(url);
    
    console.log('📡 Respuesta productos por categoría - Status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Error en respuesta por categoría:', response.status, response.statusText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📦 Datos crudos productos por categoría:', data);
    
    // 👇 CORREGIDO: Asumiendo que este endpoint también puede estar paginado
    const products = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);

    if (!Array.isArray(products)) {
       console.warn('⚠️ getProductsByCategory no devolvió un array, devolvió:', typeof data, data);
       return [];
    }
    
    console.log(`✅ ${products.length} productos por categoría obtenidos correctamente`);
    return products;
    
  } catch (error) {
    console.error('💥 Error fetching products by category:', error);
    return [];
  }
}

// 👇 Función para obtener productos más vendidos
export async function getBestSellers(): Promise<Product[]> {
  try {
    const url = `${API_URL}/products/productos/destacados/`;
    console.log('🔄 Solicitando productos más vendidos:', url);
    
    const response = await fetch(url);
    
    console.log('📡 Respuesta más vendidos - Status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Error en respuesta más vendidos:', response.status, response.statusText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📦 Datos crudos más vendidos:', data);
    
    // 👇 CORREGIDO: Buscar dentro de .results (o data si no está paginado)
    const products = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
    
    console.log(`✅ ${products.length} productos más vendidos obtenidos correctamente`);
    return products;
    
  } catch (error) {
    console.error('💥 Error fetching best sellers:', error);
    return [];
  }
}

// 👇 Función de prueba MEJORADA para diagnosticar problemas
export async function testProductEndpoints(): Promise<void> {
  console.log('🧪 INICIANDO PRUEBA DE ENDPOINTS CON DJANGO...');
  
  const endpoints = [
    { name: 'Todos los productos', url: `${API_URL}/products/productos/` },
    { name: 'Productos destacados', url: `${API_URL}/products/productos/destacados/` },
    { name: 'Categorías', url: `${API_URL}/products/categorias/` }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔗 Probando: ${endpoint.name}`);
      console.log(`📡 URL: ${endpoint.url}`);
      
      const response = await fetch(endpoint.url);
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📦 Tipo de respuesta:`, typeof data);
        console.log(`📦 Datos completos:`, data);

        // 👇 CORREGIDO: Revisar si existe 'data.results'
        if (data && typeof data === 'object' && Array.isArray(data.results)) {
          console.log(`✅ ${endpoint.name}: ÉXITO - ${data.results.length} elementos (Total: ${data.count})`);
          if (data.results.length > 0) {
            console.log(`📝 Primer elemento:`, data.results[0]);
          }
        // 👇 CORRECCIÓN ADICIONAL: Manejar endpoints NO paginados (como /destacados/ quizás)
        } else if (Array.isArray(data)) {
           console.log(`✅ ${endpoint.name}: ÉXITO - ${data.length} elementos (No paginado)`);
           if (data.length > 0) {
            console.log(`📝 Primer elemento:`, data[0]);
          }
        } else {
          console.warn(`⚠️ ${endpoint.name}: La respuesta no es un array ni un objeto paginado -`, data);
        }
      } else {
        console.error(`❌ ${endpoint.name}: FALLÓ - ${response.status} ${response.statusText}`);
        try {
          const errorText = await response.text();
          console.error(`📄 Detalles del error:`, errorText);
        } catch (e) {
          console.error(`📄 No se pudo leer el error`);
        }
      }
    } catch (error) {
      console.error(`💥 ${endpoint.name}: ERROR DE RED -`, error);
    }
  }
  
  console.log('🧪 PRUEBA DE ENDPOINTS COMPLETADA');
}