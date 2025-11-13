// src/pages/Index.tsx
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProductCarousel from "@/components/ProductCarousel";
import BottomNavigation from "@/components/BottomNavigation";
import { Product, getFeaturedProducts, getAllProducts } from "@/integrations/supabase/products";

const Index = () => {
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log("🔄 Cargando productos desde el backend...");
        
        const [featuredProducts, allProducts] = await Promise.all([
          getFeaturedProducts(),
          getAllProducts()
        ]);
        
        console.log(`✅ ${featuredProducts.length} productos destacados cargados`);
        console.log(`✅ ${allProducts.length} productos totales cargados`);
        
        setBestSellers(featuredProducts);
        
        
        // 👇 VERIFICACIÓN DE SEGURIDAD - asegurar que allProducts es array
        const safeAllProducts = Array.isArray(allProducts) ? allProducts : [];
        const safeFeaturedProducts = Array.isArray(featuredProducts) ? featuredProducts : [];
        
        const nonFeaturedProducts = safeAllProducts.filter(
          product => !safeFeaturedProducts.some(featured => featured.id === product.id)
        );
        
        //const recommendedProducts = nonFeaturedProducts.slice(0, 8);
        const recommendedProducts = allProducts.slice(0, 8);

        setRecommended(recommendedProducts);
        
      } catch (error) {
        console.error("❌ Error cargando productos:", error);
        // 👇 Asegurar estados vacíos en caso de error
        setBestSellers([]);
        setRecommended([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Función para construir URLs de imagen
  const getProductImageUrl = (product: Product): string | null => {
    if (!product.imagen) {
      return null;
    }

    if (product.imagen.startsWith('http')) {
      return product.imagen;
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
    
    if (product.imagen.startsWith('/')) {
      return `${baseUrl}${product.imagen}`;
    }
    
    return `${baseUrl}/media/${product.imagen}`;
  };

  // Transformar productos
  const transformProducts = (products: Product[]) => {
    // 👇 Verificación adicional de seguridad
    if (!Array.isArray(products)) {
      console.warn('⚠️ transformProducts recibió no-array:', products);
      return [];
    }
    
    return products.map(product => ({
      id: product.id,
      image: getProductImageUrl(product),
      name: product.nombre,
      price: Number(product.precio_venta)
    }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-muted-foreground">Cargando productos...</div>
            </div>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1 bg-background">
        <div className="container mx-auto space-y-12 px-4 py-8">
          {bestSellers.length > 0 && (
            <ProductCarousel 
              title="Productos más vendidos" 
              products={transformProducts(bestSellers)} 
            />
          )}
          
          {recommended.length > 0 && (
            <ProductCarousel 
              title="Recomendado para ti" 
              products={transformProducts(recommended)} 
            />
          )}
          
          {bestSellers.length === 0 && recommended.length === 0 && !loading && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-muted-foreground">
                No hay productos disponibles
              </h2>
              <p className="text-muted-foreground mt-2">
                Intenta recargar la página o verifica la conexión con el servidor.
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Index;