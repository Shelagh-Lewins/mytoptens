# users/views.py
from allauth.account.signals import email_confirmed
from django.dispatch import receiver
from rest_framework import generics

from allauth.account.utils import send_email_confirmation
from rest_framework.views import APIView

from . import models
from . import serializers

class UserListView(generics.ListCreateAPIView):
    queryset = models.CustomUser.objects.all()
    serializer_class = serializers.UserSerializer

@receiver(email_confirmed)
def email_confirmed_(request, email_address, **kwargs):
    user = email_address.user
    user.email_verified = True

    user.save()
    
class EmailConfirmation(APIView):
    def post(self):
        send_email_confirmation(user=self.request.user)

