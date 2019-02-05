# users/views.py
from allauth.account.signals import email_confirmed
from django.dispatch import receiver
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from allauth.account.utils import send_email_confirmation
from rest_framework.views import APIView

from . import models
from . import serializers

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import detail_route

from rest_framework import status
from rest_framework.response import Response

class UserListView(generics.ListCreateAPIView):
    queryset = models.CustomUser.objects.all()
    serializer_class = serializers.UserSerializer
    authentication_classes = (TokenAuthentication,)

@receiver(email_confirmed)
def email_confirmed_(request, email_address, **kwargs):
    user = email_address.user
    user.email_verified = True

    user.save()
    
class EmailConfirmation(APIView):
    permission_classes = [IsAuthenticated] 

    def get(self, request):
        if request.user.email_verified:
            return Response({'message': 'Email already verified'}, status=status.HTTP_201_CREATED)

        send_email_confirmation(request, request.user)
        return Response({'message': 'Email confirmation sent'}, status=status.HTTP_201_CREATED)
