from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Rol, Permiso, HistorialUsuario

@admin.register(Permiso)
class PermisoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'codigo', 'modulo', 'descripcion']
    list_filter = ['modulo']
    search_fields = ['nombre', 'codigo', 'modulo']
    ordering = ['modulo', 'nombre']

@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'nivel_acceso', 'es_default', 'cantidad_permisos']
    list_filter = ['es_default', 'nivel_acceso']
    search_fields = ['nombre', 'descripcion']
    filter_horizontal = ['permisos']
    
    def cantidad_permisos(self, obj):
        return obj.permisos.count()
    cantidad_permisos.short_description = 'Permisos'

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = [
        'username', 'email', 'nombre_completo', 'role', 
        'ciudad', 'puntos_fidelidad', 'is_active', 'date_joined'
    ]
    list_filter = ['role', 'is_active', 'is_staff', 'ciudad', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'ciudad']
    list_editable = ['role', 'is_active']
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Información Personal', {
            'fields': (
                'first_name', 'last_name', 'email', 
                'phone', 'address', 'ciudad', 'pais',
                'fecha_nacimiento', 'genero'
            )
        }),
        ('Información Comercial', {
            'fields': ('puntos_fidelidad', 'total_compras', 'ultima_compra')
        }),
        ('Roles y Permisos', {
            'fields': ('role', 'rol_personalizado', 'preferencias')
        }),
        ('Verificaciones', {
            'fields': ('email_verificado', 'telefono_verificado')
        }),
        ('Permisos Avanzados', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Fechas', {
            'fields': ('last_login', 'date_joined', 'created_at', 'updated_at')
        }),
    )
    
    readonly_fields = ['last_login', 'date_joined', 'created_at', 'updated_at']
    ordering = ['-date_joined']

@admin.register(HistorialUsuario)
class HistorialUsuarioAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'accion', 'modulo', 'ip_address', 'created_at']
    list_filter = ['modulo', 'created_at']
    search_fields = ['usuario__username', 'accion', 'modulo']
    readonly_fields = ['created_at']
    ordering = ['-created_at']