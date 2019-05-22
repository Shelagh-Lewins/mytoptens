"""Models for topTenLists, topTenItems
    """
import uuid

from django.db import models
from django.utils.http import int_to_base36
from django.core.validators import MaxValueValidator, MinValueValidator
from django.contrib.auth import get_user_model
from django_mysql.models import JSONField

USER = get_user_model()

class TopTenList(models.Model):
    """
    Model for topTenLists
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_by = models.ForeignKey(USER, on_delete=models.CASCADE, related_name='topTenList_created_by_id')
    created_by_username = models.CharField(max_length=255) # this shold be OK given that the topTenList will be deleted if the created_by_id user is deleted
    created_at = models.DateTimeField(auto_now_add=True)
    parent_topTenItem = models.ForeignKey('TopTenItem', on_delete=models.SET_NULL, null=True, related_name='parent_topTenItem')
    modified_by = models.ForeignKey(USER, on_delete=models.SET_NULL, null=True,
        related_name='topTenList_modified_by')
    modified_at = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=255)
    description = models.CharField(max_length=5000, blank=True, default='')
    is_public = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class TopTenItem(models.Model):
    """
    Model for topTenList topTenItems
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    modified_at = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=255, blank=True, default='')
    description = models.CharField(max_length=5000, blank=True, default='')
    topTenList = models.ForeignKey(TopTenList, on_delete=models.CASCADE, related_name='topTenItem', editable=False) # topTenItem must belong to a list
    reusableItem = models.ForeignKey('ReusableItem', on_delete=models.SET_NULL, null=True, related_name='reusableItem') # topTenItem may reference a reusableItem
    order = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])

    class Meta:
        # unique_together = ('topTenList', 'order') # not using this because it prevents topTenItems from being swapped because deferred is not available in mysql
        ordering = ['order']

    def __unicode__(self):
        return '%d: %s' % (self.order, self.name)

class ReusableItem(models.Model):
    """
    Model for reusableItem
    This may be referenced by many topTenItems
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_by = models.ForeignKey(USER, on_delete=models.SET_NULL, null=True,related_name='reusableItem_created_by')
    created_at = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=255)
    definition = models.CharField(max_length=255, blank=True, default='')
    link = models.CharField(max_length=255, blank=True, default='')
    modified_at = models.DateTimeField(auto_now_add=True)
    users_when_modified = models.IntegerField(default=0)
    votes_yes = JSONField() # array of usernames.
    votes_no = JSONField() # array of usernames.
    proposed_modification = JSONField() # array of modification objects
    proposed_by = models.ForeignKey(USER, on_delete=models.SET_NULL, null=True,
        related_name='reusableItem_proposed_by') # user who proposed the modification
    history = JSONField() # array of version objects


