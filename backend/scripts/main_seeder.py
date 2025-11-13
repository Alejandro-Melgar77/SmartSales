import os
import django
import sys

# Configurar Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smartsales_config.settings')
django.setup()

# --- 👇 1. IMPORTAR EL NUEVO SEEDER Y MODELOS ---
from scripts.seeders import categories, products, users, sales
from apps.products.models import Producto, Categoria
from apps.users.models import User, Rol, Permiso
from apps.sales.models import Venta, DetalleVenta
# --- --------------------------------------- ---

def main():
    """Ejecutar todos los seeders"""
    print("🚀 INICIANDO POBLACIÓN COMPLETA DEL SISTEMA")
    print("=" * 60)
    
    # Ejecutar seeders en orden
    print("📦 CARGANDO DATOS DE PRODUCTOS...")
    categorias_creadas = categories.run()
    print("-" * 40)
    
    productos_creados = products.run()
    print("-" * 40)
    
    print("👥 CARGANDO SISTEMA DE USUARIOS Y PERMISOS...")
    usuarios_creados, usuarios_existentes = users.run()
    print("-" * 40)
    
    # --- 👇 2. AÑADIR SECCIÓN PARA VENTAS HISTÓRICAS (230 VENTAS) ---
    print("📈 CARGANDO DATOS HISTÓRICOS DE VENTAS (PARA IA)...")
    
    # Mes de Agosto 2025
    sales.run(year=2025, month=8, num_sales=60) 
    
    # Mes de Septiembre 2025
    sales.run(year=2025, month=9, num_sales=80)
    
    # Mes de Octubre 2025
    sales.run(year=2025, month=10, num_sales=90)
    
    print("-" * 40)
    # --- ---------------------------------------------------- ---
    
    # Resumen final completo
    print("🎉 RESUMEN FINAL COMPLETO DEL SISTEMA:")
    print("   📊 PRODUCTOS:")
    print(f"       📂 Categorías: {Categoria.objects.count()}")
    print(f"       📦 Productos: {Producto.objects.count()}")
    print(f"       ⭐ Productos destacados: {Producto.objects.filter(destacado=True).count()}")
    
    print("   👥 USUARIOS Y SEGURIDAD:")
    print(f"       🔐 Permisos: {Permiso.objects.count()}")
    print(f"       🎭 Roles: {Rol.objects.count()}")
    print(f"       👤 Usuarios totales: {User.objects.count()}")
    print(f"       👑 Administradores: {User.objects.filter(role='admin').count()}")
    print(f"       💼 Vendedores: {User.objects.filter(role='seller').count()}")
    print(f"       👥 Clientes: {User.objects.filter(role='customer').count()}")
    print(f"       ✅ Nuevos usuarios: {usuarios_creados}")
    print(f"       📝 Usuarios existentes: {usuarios_existentes}")
        
    # --- 👇 3. AÑADIR RESUMEN DE VENTAS ---
    print("   📈 VENTAS (IA):")
    print(f"       🧾 Notas de Venta: {Venta.objects.count()}")
    print(f"       🛒 Items Vendidos: {DetalleVenta.objects.count()}")
    print(f"       (Total de {Venta.objects.count()} ventas históricas añadidas)")
    # --- ------------------------------- ---
    
    print("   🔗 DATOS DE PRUEBA:")
    print(f"       🏪 Categorías disponibles: {', '.join([c.nombre for c in Categoria.objects.all()[:5]])}...")
    print(f"       👤 Usuario admin: admin / admin123")
    print(f"       👤 Tu usuario: ale / ale123")
    print(f"       💼 Vendedor demo: vendedor1 / vendedor123")
    
    print("=" * 60)
    print("🎊 ¡POBLACIÓN DEL SISTEMA COMPLETADA EXITOSAMENTE!")
    print("📍 URLs importantes:")
    print("   🌐 Frontend: http://localhost:5173") # O el puerto que uses (ej. 8080)
    print("   🔧 Backend API: http://localhost:8000/api/")
    print("   📊 Admin Django: http://localhost:8000/admin/")
    print("=" * 60)

if __name__ == '__main__':
    main()