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
	
# when a reusableItem is saved (created or updated)
# if it has no created_by, it should be deleted if not public
# because nobody will be able to access it
# created_by is None should only happen when a user is deleted, but has been observed under other circumstances
# TODO find out why this happened and stop it
@receiver([post_save], sender=ReusableItem)
def update_reusableItem(sender, instance, using, **kwargs):

	if instance.created_by is None:
		print('*** signals.py says Reusable item has created_by is None')
		print('id', instance.id)
		print('name', instance.name)

		if instance.is_public == False:
			print('is_public False')
			ReusableItem.objects.filter(id=instance.id).delete()
