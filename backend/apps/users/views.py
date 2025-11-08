from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import User, Rol, Permiso, HistorialUsuario
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    UserProfileSerializer, UserLoginSerializer,
    RolSerializer, PermisoSerializer, HistorialUsuarioSerializer
)

class PermisoViewSet(viewsets.ModelViewSet):
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

    @action(detail=False, methods=['post'])
    def login(self, request):
        """Login sin autenticación real (solo simulación)"""
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            try:
                user = User.objects.get(username=username)
                
                # Registrar en historial
                HistorialUsuario.objects.create(
                    usuario=user,
                    accion='Inicio de sesión',
                    modulo='Autenticación',
                    detalles={'metodo': 'simulado'}
                )
                
                return Response(UserSerializer(user).data)
            except User.DoesNotExist:
                return Response(
                    {"error": "Usuario no encontrado"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def profile(self, request):
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
        """Listar solo clientes"""
        customers = User.objects.filter(role='customer')
        serializer = self.get_serializer(customers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def admins(self, request):
        """Listar solo administradores"""
        admins = User.objects.filter(role='admin')
        serializer = self.get_serializer(admins, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def sellers(self, request):
        """Listar solo vendedores"""
        sellers = User.objects.filter(role='seller')
        serializer = self.get_serializer(sellers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_points(self, request, pk=None):
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
        """Obtener historial del usuario"""
        user = self.get_object()
        historial = HistorialUsuario.objects.filter(usuario=user).order_by('-created_at')
        serializer = HistorialUsuarioSerializer(historial, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
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
    queryset = HistorialUsuario.objects.all()
    serializer_class = HistorialUsuarioSerializer
    permission_classes = [permissions.AllowAny]
    filter_fields = ['modulo', 'usuario']
    search_fields = ['usuario__username', 'accion', 'modulo']
    ordering_fields = ['created_at']
    ordering = ['-created_at']