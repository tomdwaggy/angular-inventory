from django.shortcuts import render, render_to_response
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import HttpResponse

# Create your views here.

from . import serializers, permissions, authenticators, models

class UserView(viewsets.ModelViewSet):
    serializer_class = serializers.UserSerializer
    model = User

    def get_permissions(self):
        # allow non-authenticated user to create
        return (AllowAny() if self.request.method == 'POST'
                else permissions.IsStaff()),

class AuthView(APIView):
    authentication_classes = (authenticators.QuietBasicAuthentication,)

    def post(self, request, *args, **kwargs):
        login(request, request.user)
        return Response(serializers.UserSerializer(request.user).data)

    def delete(self, request, *args, **kwargs):
        logout(request)
        return Response()

def checklogin(request):
    return HttpResponse([{"username": request.user.username}], 'application/json')
