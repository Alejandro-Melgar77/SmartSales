from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VentaViewSet, ReportGeneratorViewSet # <-- 1. IMPORTA EL NUEVO VIEWSET
from .views import VentaViewSet, ReportGeneratorViewSet, DashboardViewSet

router = DefaultRouter()
router.register(r'ventas', VentaViewSet, basename='venta')
# --- 👇 2. AÑADE ESTA LÍNEA ---
router.register(r'reportes', ReportGeneratorViewSet, basename='reporte') 
router.register(r'dashboard', DashboardViewSet, basename='dashboard')


urlpatterns = [
    path('', include(router.urls)),
]