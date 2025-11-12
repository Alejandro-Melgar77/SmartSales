from rest_framework import serializers
from .models import Venta, DetalleVenta
from apps.products.models import Producto
from apps.users.serializers import UserSerializer  # Para mostrar info del usuario
from apps.payments.models import Payment

# --- Serializers para VALIDAR la entrada (lo que envía el frontend) ---

class CartItemSerializer(serializers.Serializer):
    """
    Serializer para validar cada item que viene del carrito.
    """
    producto_id = serializers.IntegerField() # O UUIDField si usas UUIDs
    cantidad = serializers.IntegerField(min_value=1)

    def validate_producto_id(self, value):
        """
        Verifica que el producto exista.
        """
        if not Producto.objects.filter(id=value).exists():
            raise serializers.ValidationError(f"Producto con id {value} no existe.")
        return value


class VentaCreateSerializer(serializers.Serializer):
    """
    Serializer principal para crear una nueva venta desde el carrito.
    """
    items = CartItemSerializer(many=True, allow_empty=False)
    payment_method = serializers.ChoiceField(choices=Payment.PAYMENT_METHODS)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("El carrito no puede estar vacío.")
        return value


# --- Serializers para MOSTRAR datos (lo que el backend envía al frontend) ---

class DetalleVentaSerializer(serializers.ModelSerializer):
    """
    Muestra los detalles de una línea de venta.
    """
    class Meta:
        model = DetalleVenta
        fields = [
            'id', 
            'producto', 
            'nombre_producto', 
            'precio_unitario', 
            'cantidad'
        ]


class VentaSerializer(serializers.ModelSerializer):
    """
    Muestra una Nota de Venta completa, incluyendo sus detalles.
    """
    # 'detalles' usa el related_name que definimos en el modelo
    detalles = DetalleVentaSerializer(many=True, read_only=True)
    
    # Añadimos campos de relaciones para más info
    usuario = UserSerializer(read_only=True)
    pago_status = serializers.CharField(source='pago.get_status_display', read_only=True)
    pago_method = serializers.CharField(source='pago.get_method_display', read_only=True)

    class Meta:
        model = Venta
        fields = [
            'id', 
            'usuario', 
            'pago', 
            'pago_status',
            'pago_method',
            'total', 
            'estado', 
            'get_estado_display', # Muestra el texto legible (ej. "Completado")
            'fecha_creacion', 
            'detalles' # La lista de items
        ]
        # 'get_estado_display' es un método del modelo que Django crea para los 'choices'
        read_only_fields = ['id', 'usuario', 'pago', 'total', 'estado', 'fecha_creacion', 'detalles']