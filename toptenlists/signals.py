# app/signals.py

from . models import TopTenList, TopTenItem, ReusableItem
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

# delete any reusableItem that is not referenced by any topTenItem
@receiver([post_delete, post_save], sender=TopTenItem)
def update_delete_topTenItem(sender, instance, using, **kwargs):
	# the signal is sent for each item when a list is deleted, because items are only deleted when their list is deleted and then all 10 are deleted
	# we could instead send a signal when the list is deleted
	# but this seems safer
	ReusableItem.objects.filter(topTenItem__isnull=True).delete()
	# topTenItem__isnull references the related_name of reusableItem in the TopTenItem model.