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

class ItemSerializer(serializers.ModelSerializer):
    """
    An item must belong to a list
    """
    class Meta:
        model = Item
        fields = ('id', 'title', 'description', 'slug', 'modified_at', 'order')


class ListSerializer(serializers.ModelSerializer):
    """
    A list may be created with items
    """
    items = ItemSerializer(many=True)

    # automatically set created_by as the current user
    created_by = serializers.PrimaryKeyRelatedField(
        read_only=True,
        default=serializers.CurrentUserDefault()
    )

    class Meta:
        model = List
        fields = ('id', 'title', 'description', 'is_public',
            'slug', 'created_by', 'created_at',
            'modified_by', 'modified_at', 'items')

    def create(self, validated_data):
        items_data = validated_data.pop('items', None)
        newlist = List.objects.create(**validated_data)

        for item_data in items_data:
            Item.objects.create(list=newlist, **item_data)
        return newlist

