# app/signals.py

from . models import TopTenList, TopTenItem, ReusableItem
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

# delete any reusableItem that is not referenced by any topTenItem
# when the topTenItem is saved (created or updated)
@receiver([post_save], sender=TopTenItem)
def update_topTenItem(sender, instance, using, **kwargs):
	ReusableItem.objects.filter(topTenItem__isnull=True).delete()

# when the parent list is deleted
@receiver([post_delete], sender=TopTenList)
def delete_topTenList(sender, instance, using, **kwargs):
	ReusableItem.objects.filter(topTenItem__isnull=True).delete()
	# topTenItem__isnull references the related_name of reusableItem in the TopTenItem model.
	