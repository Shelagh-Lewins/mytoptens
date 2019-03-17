# this is all here to enable a message to be shown after password reset request if the email address was not found

from django.contrib.auth.forms import PasswordResetForm as DjangoPasswordResetForm
from rest_auth.serializers import (
    PasswordResetSerializer as RestAuthPasswordResetSerializer
)
from rest_auth.views import PasswordResetView as RestAuthPasswordResetView
from rest_framework.exceptions import ValidationError


class PasswordResetForm(DjangoPasswordResetForm):
    def get_users(self, email):
        users = tuple(super().get_users(email))

        if users:
            return users
        msg = ('The email address "{email}" is not associated with a registered user.')
        raise ValidationError({'email': msg.format(email=email)})


class PasswordResetSerializer(RestAuthPasswordResetSerializer):
    password_reset_form_class = PasswordResetForm



class PasswordResetViewCustom(RestAuthPasswordResetView):
    serializer_class = PasswordResetSerializer
