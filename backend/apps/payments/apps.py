from django.apps import AppConfig

class PaymentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.payments'  # 👈 IMPORTANTE: no 'payments' solo
    verbose_name = 'Pagos'
    label = 'payments'  # 👈 AÑADIDO PARA EVITAR CONFLICTOS DE NOMBRE