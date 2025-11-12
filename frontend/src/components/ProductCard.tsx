// src/components/ProductCard.tsx
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import ProductImage from "./ProductImage"; // 👈 Importar el nuevo componente

interface ProductCardProps {
  id: string;
  image: string;
  name: string;
  price: number;
  className?: string;
}

const ProductCard = ({ id, image, name, price, className }: ProductCardProps) => {
  const { addToCart } = useCart();
  
  const handleAddToCart = () => {
    addToCart({ id, name, price, image });
  };

  return (
    <Card className={cn(
      "group overflow-hidden transition-all duration-300 hover:shadow-lg",
      className
    )}>
      <CardContent className="p-4">
        {/* Usar ProductImage en lugar de img directo */}
        <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-muted">
          <ProductImage
            src={image}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        
        <div className="space-y-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-card-foreground">
            {name}
          </h3>
          
          <div className="flex items-center justify-between gap-2">
            <span className="text-lg font-bold text-primary">
              ${price.toFixed(2)}
            </span>
            
            <Button
              size="icon"
              variant="default"
              className="h-9 w-9 shrink-0"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;