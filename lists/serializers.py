from rest_framework import serializers

# dynamic rest extension enables nested data for lists, see chapter 8
from dynamic_rest.serializers import DynamicModelSerializer

from .models import List, Item

from dynamic_rest.fields import (
    CountField,
    DynamicField,
    DynamicGenericRelationField,
    DynamicMethodField,
    DynamicRelationField
)

#from users.models import CustomUser

class ItemSerializer(serializers.ModelSerializer):
    """
    An item must belong to a list
    """
    class Meta:
        model = Item
        fields = ('id', 'name', 'description', 'slug', 'modified_at', 'order')


class ListSerializer(serializers.ModelSerializer):
    """
    A list may be created with items
    """
    items = ItemSerializer(many=True)

    # automatically set created_by_id as the current user's id
    created_by_id = serializers.PrimaryKeyRelatedField(
        read_only=True,
    )

    created_by_username = serializers.PrimaryKeyRelatedField(
        read_only=True
    )

    class Meta:
        model = List
        fields = ('id', 'name', 'description', 'is_public',
            'slug', 'created_by_id', 'created_by_username', 'created_at',
            'modified_by', 'modified_at', 'items', 'parent_item')

    def create(self, validated_data):
        items_data = validated_data.pop('items', None)
        validated_data['created_by_id'] = self.context['request'].user
        validated_data['created_by_username'] = self.context['request'].user.username

        newlist = List.objects.create(**validated_data)

        for item_data in items_data:
            Item.objects.create(list=newlist, **item_data)
        return newlist
