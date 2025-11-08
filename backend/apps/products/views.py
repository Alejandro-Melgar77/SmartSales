from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Categoria, Producto
from .serializers import (
    CategoriaSerializer, ProductoSerializer,
    ProductoCreateSerializer, ProductoUpdateSerializer
)

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre']
    ordering_fields = ['nombre']
    ordering = ['nombre']
    # Sin restricciones de permisos
    permission_classes = []

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.filter(activo=True)
    serializer_class = ProductoSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categoria', 'destacado']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['precio_venta', 'fecha_creacion', 'nombre']
    ordering = ['-fecha_creacion']
    # Sin restricciones de permisos
    permission_classes = []

    def get_serializer_class(self):
        if self.action == 'create':
            return ProductoCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ProductoUpdateSerializer
        return ProductoSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrar por búsqueda si se proporciona
        search_query = self.request.query_params.get('search', '')
        if search_query:
            queryset = queryset.filter(
                Q(nombre__icontains=search_query) |
                Q(descripcion__icontains=search_query)
            )
        
        return queryset.select_related('categoria')

    def destroy(self, request, *args, **kwargs):
        """Soft delete - marcar como inactivo en lugar de eliminar"""
        instance = self.get_object()
        instance.activo = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def destacados(self, request):
        """Productos destacados para la página principal"""
        productos_destacados = self.get_queryset().filter(destacado=True)
        serializer = self.get_serializer(productos_destacados, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def por_categoria(self, request):
        """Productos agrupados por categoría"""
        categoria_id = request.query_params.get('categoria_id')
        if categoria_id:
            productos = self.get_queryset().filter(categoria_id=categoria_id)
        else:
            productos = self.get_queryset()
        
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)