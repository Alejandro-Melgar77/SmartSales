from django.db import models
from django.conf import settings
from apps.products.models import Producto
from apps.payments.models import Payment

class Venta(models.Model):
    """
    Representa el encabezado de una nota de venta o pedido.
    """
    ESTADO_CHOICES = [
        ('PROCESANDO', 'Procesando'),
        ('COMPLETADO', 'Completado'),
        ('CANCELADO', 'Cancelado'),
    ]

    # --- Relaciones ---
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, # No borrar la venta si se borra el usuario
        null=True, 
        related_name='ventas'
    )
    pago = models.OneToOneField(
        Payment, 
        on_delete=models.SET_NULL, # No borrar la venta si se borra el pago
        null=True, 
        blank=True,
        related_name='venta'
    )

    # --- Detalles de la Venta ---
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PROCESANDO')
    
    # --- Auditoría ---
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Nota de Venta'
        verbose_name_plural = 'Notas de Venta'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"Venta #{self.id} - {self.usuario.username} - {self.estado}"


class DetalleVenta(models.Model):
    """
    Representa una línea de item dentro de una Nota de Venta.
    Guarda un "snapshot" del precio y nombre del producto al momento de la compra.
    """
    # --- Relaciones ---
    venta = models.ForeignKey(
        Venta, 
        on_delete=models.CASCADE, 
        related_name='detalles' # Venta.detalles.all()
    )
    producto = models.ForeignKey(
        Producto, 
        on_delete=models.SET_NULL, # Si el producto se borra, mantenemos el registro
        null=True
    )

    # --- Snapshot de Datos ---
    # Guardamos el nombre y precio por si el producto original cambia
    nombre_producto = models.CharField(max_length=255)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    cantidad = models.PositiveIntegerField(default=1)
    
    # --- Auditoría ---
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Detalle de Venta'
        verbose_name_plural = 'Detalles de Venta'
        ordering = ['fecha_creacion']

    def __str__(self):
        return f"{self.cantidad} x {self.nombre_producto} @ {self.precio_unitario}"