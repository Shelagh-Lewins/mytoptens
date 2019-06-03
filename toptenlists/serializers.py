from rest_framework import serializers
from rest_framework.exceptions import ValidationError

import uuid

from django.db import models

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

    def to_internal_value(self, data):
        # intercept data before it is validated
        # update may contain a vote or a proposed modification
        # ensure only one, valid action is passed through
        print('raw data:')
        print(data)
        modification_submitted = False
        vote_submitted = False
        validated_data = {}

        # if name, definition or link, a modification is proposed
        editable_properties = ['name', 'definition', 'link']

        for key in editable_properties:
            if key in data:
                modification_submitted = True
                break

        # if vote (yes / no), a vote is registered
        if 'vote' in data:
            if data['vote'] in ['yes', 'no']:
                vote_submitted =  True

        # do not accept request for both
        if modification_submitted and vote_submitted:
            raise ValidationError({'reusable item': 'you cannot submit a proposed modification and a vote in the same request'})

        # if neither vote nor modification, error
        if not modification_submitted and not vote_submitted:
            raise ValidationError({'reusable item': 'you must submit either a proposed modification or a vote'})

        # do not accept empty string for name
        # user may propose empty string for definition or link, though it's unclear why they would want to
        if modification_submitted:
            for key in editable_properties:
                if key in data:
                    if key is 'name' and not data[key]: # empty string
                        raise ValidationError({'reusable item': 'name cannot be empty string'})

                    else:
                        validated_data[key] = data[key]

        if vote_submitted:
            validated_data['vote'] = data['vote']

        return validated_data


    def update(self, instance, validated_data):
        """ we trust to_internal_value to have ensured there is either
        a proposed modification or a vote. No other data will be processed.
        """
        print('***** instance')
        print(instance)
        # instance.name = validated_data.get('name', instance.name)
        print(instance.name)
        print(instance.proposed_modification)
        print('validated_data')
        print(validated_data)

        # find the topTenItems that reference this reusableItem
        topTenItems = TopTenItem.objects.filter(reusableItem=instance)
        print('topTenItems')
        print(topTenItems.count()) # number of topTenItems that reference this reusableItem

        # propose a modification
        modification_submitted = False
        vote_submitted = False

        # if name, definition or link, a modification is proposed
        editable_properties = ['name', 'definition', 'link']
        proposed_modification = {}

        for key in editable_properties:
            if key in validated_data:
                print(key)
                print(getattr(instance, key))
                # only process new values
                if getattr(instance, key) != validated_data[key]:
                    modification_submitted = True
                    proposed_modification[key] = validated_data[key]

        if modification_submitted:
            # there must not already be a proposed_modification
            if instance.proposed_modification is not None: # avoid error if no value already
                print('existing proposed_modification')
                print(instance.proposed_modification)
                print(len(instance.proposed_modification))
                if len(instance.proposed_modification) is not 0:
                    raise ValidationError({'reusable item': 'a new modification cannot be proposed while there is an unresolved existing modification proposal'})

            if len(proposed_modification) is 0:
                raise ValidationError({'reusable item': 'no new values have been specified'})

            else:
                instance.proposed_modification = []
                instance.proposed_modification.append(proposed_modification)

            # don't set name to empty string

        # vote on a modification
        print('about to save')
        print()

        instance.save()
        return instance 


