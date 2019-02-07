# users/views.py
from allauth.account.signals import email_confirmed
from django.dispatch import receiver
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from allauth.account.utils import send_email_confirmation
from rest_framework.views import APIView

from . import models
from . import serializers

from rest_framework.authentication import TokenAuthentication
from rest_framework import status
from rest_framework.response import Response

class UserListView(generics.ListCreateAPIView):
    queryset = models.CustomUser.objects.all()
    serializer_class = serializers.UserSerializer
    authentication_classes = (TokenAuthentication,)

# when the email is confirmed, set a field on the user
# so the UI can check whether to show the "Resend confirmation email" button
@receiver(email_confirmed)
def email_confirmed_(request, email_address, **kwargs):
    user = email_address.user
    user.email_verified = True

    user.save()

# request a new confirmation email
class EmailConfirmation(APIView):
    permission_classes = [IsAuthenticated] 

    def post(self, request):
        if request.user.email_verified:
            return Response({'message': 'Email already verified'}, status=status.HTTP_201_CREATED)

        send_email_confirmation(request, request.user)
        return Response({'message': 'Email confirmation sent'}, status=status.HTTP_201_CREATED)
