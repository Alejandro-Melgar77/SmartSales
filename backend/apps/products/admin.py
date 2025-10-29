from django.contrib import admin
from .models import Category, Product

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'stock', 'featured', 'active']
    list_filter = ['category', 'featured', 'active']
    search_fields = ['name', 'description']
    list_editable = ['price', 'stock', 'featured']