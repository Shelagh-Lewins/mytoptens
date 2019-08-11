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

    # automatically set created_by as the current user's id
    created_by = serializers.PrimaryKeyRelatedField(
        read_only=True,
    )

    created_by_username = serializers.PrimaryKeyRelatedField(
        read_only=True
    )

    # user may propose empty string for definition or link
    editable_properties = ['name', 'definition', 'link']

    class Meta:
        model = ReusableItem
        fields = ('id', 'name', 'definition', 'is_public', 'created_by', 'created_by_username', 'created_at', 'link', 'modified_at', 'users_when_modified', 'votes_yes', 'votes_no', 'proposed_modification', 'proposed_by', 'history')

    def to_internal_value(self, data):
        """ intercept update data before it is validated
        update may contain one of these change requests:
         a change to is_public
         proposed modification
         a vote
        # ensure only one, valid change request is passed through
        """

        print('resuableItem to_internal_value received raw data:')
        print(data)

        change_type = ''
        validated_data = {}
        count = 0

        # if is_public, the owner is changing the is_public calue
        if 'is_public' in data:
            change_type = 'is_public'
            count = count + 1

        # if name, definition or link, a modification is proposed
        for key in ReusableItemSerializer.editable_properties:
            if key in data:
                change_type = 'modification'
                count = count + 1
                break # don't count more than one

        # if vote (yes / no), a vote is registered
        if 'vote' in data:
            if data['vote'] in ['yes', 'no']:
                change_type = 'vote'
                count = count + 1

        # there must be a change request
        if count == 0:
            ({'reusable item': 'no change request submitted'})

        # only one type of change request is allowed
        if count > 1:
            raise ValidationError({'reusable item': 'you cannot submit more than one type of change in the same request'})

        # do not accept empty string for name
        if change_type == 'modification':
            for key in ReusableItemSerializer.editable_properties:
                if key in data:
                    if key is 'name' and not data[key]: # empty string
                        raise ValidationError({'reusable item': 'name cannot be empty string'})

                    else:
                        validated_data[key] = data[key]

        elif change_type == 'vote':
            validated_data['vote'] = data['vote']

        elif change_type == 'is_public':
            validated_data['is_public'] = data['is_public']

        self.change_type = change_type # change_type ought to be declared in __init__ but I can't get it to work in the serializer
        return validated_data


    def update(self, instance, validated_data):
        """ we trust to_internal_value to have ensured there is exactly one change request which may be:
        -  a proposed modification
        - a vote on an existing modification
        - a change to is_public

        and that the instance's change_type is correct for the change request. No other data will be processed.
        """
        print('***** update reusableItem *****')
        print(instance.name)
        # print(instance.__dict__) # all values of current reusableItem

        # check permissions
        created_by_current_user = (self.context['request'].user == getattr(instance, 'created_by'))
        change_types = ['is_public','modification','vote']

        # basic gatekeeping
        if self.change_type not in change_types:
            raise ValidationError({'cannot update reusable item': 'invalid change type'})

        elif self.change_type == 'vote':
            if not getattr(instance, 'is_public'):
                raise ValidationError({'cannot vote on modification to reusableItem': 'the reusableItem is not public'})

        print('validated_data')
        print(validated_data)

        # TODO only allow proposed_modification or vote if item is public
        # TODO if item is owned by user and private, or only the user references it, just change it
        # TODO do not allow modification or vote if private and not owned by user
        # TODO do not allow is_public change unless owned by user
        # TODO allow is_public change and create new reusableItem if necessary (in use by other users)
        # TODO handle making a reusableItem private when it has a proposed_modification outstanding. Should the modification be accepted, rejected, or the user asked what to do? Can they reference the public modification, if there still is one?
        # TODO warn user in UI before they change is_public


        # find the topTenItems that reference this reusableItem
        # select_related gets their parent topTenList as well so we can check ownership
        topTenItems = TopTenItem.objects.filter(reusableItem=instance,topTenList__created_by=self.context['request'].user).select_related('topTenList')
        print('# topTenLilsts owned by the current user that reference this reusableItem:')
        print(topTenItems.count()) # number of topTenItems that reference this reusableItem

        # TODO find topTenLists owned by other users
        # TODO if no other users, just make the reusableItem private
        # TODO if other users, make a private copy and reference it everywhere
        # TODO show this in the UI

        # find the topTenLists that own these topTenItems
        for topTenItem in topTenItems:
            print('got an item')
            print(topTenItem.name)
            print(topTenItem.topTenList)

        # find the topTenLists that the user created

        # change privacy
        if self.change_type == 'is_public':
            if getattr(instance, 'is_public'):
                instance.is_public = False
                # TODO check if any other users reference this reusableItem
                # if so, make a copy and use it for all THIS user's reusableItems

            else:
                instance.is_public = True

            instance.save()

        # propose a modification
        if self.change_type == 'modification':

            # if name, definition or link, a modification is proposed
            proposed_modification = {}

            for key in ReusableItemSerializer.editable_properties:
                if key in validated_data:
                    print(key)
                    print(getattr(instance, key))
                    # only process new values
                    if getattr(instance, key) != validated_data[key]:
                        proposed_modification[key] = validated_data[key]

            if len(proposed_modification) is 0:
                raise ValidationError({'reusable item': 'no new values have been proposed'})

            # there must not already be a proposed_modification
            modification_already_exists = False

            if instance.proposed_modification is not None: # avoid error if no value already
                print('already got a proposed_modification')
                if len(instance.proposed_modification) is not 0:
                    modification_already_exists = True
                    print('and it has elements')

            if modification_already_exists:
                raise ValidationError({'reusable item': 'a new modification cannot be proposed while there is an unresolved existing modification proposal'})

            else:
                instance.proposed_modification = []
                instance.proposed_modification.append(proposed_modification)
                print('instance.proposed_modification:')
                print(instance.proposed_modification)
                instance.save()

        # vote on a modification
        #print('about to save')
        #print()

        # instance.save()
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
        'reusableItem': (ReusableItemSerializer, {'source': 'topTenItem', 'many': True, 'fields': ['id', 'name', 'definition', 'is_public', 'link', 'modified_at', 'users_when_modified', 'votes_yes', 'votes_no', 'proposed_modification', 'proposed_by', 'history']})
    }

    class Meta:
        model = TopTenItem
        fields = ('id', 'name', 'description', 'topTenList_id', 'modified_at', 'order', 'reusableItem', 'reusableItem_id')
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

                        reusableItemData['created_by'] = self.context['request'].user
                        reusableItemData['created_by_username'] = self.context['request'].user.username

                        newReusableItem = ReusableItem.objects.create( **reusableItemData)
                        topTenItem.ReusableItem = newReusableItem
                        topTenItem.save

                        internal_value['reusableItem'] = newReusableItem

                    except:
                        print('error attempting to use non-existent topTenItem as basis for new reusableItem')

                # create a new reusableItem from the entered name
                else:
                    reusableItemData = {'name': data['name']}

                    reusableItemData['created_by'] = self.context['request'].user
                    reusableItemData['created_by_username'] = self.context['request'].user.username

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
        print('create topTenList')
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
