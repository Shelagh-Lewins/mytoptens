# users/serializers.py
from rest_framework import serializers
from . import models
from allauth.account.models import EmailAddress 

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for custom user
    """
    email_verified = serializers.SerializerMethodField()

    class Meta:
        model = models.CustomUser
        fields = ('email', 'username', 'id', 'email_verified')

    def get_email_verified(self, obj):
        try:
            email_address = EmailAddress.objects.get(user_id=obj.id)
            return email_address.verified
            
        except EmailAddress.DoesNotExist:
            return None