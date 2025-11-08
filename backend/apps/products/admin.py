from django.contrib import admin
from .models import Categoria, Producto

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'caracteristicas']
    search_fields = ['nombre']
    list_per_page = 20

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'categoria', 'precio_venta', 'destacado', 'activo', 'fecha_creacion']
    list_filter = ['categoria', 'destacado', 'activo']
    search_fields = ['nombre', 'descripcion']
    list_editable = ['precio_venta', 'destacado', 'activo']
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion']
    list_per_page = 20
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'descripcion', 'precio_venta', 'categoria')
        }),
        ('Imagen y Estado', {
            'fields': ('imagen', 'destacado', 'activo')
        }),
        ('Fechas', {
            'fields': ('fecha_creacion', 'fecha_actualizacion'),
            'classes': ('collapse',)
        }),
    )