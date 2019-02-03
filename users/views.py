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

    #@transaction.atomic
    @method_decorator(csrf_exempt)
    @detail_route(
        #detail=True,
        methods=['patch'],
        url_path='resend',
        #permission_classes=[permissions.EmailAddressResendPermission]
    )
    def resend(self, request, pk=None):
        print('resend')

@receiver(email_confirmed)
def email_confirmed_(request, email_address, **kwargs):
    user = email_address.user
    user.email_verified = True

    user.save()
    
class EmailConfirmation(generics.ListCreateAPIView):
    #queryset = models.CustomUser.objects.all()
    #serializer_class = serializers.UserSerializer
    #authentication_classes = (TokenAuthentication,) # doesn't work
    #@method_decorator(csrf_exempt)
    #authentication_classes = (TokenAuthentication,)

    permission_classes = [IsAuthenticated] 

    #@method_decorator(csrf_exempt)
    def get(self, request):
      # TODO check if already verified
        send_email_confirmation(request, request.user)

        return Response({'Message': 'Email confirmation sent'}, status=status.HTTP_201_CREATED)
