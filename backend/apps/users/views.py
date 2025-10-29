from django.shortcuts import render

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from .models import User
from .serializers import UserSerializer, UserCreateSerializer, UserLoginSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    @action(detail=False, methods=['post'])
    def login(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(
                username=serializer.validated_data['username'],
                password=serializer.validated_data['password']
            )
            if user:
                login(request, user)
                return Response(UserSerializer(user).data)
            return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def logout(self, request):
        logout(request)
        return Response({"message": "Sesión cerrada correctamente"})

    @action(detail=False, methods=['get'])
    def current_user(self, request):
        if request.user.is_authenticated:
            return Response(UserSerializer(request.user).data)
        return Response({"error": "No autenticado"}, status=status.HTTP_401_UNAUTHORIZED)