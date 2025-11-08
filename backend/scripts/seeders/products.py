from apps.products.models import Producto, Categoria

def run():
    """Seeder para productos"""
    print("📦 Creando productos...")
    
    # Obtener categorías
    categorias = {cat.nombre: cat for cat in Categoria.objects.all()}
    
    productos = [
        # TELEVISORES
        {
            'nombre': 'Smart TV Samsung 55" 4K UHD',
            'descripcion': 'Televisor smart con resolución 4K, HDR10+, Tizen OS, 3 HDMI',
            'precio_venta': 599.99,
            'categoria': categorias['Televisores'],
            'destacado': True
        },
        {
            'nombre': 'LG OLED 65" 4K Smart TV',
            'descripcion': 'OLED con perfect black, AI ThinQ, Dolby Vision, webOS',
            'precio_venta': 1299.99,
            'categoria': categorias['Televisores'],
            'destacado': True
        },
        # CELULARES
        {
            'nombre': 'Samsung Galaxy S24 Ultra',
            'descripcion': '256GB, 5G, S Pen, Cámara 200MP, Snapdragon 8 Gen 3',
            'precio_venta': 1199.99,
            'categoria': categorias['Celulares'],
            'destacado': True
        },
        {
            'nombre': 'iPhone 15 Pro Max',
            'descripcion': '256GB, 5G, Dynamic Island, Cámara 48MP, Titanio',
            'precio_venta': 1299.99,
            'categoria': categorias['Celulares'],
            'destacado': True
        },
        # ELECTRODOMÉSTICOS
        {
            'nombre': 'Refrigerador Samsung French Door',
            'descripcion': '628L, Dispensador de agua y hielo, Twin Cooling Plus',
            'precio_venta': 1599.99,
            'categoria': categorias['Electrodomésticos'],
            'destacado': True
        },
        # AUDIO
        {
            'nombre': 'Audífonos Sony WH-1000XM5',
            'descripcion': 'Cancelación de ruido, 30h batería, Alexa, Google Assistant',
            'precio_venta': 349.99,
            'categoria': categorias['Audio'],
            'destacado': True
        },
        # COMPUTACIÓN
        {
            'nombre': 'Laptop Dell XPS 13',
            'descripcion': '13.4" FHD+, Core i7, 16GB RAM, 512GB SSD, Windows 11',
            'precio_venta': 1299.99,
            'categoria': categorias['Computación'],
            'destacado': True
        }
    ]
    
    for prod_data in productos:
        producto, created = Producto.objects.get_or_create(
            nombre=prod_data['nombre'],
            defaults=prod_data
        )
        status = "✅ CREADO" if created else "📝 EXISTENTE"
        print(f"{status} Producto: {producto.nombre} - ${producto.precio_venta}")