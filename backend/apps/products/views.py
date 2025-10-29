from django.shortcuts import render

from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Product
from .serializers import (
    CategorySerializer, ProductSerializer, 
    ProductCreateSerializer, FeaturedProductSerializer
)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(active=True)
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'featured', 'active']
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at', 'sales_count']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create' or self.action == 'update':
            return ProductCreateSerializer
        return ProductSerializer

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Productos destacados"""
        featured_products = Product.objects.filter(featured=True, active=True)
        serializer = FeaturedProductSerializer(featured_products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Búsqueda de productos por nombre o descripción"""
        query = request.query_params.get('q', '')
        if query:
            products = Product.objects.filter(
                name__icontains=query, 
                active=True
            ) | Product.objects.filter(
                description__icontains=query, 
                active=True
            )
            serializer = self.get_serializer(products, many=True)
            return Response(serializer.data)
        return Response([])

    @action(detail=True, methods=['post'])
    def update_stock(self, request, pk=None):
        """Actualizar stock del producto"""
        product = self.get_object()
        stock_change = request.data.get('stock_change', 0)
        product.stock += stock_change
        product.save()
        return Response(ProductSerializer(product).data)