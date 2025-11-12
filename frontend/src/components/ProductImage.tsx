// src/components/ProductImage.tsx
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

const ProductImage = ({ src, alt, className }: ProductImageProps) => {
  const [imageError, setImageError] = useState(false);

  // Imagen por defecto
  const defaultImage = (
    <div 
      className={cn(
        "bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center",
        className
      )}
    >
      <div className="text-center text-gray-400">
        <div className="text-2xl mb-2">📷</div>
        <div className="text-xs">Imagen no disponible</div>
      </div>
    </div>
  );

  // Si no hay src o hay error, mostrar imagen por defecto
  if (!src || imageError) {
    return defaultImage;
  }

  // Si hay src y no hay error, mostrar la imagen
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
};

export default ProductImage;