class AdminNoAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Si es una ruta de admin, simular un usuario autenticado
        if request.path.startswith('/admin/'):
            from django.contrib.auth.models import AnonymousUser
            request.user = AnonymousUser()
        
        response = self.get_response(request)
        return response