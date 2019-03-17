from rest_framework import serializers

# dynamic rest extension enables nested data for toptenlists, see chapter 8
from dynamic_rest.serializers import DynamicModelSerializer

from rest_flex_fields import FlexFieldsModelSerializer

from .models import TopTenList, TopTenItem

from dynamic_rest.fields import (
    CountField,
    DynamicField,
    DynamicGenericRelationField,
    DynamicMethodField,
    DynamicRelationField
)

#from users.models import CustomUser

class TopTenItemSerializer(FlexFieldsModelSerializer):
    """
    A toptenitem must belong to a toptenlist
    """
    class Meta:
        model = TopTenItem
        fields = ('id', 'name', 'description', 'toptenlist_id', 'modified_at', 'order')
        # note 'toptenlist_id' is the field that can be returned, even though 'toptenlist' is the actual foreign key in the model

class TopTenListSerializer(FlexFieldsModelSerializer):
    """
    A toptenlist may be created with toptenitems
    """
    parent_toptenitem_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    # parent_toptenitem_id entry allows parent_toptenitem to be updated, see api.py
    # allow_null allows an existing parent_toptenitem_id to be set to null
    toptenitem = TopTenItemSerializer(many=True)

    # automatically set created_by as the current user's id
    created_by = serializers.PrimaryKeyRelatedField(
        read_only=True,
    )

    created_by_username = serializers.PrimaryKeyRelatedField(
        read_only=True
    )

    expandable_fields = {
        'toptenitem': (TopTenItemSerializer, {'source': 'toptenitem', 'many': True, 'fields': ['name', 'id', 'toptenlist_id', 'order']})
    }

    class Meta:
        model = TopTenList
        fields = ('id', 'name', 'description', 'is_public', 'created_by', 'created_by_username', 'created_at',
            'modified_by', 'modified_at', 'toptenitem', 'parent_toptenitem', 'parent_toptenitem_id')

    def create(self, validated_data):
        toptenitems_data = validated_data.pop('toptenitem', None)
        validated_data['created_by'] = self.context['request'].user
        validated_data['created_by_username'] = self.context['request'].user.username

        newtoptenlist = TopTenList.objects.create(**validated_data)

        for toptenitem_data in toptenitems_data:
            TopTenItem.objects.create(toptenlist=newtoptenlist, **toptenitem_data)

        return newtoptenlist

