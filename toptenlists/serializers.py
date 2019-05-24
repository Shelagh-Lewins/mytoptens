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

    reusableItem = ReusableItemSerializer(required=False) # must not set many=True here
    # https://stackoverflow.com/questions/26702695/django-rest-framework-object-is-not-iterable
    # reusableItem is a single object
    # must set required=False if ForeignKey is optional
    # https://github.com/encode/django-rest-framework/issues/627

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

    def to_internal_value(self, data):
        # intercept data before it is validated
        # to use fields like reusableItem_id which do not directly go into model
        internal_value = super(TopTenListSerializer, self).to_internal_value(data)
        topTenItems_data = data.get("topTenItem")
        print(topTenItems_data)
        for index, topTenItem_data in enumerate(topTenItems_data):
            print('***')
            print('index')
            print(index)
            print(topTenItem_data)

            if 'reusableItem_id' in topTenItem_data:
                print('got reusable item')

                try:
                    # make sure the reusableItem exists
                    reusableItem = ReusableItem.objects.get(id=topTenItem_data['reusableItem_id'])
                    print('got object')
                    print(reusableItem)
                    print('test')

                    topTenItem_data.pop('reusableItem_id', None)
                    topTenItem_data['reusableItem'] = reusableItem

                    new_data = data.get("topTenItem")
                    new_data[index] = topTenItem_data

                    # I am sure there is a neater way to update nested data
                    # Here, we replace the entire topTenItem list entry
                    # in order to remove a value and add another
                    internal_value.update({'topTenItem': new_data})
                    print(topTenItems_data)

                except reusableItem.DoesNotExist:
                    return False

        #reusableItem_id = data.get("reusableItem_id")
        # my_non_model_field_value = ConvertRawValueInSomeCleverWay(my_non_model_field_raw_value)
        #internal_value.update({
            #"my_non_model_field": my_non_model_field_value
        #})
        print('internal_value after internal fudging')
        print(internal_value)
        #print(reusableItem_id)
        return internal_value

    def create(self, validated_data):
        print('***')
        print('validated data')
        print(validated_data)
        topTenItems_data = validated_data.pop('topTenItem', None)
        validated_data['created_by'] = self.context['request'].user
        validated_data['created_by_username'] = self.context['request'].user.username

        newtopTenList = TopTenList.objects.create(**validated_data)

        for topTenItem_data in topTenItems_data:
            print('validated item data')
            print(topTenItem_data)
            #if 'reusableItem_id' in topTenItem_data:

                #try:
                    # make sure the reusableItem exists
                    #reusableItem = ReusableItem.objects.get(id=topTenItem_data['reusableItem_id'])
                    # print('got object')
                    # print(reusableItem)
                    #topTenItem_data.pop('reusableItem_id', None)
                    #topTenItem_data['reusableItem'] = reusableItem


                #except reusableItem.DoesNotExist:
                    #return False


            TopTenItem.objects.create(topTenList=newtopTenList, **topTenItem_data)
        # return
        return newtopTenList
