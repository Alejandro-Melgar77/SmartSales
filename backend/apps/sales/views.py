from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction  # Para asegurar que todo se cree o nada (atomicidad)

from .models import Venta, DetalleVenta
from .serializers import VentaSerializer, VentaCreateSerializer
from apps.products.models import Producto
from apps.payments.models import Payment

class VentaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint que permite a los usuarios ver sus Notas de Venta.
    La creación se maneja por una acción personalizada.
    """
    serializer_class = VentaSerializer
    permission_classes = [permissions.IsAuthenticated] # Solo usuarios logueados

    def get_queryset(self):
        """
        Sobreescribimos para que cada usuario vea solo sus propias ventas.
        """
        return Venta.objects.filter(usuario=self.request.user).order_by('-fecha_creacion')

    @action(detail=False, methods=['post'], url_path='crear-desde-carrito')
    @transaction.atomic # Si algo falla, revierte todos los cambios en la BD
    def crear_desde_carrito(self, request):
        """
        Crea una Venta, sus Detalles, y un Pago a partir de un carrito.
        Recibe:
        {
            "items": [ { "producto_id": 1, "cantidad": 2 }, ... ],
            "payment_method": "cash"
        }
        """
        serializer = VentaCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        items_data = validated_data['items']
        payment_method = validated_data['payment_method']
        user = request.user
        
        total_calculado = 0
        detalles_para_crear = []
        
        # --- 1. Validar y calcular el total (¡Importante: en el backend!) ---
        try:
            for item in items_data:
                producto = Producto.objects.get(id=item['producto_id'])
                
                # Opcional: Validar stock si tu modelo 'Producto' lo tiene
                # if producto.stock < item['cantidad']:
                #    raise Exception(f"Stock insuficiente para {producto.nombre}")

                precio = producto.precio_venta
                total_calculado += (precio * item['cantidad'])
                
                # Preparamos el objeto DetalleVenta (sin guardarlo aún)
                detalles_para_crear.append(
                    DetalleVenta(
                        # 'venta' se asignará después
                        producto=producto,
                        nombre_producto=producto.nombre, # Snapshot del nombre
                        precio_unitario=precio, # Snapshot del precio
                        cantidad=item['cantidad']
                    )
                )

        except Producto.DoesNotExist:
            return Response({'error': 'Uno o más productos no existen.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # --- 2. Crear el Pago ---
        payment_status = 'pending'
        if payment_method == 'cash':
            payment_status = 'completed' # Efectivo se completa al instante
            
        payment = Payment.objects.create(
            user=user,
            amount=total_calculado,
            method=payment_method,
            status=payment_status
        )

        # --- 3. Crear la Venta (Encabezado) ---
        venta_status = 'PROCESANDO'
        if payment_status == 'completed':
            venta_status = 'COMPLETADO'
            
        venta = Venta.objects.create(
            usuario=user,
            pago=payment,
            total=total_calculado,
            estado=venta_status
        )

        # --- 4. Asignar la Venta a los Detalles y guardarlos ---
        for detalle in detalles_para_crear:
            detalle.venta = venta
        
        DetalleVenta.objects.bulk_create(detalles_para_crear) # Guarda todo en 1 consulta

        # --- 5. Devolver la Venta creada ---
        # Usamos el serializer de 'lectura' para devolver el objeto completo
        return Response(
            VentaSerializer(venta).data, 
            status=status.HTTP_201_CREATED
        )