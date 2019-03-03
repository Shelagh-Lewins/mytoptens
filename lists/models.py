"""Models for lists, items
    """
import uuid

from django.db import models
from django.utils.http import int_to_base36
from django.core.validators import MaxValueValidator, MinValueValidator
from django.contrib.auth import get_user_model

USER = get_user_model()

class List(models.Model):
    """Models for lists
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_by = models.ForeignKey(USER, on_delete=models.CASCADE, related_name='list_created_by_id')
    created_by_username = models.CharField(max_length=255) # this shold be OK given that the list will be deleted if the created_by_id user is deleted
    created_at = models.DateTimeField(auto_now_add=True)
    parent_item = models.ForeignKey('Item', on_delete=models.SET_NULL, null=True, related_name='parent_item')
    modified_by = models.ForeignKey(USER, on_delete=models.SET_NULL, null=True,
        related_name='list_modified_by')
    modified_at = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=255)
    description = models.CharField(max_length=5000, blank=True, default='')
    is_public = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class Item(models.Model):
    """Models for list items
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    modified_at = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=255, blank=True, default='')
    description = models.CharField(max_length=5000, blank=True, default='')
    list = models.ForeignKey(List, on_delete=models.CASCADE, related_name='item')
    order = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])

    class Meta:
        # unique_together = ('list', 'order') # not using this because it prevents items from being swapped because deferred is not available in mysql
        ordering = ['order']

    def __unicode__(self):
        return '%d: %s' % (self.order, self.name)
