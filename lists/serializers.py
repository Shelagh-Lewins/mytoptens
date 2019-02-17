from rest_framework import serializers

# dynamic rest extension enables nested data for lists, see chapter 8
from dynamic_rest.serializers import DynamicModelSerializer

from rest_flex_fields import FlexFieldsModelSerializer

from .models import List, Item

from dynamic_rest.fields import (
    CountField,
    DynamicField,
    DynamicGenericRelationField,
    DynamicMethodField,
    DynamicRelationField
)

#from users.models import CustomUser

class ItemSerializer(FlexFieldsModelSerializer):
    # class ItemSerializer(serializers.ModelSerializer):
    """
    An item must belong to a list
    """
    class Meta:
        model = Item
        fields = ('id', 'name', 'description', 'list_id', 'modified_at', 'order', 'slug')
        # note 'list_id' is the field that can be returned, even though 'list' is the actual foreign key in the model

class ListSerializer(FlexFieldsModelSerializer):
#class ListSerializer(serializers.ModelSerializer):
    """
    A list may be created with items
    """
    parent_item_id = serializers.UUIDField(write_only=True)
    item = ItemSerializer(many=True)

    # automatically set created_by as the current user's id
    created_by = serializers.PrimaryKeyRelatedField(
        read_only=True,
    )

    created_by_username = serializers.PrimaryKeyRelatedField(
        read_only=True
    )

    expandable_fields = {
        'item': (ItemSerializer, {'source': 'item', 'many': True, 'fields': ['name', 'id', 'list_id']})
    }

    class Meta:
        model = List
        fields = ('id', 'name', 'description', 'is_public',
            'slug', 'created_by', 'created_by_username', 'created_at',
            'modified_by', 'modified_at', 'item', 'parent_item', 'parent_item_id')

    def create(self, validated_data):
        items_data = validated_data.pop('item', None)
        validated_data['created_by'] = self.context['request'].user
        validated_data['created_by_username'] = self.context['request'].user.username

        newlist = List.objects.create(**validated_data)

        for item_data in items_data:
            Item.objects.create(list=newlist, **item_data)
        return newlist
