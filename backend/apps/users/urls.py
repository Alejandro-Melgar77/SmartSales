from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, RolViewSet, PermisoViewSet, HistorialUsuarioViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'roles', RolViewSet)
router.register(r'permisos', PermisoViewSet)
router.register(r'historial', HistorialUsuarioViewSet)

urlpatterns = [
    path('', include(router.urls)),
]