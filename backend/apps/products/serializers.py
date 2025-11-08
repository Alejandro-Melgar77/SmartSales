from rest_framework import serializers
from .models import Categoria, Producto

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'caracteristicas']

class ProductoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    
    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'descripcion', 'precio_venta',
            'categoria', 'categoria_nombre', 'imagen',
            'activo', 'destacado', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']

class ProductoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = [
            'nombre', 'descripcion', 'precio_venta',
            'categoria', 'imagen', 'destacado', 'activo'
        ]
    
    def validate_precio_venta(self, value):
        if value <= 0:
            raise serializers.ValidationError("El precio de venta debe ser mayor a 0")
        return value

class ProductoUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = [
            'nombre', 'descripcion', 'precio_venta',
            'categoria', 'imagen', 'destacado', 'activo'
        ]