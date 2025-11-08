from apps.products.models import Categoria

def run():
    """Seeder para categorías"""
    print("📂 Creando categorías...")
    
    categorias = [
        {
            'nombre': 'Televisores',
            'caracteristicas': 'Smart TVs, 4K, OLED, QLED, Android TV'
        },
        {
            'nombre': 'Celulares',
            'caracteristicas': 'Smartphones, Tablets, Accesorios móviles'
        },
        {
            'nombre': 'Electrodomésticos',
            'caracteristicas': 'Línea blanca, cocina, hogar'
        },
        {
            'nombre': 'Audio',
            'caracteristicas': 'Audífonos, Parlantes, Soundbars, Home Theater'
        },
        {
            'nombre': 'Computación',
            'caracteristicas': 'Laptops, PCs, Monitores, Periféricos'
        }
    ]
    
    categorias_creadas = []
    for cat_data in categorias:
        categoria, created = Categoria.objects.get_or_create(
            nombre=cat_data['nombre'],
            defaults=cat_data
        )
        categorias_creadas.append(categoria)
        status = "✅ CREADA" if created else "📝 EXISTENTE"
        print(f"{status} Categoría: {categoria.nombre}")
    
    return categorias_creadas