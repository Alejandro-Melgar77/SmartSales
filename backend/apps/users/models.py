from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El usuario debe tener un email')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(username, email, password, **extra_fields)

class Permiso(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    codigo = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True)
    modulo = models.CharField(max_length=50)  # productos, ventas, reportes, etc.
    
    class Meta:
        verbose_name = 'Permiso'
        verbose_name_plural = 'Permisos'
        ordering = ['modulo', 'nombre']
    
    def __str__(self):
        return f"{self.modulo} - {self.nombre}"

class Rol(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    permisos = models.ManyToManyField(Permiso, blank=True)
    nivel_acceso = models.IntegerField(default=1)  # 1=bajo, 10=alto
    es_default = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'
        ordering = ['-nivel_acceso', 'nombre']
    
    def __str__(self):
        return self.nombre

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Administrador'),
        ('seller', 'Vendedor'),
        ('customer', 'Cliente'),
        ('manager', 'Gerente'),
    ]
    
    # Información básica
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='customer'
    )
    rol_personalizado = models.ForeignKey(
        Rol, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='usuarios'
    )
    
    # Información de contacto
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    ciudad = models.CharField(max_length=100, blank=True)
    pais = models.CharField(max_length=100, blank=True, default='Bolivia')
    
    # Información adicional
    fecha_nacimiento = models.DateField(null=True, blank=True)
    genero = models.CharField(
        max_length=10, 
        choices=[
            ('M', 'Masculino'),
            ('F', 'Femenino'),
            ('O', 'Otro'),
        ],
        blank=True
    )
    
    # Campos para el negocio
    puntos_fidelidad = models.IntegerField(default=0)
    total_compras = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    ultima_compra = models.DateTimeField(null=True, blank=True)
    
    # Configuración de usuario
    preferencias = models.JSONField(default=dict, blank=True)  # tema, idioma, etc.
    email_verificado = models.BooleanField(default=False)
    telefono_verificado = models.BooleanField(default=False)
    
    # Auditoría
    creado_por = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='usuarios_creados'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    ultimo_login = models.DateTimeField(null=True, blank=True)
    
    objects = UserManager()

    def __str__(self):
        return f"{self.username} - {self.get_role_display()}"

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['ciudad']),
        ]

    @property
    def nombre_completo(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def permisos(self):
        """Obtener todos los permisos del usuario"""
        if self.rol_personalizado:
            return self.rol_personalizado.permisos.all()
        return Permiso.objects.none()

    def tiene_permiso(self, codigo_permiso):
        """Verificar si el usuario tiene un permiso específico"""
        if self.is_superuser:
            return True
        return self.permisos.filter(codigo=codigo_permiso).exists()

    def tiene_permiso_modulo(self, modulo):
        """Verificar si el usuario tiene permisos en un módulo"""
        if self.is_superuser:
            return True
        return self.permisos.filter(modulo=modulo).exists()

class HistorialUsuario(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='historial')
    accion = models.CharField(max_length=200)
    modulo = models.CharField(max_length=50)
    detalles = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Historial de Usuario'
        verbose_name_plural = 'Historial de Usuarios'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.usuario.username} - {self.accion} - {self.created_at}"