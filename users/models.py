# users/models.py
import uuid 

from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models
from django.utils.http import int_to_base36

class CustomUserManager(UserManager):
    def get_by_natural_key(self, username):
        case_insensitive_username_field = '{}__iexact'.format(self.model.USERNAME_FIELD)
        return self.get(**{case_insensitive_username_field: username})

ID_LENGTH = 12

class CustomUser(AbstractUser):
    objects = CustomUserManager()
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email_verified = models.BooleanField(default=False)

    def __str__(self):
        return self.email