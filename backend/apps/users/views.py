from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q

# --- 👇 AÑADIDO ---
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
# --- 👆 FIN AÑADIDO ---

from .models import User, Rol, Permiso, HistorialUsuario
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    UserProfileSerializer, UserLoginSerializer,
    RolSerializer, PermisoSerializer, HistorialUsuarioSerializer
)

class PermisoViewSet(viewsets.ModelViewSet):
    # ... (Tu código de PermisoViewSet - sin cambios)
    queryset = Permiso.objects.all()
    serializer_class = PermisoSerializer
    permission_classes = [permissions.AllowAny]
    filter_fields = ['modulo']
    search_fields = ['nombre', 'codigo', 'modulo']

    @action(detail=False, methods=['get'])
    def por_modulo(self, request):
        modulo = request.query_params.get('modulo')
        if modulo:
            permisos = Permiso.objects.filter(modulo=modulo)
        else:
            permisos = Permiso.objects.all()
        serializer = self.get_serializer(permisos, many=True)
        return Response(serializer.data)

class RolViewSet(viewsets.ModelViewSet):
    # ... (Tu código de RolViewSet - sin cambios)
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    permission_classes = [permissions.AllowAny]
    search_fields = ['nombre', 'descripcion']
    filter_fields = ['es_default', 'nivel_acceso']

    @action(detail=False, methods=['get'])
    def default(self, request):
        """Obtener rol por defecto"""
        rol_default = Rol.objects.filter(es_default=True).first()
        if rol_default:
            serializer = self.get_serializer(rol_default)
            return Response(serializer.data)
        return Response({"error": "No hay rol por defecto"}, status=404)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]
    filter_fields = ['role', 'ciudad', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        # ... (Tu código de get_queryset - sin cambios)
        queryset = super().get_queryset()
        
        # Filtrar por rol si se especifica
        role_filter = self.request.query_params.get('role')
        if role_filter:
            queryset = queryset.filter(role=role_filter)
        
        # Filtrar por ciudad si se especifica
        ciudad_filter = self.request.query_params.get('ciudad')
        if ciudad_filter:
            queryset = queryset.filter(ciudad__icontains=ciudad_filter)
        
        return queryset.select_related('rol_personalizado')

    # --- 👇 INICIO DE LA MODIFICACIÓN ---
    @action(detail=False, methods=['post'])
    def login(self, request):
        """Login de usuario real con token"""
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            # Asumimos que UserLoginSerializer también valida 'password'
            password = serializer.validated_data.get('password') 

            # Autenticamos al usuario
            user = authenticate(username=username, password=password)

            if user is not None:
                if user.is_active:
                    # Obtenemos o creamos un token para el usuario
                    token, created = Token.objects.get_or_create(user=user)
                    
                    # Registrar en historial
                    HistorialUsuario.objects.create(
                        usuario=user,
                        accion='Inicio de sesión',
                        modulo='Autenticación',
                        detalles={'metodo': 'token_auth'}
                    )
                    
                    # Devolvemos la respuesta que el frontend espera
                    return Response({
                        'token': token.key,
                        'user': UserSerializer(user).data
                    }, status=status.HTTP_200_OK)
                else:
                    return Response(
                        {"error": "Esta cuenta está inactiva"},
                        status=status.HTTP_403_FORBIDDEN
                    )
            else:
                # Credenciales inválidas (usuario o contraseña incorrectos)
                return Response(
                    {"error": "Usuario o contraseña incorrectos"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    # --- 👆 FIN DE LA MODIFICACIÓN ---

    @action(detail=False, methods=['get'])
    def profile(self, request):
        # ... (Tu código de profile - sin cambios)
        """Obtener perfil del usuario actual (simulado)"""
        try:
            # Por defecto devolvemos el usuario 'ale'
            user = User.objects.get(username='ale')
            return Response(UserProfileSerializer(user).data)
        except User.DoesNotExist:
            return Response(
                {"error": "Usuario no configurado"}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def customers(self, request):
        # ... (Tu código de customers - sin cambios)
        """Listar solo clientes"""
        customers = User.objects.filter(role='customer')
        serializer = self.get_serializer(customers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def admins(self, request):
        # ... (Tu código de admins - sin cambios)
        """Listar solo administradores"""
        admins = User.objects.filter(role='admin')
        serializer = self.get_serializer(admins, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def sellers(self, request):
        # ... (Tu código de sellers - sin cambios)
        """Listar solo vendedores"""
        sellers = User.objects.filter(role='seller')
        serializer = self.get_serializer(sellers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_points(self, request, pk=None):
        # ... (Tu código de update_points - sin cambios)
        """Actualizar puntos de fidelidad"""
        user = self.get_object()
        puntos = request.data.get('puntos', 0)
        
        try:
            puntos = int(puntos)
            user.puntos_fidelidad += puntos
            user.save()
            
            HistorialUsuario.objects.create(
                usuario=user,
                accion='Actualización de puntos',
                modulo='Fidelidad',
                detalles={'puntos_anadidos': puntos, 'total_puntos': user.puntos_fidelidad}
            )
            
            return Response({
                'mensaje': f'Puntos actualizados. Total: {user.puntos_fidelidad}',
                'puntos_actuales': user.puntos_fidelidad
            })
        except ValueError:
            return Response(
                {'error': 'Los puntos deben ser un número entero'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'])
    def historial(self, request, pk=None):
        # ... (Tu código de historial - sin cambios)
        """Obtener historial del usuario"""
        user = self.get_object()
        historial = HistorialUsuario.objects.filter(usuario=user).order_by('-created_at')
        serializer = HistorialUsuarioSerializer(historial, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        # ... (Tu código de destroy - sin cambios)
        """Soft delete - desactivar usuario en lugar de eliminar"""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        
        HistorialUsuario.objects.create(
            usuario=instance,
            accion='Usuario desactivado',
            modulo='Gestión de Usuarios',
            detalles={'accion': 'soft_delete'}
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)

class HistorialUsuarioViewSet(viewsets.ReadOnlyModelViewSet):
    # ... (Tu código de HistorialUsuarioViewSet - sin cambios)
    queryset = HistorialUsuario.objects.all()
    serializer_class = HistorialUsuarioSerializer
    permission_classes = [permissions.AllowAny]
    filter_fields = ['modulo', 'usuario']
    search_fields = ['usuario__username', 'accion', 'modulo']
    ordering_fields = ['created_at']
    ordering = ['-created_at']