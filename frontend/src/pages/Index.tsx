import Navbar from "@/components/Navbar";
import ProductCarousel from "@/components/ProductCarousel";
import BottomNavigation from "@/components/BottomNavigation";

// Import product images
import laptopImg from "@/assets/laptop.jpg";
import headphonesImg from "@/assets/headphones.jpg";
import smartphoneImg from "@/assets/smartphone.jpg";
import smartwatchImg from "@/assets/smartwatch.jpg";
import keyboardImg from "@/assets/keyboard.jpg";
import mouseImg from "@/assets/mouse.jpg";
import webcamImg from "@/assets/webcam.jpg";
import tabletImg from "@/assets/tablet.jpg";

const Index = () => {
  const bestSellers = [
    { id: 1, image: laptopImg, name: "Laptop Premium CLOiFi 15.6\" Core i7", price: 1299.99 },
    { id: 2, image: headphonesImg, name: "Audífonos Bluetooth Noise Cancelling", price: 249.99 },
    { id: 3, image: smartphoneImg, name: "Smartphone 5G 128GB Triple Cámara", price: 899.99 },
    { id: 4, image: smartwatchImg, name: "Smartwatch Deportivo GPS", price: 199.99 },
    { id: 5, image: keyboardImg, name: "Teclado Mecánico RGB Gaming", price: 149.99 },
    { id: 6, image: mouseImg, name: "Mouse Inalámbrico Ergonómico", price: 59.99 },
    { id: 7, image: webcamImg, name: "Webcam 4K con Anillo de Luz", price: 129.99 },
    { id: 8, image: tabletImg, name: "Tablet 10.5\" con Stylus", price: 499.99 },
  ];

  const recommended = [
    { id: 9, image: mouseImg, name: "Mouse Gaming RGB 16000 DPI", price: 79.99 },
    { id: 10, image: keyboardImg, name: "Teclado Compacto Inalámbrico", price: 89.99 },
    { id: 11, image: webcamImg, name: "Webcam Full HD Streaming", price: 89.99 },
    { id: 12, image: headphonesImg, name: "Audífonos Over-Ear Studio", price: 179.99 },
    { id: 13, image: tabletImg, name: "Tablet Android 128GB", price: 399.99 },
    { id: 14, image: smartwatchImg, name: "Smartwatch Premium AMOLED", price: 349.99 },
    { id: 15, image: smartphoneImg, name: "Smartphone Gaming 256GB", price: 1099.99 },
    { id: 16, image: laptopImg, name: "Laptop Ultrabook 13\" i5", price: 899.99 },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1 bg-background">
        <div className="container mx-auto space-y-12 px-4 py-8">
          <ProductCarousel title="Productos más vendidos" products={bestSellers} />
          <ProductCarousel title="Recomendado para ti" products={recommended} />
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Index;
