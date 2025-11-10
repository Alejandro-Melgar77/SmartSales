from django.apps import AppConfig

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'   # <-- ESTE NOMBRE debe incluir el prefijo "apps."
    label = 'users'       # <-- Esto da un nombre corto a la app dentro de Django
