import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";

interface ProductCardProps {
  id: string;
  image: string;
  name: string;
  price: number;
}

const ProductCard = ({ id, image, name, price }: ProductCardProps) => {
  const { addToCart } = useCart();
  
  const handleAddToCart = () => {
    addToCart({ id, name, price, image });
  };

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-hover)]">
      <CardContent className="p-4">
        <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-muted">
          <img
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
