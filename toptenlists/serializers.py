from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from rest_framework.response import Response
from allauth.account.models import EmailAddress 

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

from itertools import groupby

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
        # note that votes_yes and votes_no must not be returned
        # they are lists of user email addresses
        fields = ('id', 'name', 'definition', 'is_public', 'created_by', 'created_by_username', 'created_at', 'link', 'modified_at', 'users_when_modified', 'proposed_modification', 'proposed_by', 'history', 'votes_yes_count', 'votes_no_count', 'my_vote')

    def to_internal_value(self, data):
        """ intercept update data before it is validated
        update may contain one of these change requests:
         a change to is_public
         proposed modification
         a vote
        # ensure only one, valid change request is passed through
        """

        #print('resuableItem to_internal_value received raw data:')
        #print(data)

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
            raise ValidationError({'reusable item error': 'no change request submitted'})

        # only one type of change request is allowed
        if count > 1:
            raise ValidationError({'reusable item error: you cannot submit more than one type of change in the same request'})

        # do not accept empty string for name
        if change_type == 'modification':
            for key in ReusableItemSerializer.editable_properties:
                if key in data:
                    if key is 'name' and not data[key]: # empty string
                        raise ValidationError({'reusable item error: name cannot be empty string'})

                    else:
                        validated_data[key] = data[key]

        elif change_type == 'vote':
            validated_data['vote'] = data['vote']

        elif change_type == 'is_public':
            validated_data['is_public'] = data['is_public']

        self.change_type = change_type # change_type ought to be declared in __init__ but I can't get it to work in the serializer
        return validated_data


    def update(self, instance, validated_data):
        """ to_internal_value thas made sure there is exactly one change request which may be:
        - a change to is_public
        - a proposed modification
        - a vote on an existing modification

        and that the instance's change_type is correct for the change request. No other data will be processed.
        """
        #print('***** update reusableItem *****')
        #print(instance.name)
        # print(instance.__dict__) # all values of current reusableItem

        current_user = self.context['request'].user
        created_by_current_user = (current_user == getattr(instance, 'created_by'))
        change_types = ['is_public','modification','vote']

        # check basic permissions
        if not current_user.is_authenticated:
            raise ValidationError({'update reusable item error: user is not logged in'})

        try:
            email_address = EmailAddress.objects.get(user_id=current_user.id)

            if not email_address.verified:
                raise ValidationError({'update reusable item error: user idoes not have a verified email address'})

        except:
            raise ValidationError({'update reusable item error: error getting email_address'})

        if self.change_type not in change_types:
            raise ValidationError({'update reusable item error: invalid change type'})

        elif self.change_type == 'vote':
            if not getattr(instance, 'is_public'):
                raise ValidationError({'update reusable item error: cannot vote on modification to reusableItem because the reusableItem is not public'})

        #print('validated_data')
        #print(validated_data)

        if self.change_type == 'is_public':
            if getattr(instance, 'is_public'):
                """
                make a public resuableItem private
                we make a new private reusableItem as a copy of the public one (intance)
                without the proposed modifications and votes
                and change the current user's topTenItems to reference the new reusableItem instead of the instance
                if nobody else references the original resuableItem, it will be automatically deleted
                """
                reusableItemData = {
                'name': instance.name,
                'definition': instance.definition,
                'is_public': False,
                'link': instance.link,
                'created_by': current_user,
                'created_by_username': current_user.username
                }

                newReusableItem = ReusableItem.objects.create( **reusableItemData)

                # topTenItems whose parent topTenList was created by current user
                # select_related gets their parent topTenList as well so we can check ownership
                myTopTenItems = TopTenItem.objects.filter(reusableItem=instance,
                    topTenList__created_by=current_user).select_related('topTenList')

                # all the user's topTenItems should reference the new reusableItem
                for topTenItem in myTopTenItems:
                    topTenItem.reusableItem = newReusableItem
                    topTenItem.save()

                return newReusableItem

            else:
                # make a private reusableItem public
                if not created_by_current_user:
                    raise ValidationError({'reusable item error: cannot make the reusableItem public because it was not created by the current user'})

                instance.is_public = True
                instance.save()
                return instance

        # propose a modification
        elif self.change_type == 'modification':

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
                raise ValidationError({'update reusable item error: no new values have been proposed'})

            # there must not already be a proposed_modification
            if instance.proposed_modification is not None: # avoid error if no value already, but usually there is an empty array
                if len(instance.proposed_modification) is not 0:
                    raise ValidationError({'update reusable item error: a new modification cannot be proposed while there is an existing modification proposal'})

            # update the reusableItem immediately, or create a modification proposal?
            update_immediately = False

            # is this a private reusableItem?
            if not getattr(instance, 'is_public'):
                if not created_by_current_user:
                    raise ValidationError({'reusable item error: cannot update the private reusable item because it was not created by the current user'})

                update_immediately = True

            else:
                # topTenItems belonging to other users that reference this reusableItem
                otherTopTenItems = TopTenItem.objects.filter(reusableItem=instance).exclude(topTenList__created_by=current_user).select_related('topTenList')

                if otherTopTenItems.count() is 0:
                    # no other user references this reusableItem
                    update_immediately = True

            if update_immediately:
                for key in validated_data:
                    setattr(instance, key, validated_data[key])

                instance.modified_at = timezone.now()
                instance.save()
                return instance

            # there needs to be a vote on the modification
            instance.proposed_modification = []
            instance.proposed_modification.append(proposed_modification)
            instance.proposed_at = timezone.now()
            instance.proposed_by = current_user
            instance.votes_yes = []
            instance.votes_no = []
            instance.votes_yes_count = 0
            instance.votes_no_count = 0

            instance.save()
            return instance

        # vote on a modification
        elif self.change_type == 'vote':
            # is this a private reusableItem?
            if not getattr(instance, 'is_public'):
                raise ValidationError({'reusable item error: cannot vote on a private reusable item'})

            # remove any previous vote by this user
            try:
                instance.votes_yes.remove(current_user.email)
            except ValueError: # avoid error if user has not previously voted
                pass

            try:
                instance.votes_no.remove(current_user.email)
            except ValueError: # avoid error if user has not previously voted
                pass

            if validated_data['vote'] == 'yes':
                print('appending to votes_yes')
                instance.votes_yes.append(current_user.email)

            elif validated_data['vote'] == 'no':
                instance.votes_no.append(current_user.email)

            # users cannot see the actual list of votes, because these are recorded by email address
            # instead we save the summarised voting data
            # and return the unsaved value of the user's vote

            instance.votes_yes_count = len(instance.votes_yes)
            instance.votes_no_count = len(instance.votes_no)

            instance.save()

            instance.my_vote = validated_data['vote']

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
        'reusableItem': (ReusableItemSerializer, {'source': 'topTenItem', 'many': True, 'fields': ['id', 'name', 'definition', 'is_public', 'link', 'modified_at', 'users_when_modified', 'proposed_modification', 'proposed_by', 'history', 'votes_yes_count', 'votes_no_count', 'my_vote']})
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
                        topTenItem.reusableItem = newReusableItem
                        topTenItem.save()

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

                        newReusableItem = ReusableItem.objects.create(**reusableItemData)

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

                        newReusableItem = ReusableItem.objects.create(**reusableItemData)

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
