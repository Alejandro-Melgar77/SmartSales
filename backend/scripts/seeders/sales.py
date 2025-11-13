import random
from decimal import Decimal
from datetime import datetime
from django.utils import timezone
from django.db import transaction

from apps.sales.models import Venta, DetalleVenta
from apps.payments.models import Payment
from apps.products.models import Producto
from apps.users.models import User

# Helper para saber los días del mes
def days_in_month(year, month):
    if month == 9 or month == 4 or month == 6 or month == 11:
        return 30
    elif month == 2:
        return 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28
    else:
        return 31

@transaction.atomic # ¡Muy importante! Hace que todo el proceso sea una sola operación
def run(year=2025, month=8, num_sales=75):
    """
    Seeder para crear ventas históricas para la IA.
    """
    print(f"📈 Creando {num_sales} ventas para {year}-{month}...")
    
    # --- 1. Obtener los datos base ---
    try:
        # Usamos list() para traerlos a memoria y evitar consultas repetidas
        all_products = list(Producto.objects.all())
        all_customers = list(User.objects.filter(role='customer'))
        
        if not all_products:
            print("❌ ERROR: No hay productos en la base de datos. Ejecuta el seeder de productos primero.")
            return
        if not all_customers:
            print("❌ ERROR: No hay clientes en la base de datos. Ejecuta el seeder de usuarios primero.")
            return

    except Exception as e:
        print(f"❌ ERROR: Faltan modelos (Producto o User). ¿Corriste las migraciones? {e}")
        return

    # --- 2. Bucle de creación de ventas ---
    ventas_creadas = 0
    max_day = days_in_month(year, month)
    
    for i in range(num_sales):
        # --- 3. Crear los detalles (el carrito) ---
        
        # Seleccionar un cliente al azar
        customer = random.choice(all_customers)
        
        # Seleccionar de 1 a 3 productos diferentes para el carrito
        num_items_in_cart = random.randint(1, 3)
        products_in_cart = random.sample(all_products, num_items_in_cart)
        
        sale_total = Decimal('0.0')
        detalles_para_crear = []

        for product in products_in_cart:
            # Comprar de 1 a 2 unidades de cada producto
            quantity = random.randint(1, 2)
            price = product.precio_venta # Es un Decimal
            subtotal = price * quantity
            sale_total += subtotal
            
            # Preparamos el objeto, pero no lo guardamos aún
            detalles_para_crear.append(
                DetalleVenta(
                    # 'venta' se asignará después
                    producto=product,
                    nombre_producto=product.nombre, # Snapshot del nombre
                    precio_unitario=price, # Snapshot del precio
                    cantidad=quantity
                )
            )

        # --- 4. Crear Fecha y Pago ---
        
        # Crear una fecha y hora aleatoria dentro del mes
        day = random.randint(1, max_day)
        hour = random.randint(9, 20) # Horario comercial
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        
        # Creamos la fecha (naive)
        sale_time = datetime(year, month, day, hour, minute, second)
        # La hacemos "aware" (consciente de la zona horaria)
        sale_time_aware = timezone.make_aware(sale_time)
        
        # Crear el Pago
        payment = Payment(
            user=customer,
            amount=sale_total,
            method=random.choice(['cash', 'paypal']),
            status='completed', # Son ventas pasadas
        )
        payment.save()
        # Sobreescribimos la fecha de creación (para que no sea 'ahora')
        Payment.objects.filter(id=payment.id).update(created_at=sale_time_aware, updated_at=sale_time_aware)

        # --- 5. Crear la Venta (Encabezado) ---
        venta = Venta(
            usuario=customer,
            pago=payment,
            total=sale_total,
            estado='COMPLETADO'
        )
        venta.save()
        # Sobreescribimos la fecha de creación
        Venta.objects.filter(id=venta.id).update(fecha_creacion=sale_time_aware, fecha_actualizacion=sale_time_aware)

        # --- 6. Guardar los Detalles ---
        
        # Asignamos la Venta recién creada a los detalles
        for detalle in detalles_para_crear:
            detalle.venta = venta
        
        # Guardamos todos los detalles en una sola consulta (¡muy rápido!)
        DetalleVenta.objects.bulk_create(detalles_para_crear)
        # Sobreescribimos sus fechas también
        DetalleVenta.objects.filter(venta=venta).update(fecha_creacion=sale_time_aware)
        
        ventas_creadas += 1
        
    print(f"  ✅ {ventas_creadas} ventas creadas para {year}-{month}.")
    return ventas_creadas