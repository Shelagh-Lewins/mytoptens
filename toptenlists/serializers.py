from rest_framework import serializers

# dynamic rest extension enables nested data for toptenlists, see chapter 8
from dynamic_rest.serializers import DynamicModelSerializer

from rest_flex_fields import FlexFieldsModelSerializer

from .models import TopTenList, Item

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
    An item must belong to a toptenlist
    """
    class Meta:
        model = Item
        fields = ('id', 'name', 'description', 'toptenlist_id', 'modified_at', 'order')
        # note 'toptenlist_id' is the field that can be returned, even though 'toptenlist' is the actual foreign key in the model

class TopTenListSerializer(FlexFieldsModelSerializer):
    """
    A toptenlist may be created with items
    """
    parent_item_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    # parent_item_id entry allows parent_item to be updated, see api.py
    # allow_null allows an existing parent_item_id to be set to null
    item = ItemSerializer(many=True)

    # automatically set created_by as the current user's id
    created_by = serializers.PrimaryKeyRelatedField(
        read_only=True,
    )

    created_by_username = serializers.PrimaryKeyRelatedField(
        read_only=True
    )

    expandable_fields = {
        'item': (ItemSerializer, {'source': 'item', 'many': True, 'fields': ['name', 'id', 'toptenlist_id', 'order']})
    }

    class Meta:
        model = TopTenList
        fields = ('id', 'name', 'description', 'is_public', 'created_by', 'created_by_username', 'created_at',
            'modified_by', 'modified_at', 'item', 'parent_item', 'parent_item_id')

    def create(self, validated_data):
        items_data = validated_data.pop('item', None)
        validated_data['created_by'] = self.context['request'].user
        validated_data['created_by_username'] = self.context['request'].user.username

        newtoptenlist = TopTenList.objects.create(**validated_data)

        for item_data in items_data:
            Item.objects.create(toptenlist=newtoptenlist, **item_data)

        return newtoptenlist

