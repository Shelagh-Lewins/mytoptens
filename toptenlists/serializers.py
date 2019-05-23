from rest_framework import serializers

# dynamic rest extension enables nested data for topTenLists, see chapter 8
from dynamic_rest.serializers import DynamicModelSerializer

from rest_flex_fields import FlexFieldsModelSerializer

from .models import TopTenList, TopTenItem, ReusableItem

from dynamic_rest.fields import (
    CountField,
    DynamicField,
    DynamicGenericRelationField,
    DynamicMethodField,
    DynamicRelationField
)

class ReusableItemSerializer(FlexFieldsModelSerializer):
    """
    A topTenItem may be associated with a reusableItem
    """

    class Meta:
        model = ReusableItem
        fields = ('id', 'name', 'definition', 'link', 'modified_at', 'users_when_modified', 'votes_yes', 'votes_no', 'proposed_modification', 'proposed_by', 'history')


class TopTenItemSerializer(FlexFieldsModelSerializer):
    """
    A topTenItem must belong to a topTenList
    A topTenItem may be associated with a reusableItem
    """

    reusableItem = ReusableItemSerializer() # must not set many=True here
    # https://stackoverflow.com/questions/26702695/django-rest-framework-object-is-not-iterable
    # reusableItem is a single object

    expandable_fields = {
        'reusableItem': (ReusableItemSerializer, {'source': 'topTenItem', 'many': True, 'fields': ['id', 'name', 'definition', 'link', 'modified_at', 'users_when_modified', 'votes_yes', 'votes_no', 'proposed_modification', 'proposed_by', 'history']})
    }

    class Meta:
        model = TopTenItem
        fields = ('id', 'name', 'description', 'topTenList_id', 'modified_at', 'order', 'reusableItem')
        # note 'topTenList_id' is the field that can be returned, even though 'topTenList' is the actual foreign key in the model



class TopTenListSerializer(FlexFieldsModelSerializer):
    """
    A topTenList may be created with topTenItems
    """
    parent_topTenItem_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    # parent_topTenItem_id entry allows parent_topTenItem to be updated, see api.py
    # allow_null allows an existing parent_topTenItem_id to be set to null
    topTenItem = TopTenItemSerializer(many=True) # many=True because topTenItem is a list of objects

    # automatically set created_by as the current user's id
    created_by = serializers.PrimaryKeyRelatedField(
        read_only=True,
    )

    created_by_username = serializers.PrimaryKeyRelatedField(
        read_only=True
    )

    expandable_fields = {
        'topTenItem': (TopTenItemSerializer, {'source': 'topTenItem', 'many': True, 'fields': ['name', 'id', 'topTenList_id', 'order', 'reusableItem_id']})
    }

    class Meta:
        model = TopTenList
        fields = ('id', 'name', 'description', 'is_public', 'created_by', 'created_by_username', 'created_at',
            'modified_by', 'modified_at', 'topTenItem', 'parent_topTenItem', 'parent_topTenItem_id')

    def create(self, validated_data):
        topTenItems_data = validated_data.pop('topTenItem', None)
        validated_data['created_by'] = self.context['request'].user
        validated_data['created_by_username'] = self.context['request'].user.username

        newtopTenList = TopTenList.objects.create(**validated_data)

        for topTenItem_data in topTenItems_data:
            print('item data')
            print(topTenItem_data)
            if 'reusableItem_id' in topTenItem_data:

                try:
                    # make sure the reusableItem exists
                    reusableItem = ReusableItem.objects.get(id=topTenItem_data['reusableItem_id'])
                    # print('got object')
                    # print(reusableItem)
                    topTenItem_data.pop('reusableItem_id', None)
                    topTenItem_data['reusableItem'] = reusableItem


                except reusableItem.DoesNotExist:
                    return False


            TopTenItem.objects.create(topTenList=newtopTenList, **topTenItem_data)
        # return
        return newtopTenList
