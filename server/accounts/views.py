import json
from django.shortcuts import render, render_to_response
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import HttpResponse
from django.core import serializers

# Create your views here.

from . import serializers, permissions, authenticators, models

# View for Users, wrapper around the Django auth model User
class UserView(viewsets.ModelViewSet):
    serializer_class = serializers.UserSerializer
    model = User

    def get_permissions(self):
        # allow non-authenticated user to create
        return (AllowAny() if self.request.method == 'POST'
                else permissions.IsStaff()),

# View for Auth, which uses Django's default auth model and
# allows users to log in to the service
class AuthView(APIView):
    authentication_classes = (authenticators.QuietBasicAuthentication,)

    # Post an auth, or login
    def post(self, request, *args, **kwargs):
        login(request, request.user)
        return Response(serializers.UserSerializer(request.user).data)

    # Delete an auth, or logout
    def delete(self, request, *args, **kwargs):
        logout(request)
        return Response()

# This call allows the client end to check what the logged in
# user name is, in case if the state is dumped due to a page
# refresh
def checklogin(request):
    response_data = {}
    response_data['username'] = request.user.username
    return HttpResponse(json.dumps(response_data), 'application/json')