class TopTenItemSerializer(FlexFieldsModelSerializer):
    """
    A topTenItem must belong to a topTenList
    A topTenItem may be associated with a reusableItem
    """

    reusableItem = ReusableItemSerializer(required=False, allow_null=True) # must not set many=True here
    # allow_null is required for patch
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

    def to_internal_value(self, data):
        # intercept data before it is validated
        # to use fields like reusableItem_id which do not directly go into model
        internal_value = super(TopTenItemSerializer, self).to_internal_value(data)


        # the topTenItem references a reusableItem
        if 'reusableItem_id' in data:
            reusableItemId = data.pop('reusableItem_id', None)

            # remove reference to an existing reusableItem
            if reusableItemId is None:
                internal_value['reusableItem'] = None

            # topTenItem should reference an existing reusableItem
            else:
                try:
                    reusableItem = ReusableItem.objects.get(id=reusableItemId)

                    internal_value['reusableItem'] = reusableItem

                    return internal_value

                except reusableItem.DoesNotExist:
                    print('error attempting to use non-existent reusableItem for patched topTenItem')

        if 'newReusableItem' in data:
            if data['newReusableItem'] == True:
                # create a new reusableItem with the same name as the topTenItem
                # and assign the new reusableItem to that topTenItem also
                if 'topTenItemForNewReusableItem' in data:
                    try:
                        topTenItem = TopTenItem.objects.get(id=data['topTenItemForNewReusableItem'])

                        reusableItemData = {'name': topTenItem.name}

                        if 'reusableItemDefinition' in data:
                            reusableItemData['definition'] = data['reusableItemDefinition']

                        if 'reusableItemLink' in data:
                            reusableItemData['link'] = data['reusableItemLink']

                        newReusableItem = ReusableItem.objects.create( **reusableItemData)
                        topTenItem.ReusableItem = newReusableItem
                        topTenItem.save

                        internal_value['reusableItem'] = newReusableItem

                    except topTenItem.DoesNotExist:
                        print('error attempting to use non-existent topTenItem as basis for new reusableItem')

                # create a new reusableItem from the entered name
                else:
                    reusableItemData = {'name': data['name']}

                    if 'reusableItemDefinition' in data:
                            reusableItemData['definition'] = data['reusableItemDefinition']

                    if 'reusableItemLink' in data:
                            reusableItemData['link'] = data['reusableItemLink']

                    newReusableItem = ReusableItem.objects.create( **reusableItemData)

                    internal_value['reusableItem'] = newReusableItem

        return internal_value


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

        if data.get('topTenItem') is not None:
            # when creating a list, the items are also created
            # note that if newReusableItem is False, the code will fail
            # if the value exists, it must be True
            for index, topTenItem_data in enumerate(data.get('topTenItem')):
                if 'newReusableItem' in topTenItem_data:
                    if topTenItem_data['newReusableItem'] == True:
                    # create new reusableItem from raw data

                        reusableItemData = {'name': topTenItem_data['name']}

                        if 'definition' in topTenItem_data:
                            reusableItemData['definition'] = topTenItem_data['definition']
                        
                        if 'link' in topTenItem_data:
                            reusableItemData['link'] = topTenItem_data['link']

                        newReusableItem = ReusableItem.objects.create( **reusableItemData)

                        internal_value['topTenItem'][index]['reusableItem'] = newReusableItem
                    

                elif 'reusableItem_id' in topTenItem_data:
                    # reference an existing reusableItem
                    try:
                        # make sure the reusableItem exists
                        reusableItem = ReusableItem.objects.get(id=topTenItem_data['reusableItem_id'])
                        # remove the reference to the reusableItem_id
                        internal_value['topTenItem'][index].pop('reusableItem_id', None)
                        # and instead refer to the object
                        # because that is what the model requires
                        internal_value['topTenItem'][index]['reusableItem'] = reusableItem

                    except reusableItem.DoesNotExist:
                        print('error attempting to use non-existent reusableItem in new topTenList')
                        print('username:')
                        print(self.context['request'].user.username)
                        print('new list name:')
                        print(internal_value['name'])
                        print('reusableItem_id:')
                        print(topTenItem_data['reusableItem_id'])
                        return False

                elif 'topTenItem_id' in topTenItem_data:
                    # create new reusableItem from topTenItem
                    print('topTenItem_id')
                    print(topTenItem_data['topTenItem_id'])

                    try:
                        topTenItem = TopTenItem.objects.get(id=topTenItem_data['topTenItem_id'])

                        reusableItemData = {'name': topTenItem_data['name']}

                        if 'definition' in topTenItem_data:
                            reusableItemData['definition'] = topTenItem_data['definition']
                        
                        if 'link' in topTenItem_data:
                            reusableItemData['link'] = topTenItem_data['link']

                        newReusableItem = ReusableItem.objects.create( **reusableItemData)

                        # assign this reusableItem to the topTenItem from which it was created - so it will now be referenced twice
                        parentTopTenItem = TopTenItem.objects.get(id=topTenItem_data['topTenItem_id'])
                        parentTopTenItem.reusableItem = newReusableItem
                        parentTopTenItem.save()

                        internal_value['topTenItem'][index]['reusableItem'] = newReusableItem

                    except topTenItem.DoesNotExist:
                        print('error attempting to use non-existent topTenItem for new reusableItem in new topTenList')
                        print('username:')
                        print(self.context['request'].user.username)
                        print('new list name:')
                        print(internal_value['name'])
                        print('topTenItem_id:')
                        print(topTenItem_data['topTenItem_id'])
                        return False

        return internal_value

    def create(self, validated_data):

        topTenItems_data = validated_data.pop('topTenItem', None)
        validated_data['created_by'] = self.context['request'].user
        validated_data['created_by_username'] = self.context['request'].user.username

        newTopTenList = TopTenList.objects.create(**validated_data)

        # topTenItems must be created in bulk
        # otherwise when the first one is created, all the reusableItems that whose topTenItem has not yet been created, will be deleted
        # to use bulk_create, the data must be converted from Ordered Dict to an array of Objects
        itemObjs = []

        for topTenItem_data in topTenItems_data:
            NewItemObj = TopTenItem(
                name=topTenItem_data['name'],
                order=topTenItem_data['order'],
                description=topTenItem_data['description'],
                topTenList=newTopTenList,
            )

            if 'reusableItem' in topTenItem_data:
                NewItemObj.reusableItem = topTenItem_data['reusableItem']

            itemObjs.append(NewItemObj)

        TopTenItem.objects.bulk_create(itemObjs)

        return newTopTenList
