from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Rol, Permiso, HistorialUsuario

class PermisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permiso
        fields = ['id', 'nombre', 'codigo', 'descripcion', 'modulo']

class RolSerializer(serializers.ModelSerializer):
    permisos = PermisoSerializer(many=True, read_only=True)
    permisos_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Permiso.objects.all(), 
        source='permisos',
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Rol
        fields = [
            'id', 'nombre', 'descripcion', 'permisos', 'permisos_ids',
            'nivel_acceso', 'es_default'
        ]

class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    genero_display = serializers.CharField(source='get_genero_display', read_only=True)
    nombre_completo = serializers.CharField(read_only=True)
    rol_personalizado_nombre = serializers.CharField(source='rol_personalizado.nombre', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 'role_display',
            'first_name', 'last_name', 'nombre_completo',
            'phone', 'address', 'ciudad', 'pais',
            'fecha_nacimiento', 'genero', 'genero_display',
            'puntos_fidelidad', 'total_compras', 'ultima_compra',
            'rol_personalizado', 'rol_personalizado_nombre',
            'preferencias', 'email_verificado', 'telefono_verificado',
            'is_active', 'date_joined', 'created_at', 'ultimo_login'
        ]
        read_only_fields = [
            'id', 'date_joined', 'created_at', 'puntos_fidelidad',
            'total_compras', 'ultima_compra'
        ]

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'role', 'first_name', 'last_name', 'phone', 'address',
            'ciudad', 'pais', 'fecha_nacimiento', 'genero'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'phone', 'address',
            'ciudad', 'pais', 'fecha_nacimiento', 'genero', 'role',
            'rol_personalizado', 'preferencias', 'is_active'
        ]

class UserProfileSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.CharField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'nombre_completo',
            'phone', 'address', 'ciudad', 'pais',
            'fecha_nacimiento', 'genero', 'puntos_fidelidad',
            'total_compras', 'date_joined'
        ]
        read_only_fields = ['id', 'username', 'date_joined']

class HistorialUsuarioSerializer(serializers.ModelSerializer):
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)
    
    class Meta:
        model = HistorialUsuario
        fields = [
            'id', 'usuario', 'usuario_username', 'accion', 'modulo',
            'detalles', 'ip_address', 'user_agent', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']