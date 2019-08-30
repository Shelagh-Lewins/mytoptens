from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from rest_framework.response import Response
from allauth.account.models import EmailAddress

from django.contrib.auth import get_user_model
USER = get_user_model()

import uuid

from django.db import models

# dynamic rest extension enables nested data for topTenLists, see chapter 8
from dynamic_rest.serializers import DynamicModelSerializer

from rest_flex_fields import FlexFieldsModelSerializer

from .models import TopTenList, TopTenItem, ReusableItem, Notification

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

    # allows my_vote to be returned dynamically and not saved in the instance
    # see method get_my_vote
    change_request_my_vote = serializers.SerializerMethodField()
    change_request_votes_yes_count = serializers.SerializerMethodField()
    change_request_votes_no_count = serializers.SerializerMethodField()

    class Meta:
        model = ReusableItem
        # note that change_request_votes_yes and change_request_votes_no must not be returned
        # they are lists of user email addresses
        fields = ('id', 'name', 'definition', 'is_public', 'created_by', 'created_by_username', 'created_at', 'link', 'change_request_at', 'users_when_modified', 'change_request', 'change_request_by', 'history', 'change_request_votes_yes_count', 'change_request_votes_no_count', 'change_request_my_vote')

    # magic method name to return calculated field
    def get_change_request_my_vote(cls, instance):
        # return the user's recorded vote, if any
        current_user = cls.context['request'].user

        if current_user in instance.change_request_votes_yes.all():
            return 'yes'

        if current_user in instance.change_request_votes_no.all():
            return 'no'

        return ''

    # magic method name
    def get_change_request_votes_yes_count(cls, instance):
        # return the number of users who have voted yes to a change request
        return instance.change_request_votes_yes.count()

    # magic method name
    def get_change_request_votes_no_count(cls, instance):
        # return the number of users who have voted no to a change request
            return instance.change_request_votes_no.count()

    @classmethod # required for cls to be consistently passed automatically as the first parameter. Otherwise it depends on whether you call the method with 'self.remove_my_votes()' or 'ReusableItemSerializer.remove_my_votes()'
    # use cls instead of self for class methods for readability
    def count_users(cls, instance):
        """
        find all users who reference this reusableItem in any topTenList
        """

        # find the topTenItems that reference this reusableItem
        selected_toptenitems = TopTenItem.objects.filter(reusableItem=instance)

        # and find the topTenLists to which those topTenItems belong
        selected_toptenlist_ids = selected_toptenitems.values_list('topTenList_id', flat=True)
        selected_toptenlists = TopTenList.objects.filter(id__in=selected_toptenlist_ids)

        # print('selectedTopTenLists', selected_toptenlists.values())

        # and finally select the users who created these topTenLists
        selected_userids = selected_toptenlists.values_list('created_by', flat=True)
        selected_users = USER.objects.filter(id__in=selected_userids)

        return selected_users.count()

    @classmethod
    def create_notification(cls, instance, user):
        """
        Crete a notification, e.g. because a change request has been submitted
        """
        Notification.objects.create( **notificationData)


    @classmethod
    def remove_my_votes(cls, instance, user):
        """ remove any previous vote by this user """
        try:
            instance.change_request_votes_yes.remove(user)
        except ValueError: # avoid error if user has not previously voted
            pass

        try:
            instance.change_request_votes_no.remove(user)
        except ValueError: # avoid error if user has not previously voted
            pass

    @classmethod
    def cast_vote(cls, instance, user, vote):
        if instance.change_request is None:
            return

        # if vote is '' then the user has withdrawn their vote
        # if yes or no, add the vote

        cls.remove_my_votes(instance, user)

        if vote == 'yes':
            instance.change_request_votes_yes.add(user)

        elif vote == 'no':
            instance.change_request_votes_no.add(user)

        cls.count_votes(instance)

    # process votes on a reusableItem to see if a change request has been accepted or rejected
    @classmethod
    def count_votes(cls, instance):
        if instance.change_request is None:
            return

        #print('count_votes')
        #print('for', instance.change_request_votes_yes.count())
        #print('against', instance.change_request_votes_no.count())

        change_request_votes_yes = instance.change_request_votes_yes.count()
        change_request_votes_no = instance.change_request_votes_no.count()
        total_votes = change_request_votes_yes + change_request_votes_no

        if total_votes == 0:
            return

        # find all users who reference this reusableItem in any topTenList
        number_of_selected_users = cls.count_users(instance)
        #print('number_of_selected_users', number_of_selected_users)

        """ voting rules
        Once a quorum is reached, the change request is approved if enough users have voted for it, otherwise it is rejected.

        number_of_users: rule applies to reusableItem referenced by this number of users, or fewer
        quorum: number of votes that must be cast to resolve change request
        accept_percentage: this % of votes must be cast for the change, for it to be accepted
        elibibility_scheme: who is eligible to vote. Initially just 'A', but with the potential to have different schemes depending on the popularity of the reusableItem ('B', 'C' etc). For example, can people vote even if they only reference the reusableItem in private topTenLists?
        """
        voting_rules = [
        { # one user so change will happen immediately
        'number_of_users': 1,
        'quorum': 1,
        'accept_percentage': 100,
        'voting_scheme': 'A'
        },
        { # 2 users: all must vote
        'number_of_users': 2,
        'quorum': 2,
        'accept_percentage': 100,
        'voting_scheme': 'A'
        },
        { # 3 users
        'number_of_users': 3,
        'quorum': 3,
        'accept_percentage': 60,
        'voting_scheme': 'A'
        },
        { # 4 or 5 users
        'number_of_users': 5,
        'quorum': 3,
        'accept_percentage': 60,
        'voting_scheme': 'A'
        },
        { # 6 - 10 users
        'number_of_users': 10,
        'quorum': 4,
        'accept_percentage': 70,
        'voting_scheme': 'A'
        },
        { # 11 - 20 users
        'number_of_users': 20,
        'quorum': 6,
        'accept_percentage': 80,
        'voting_scheme': 'A'
        },
        { # 21 - 100 users
        'number_of_users': 100,
        'quorum': 10,
        'accept_percentage': 80,
        'voting_scheme': 'A'
        },
        { # 101 - 1000 users
        'number_of_users': 1000,
        'quorum': 20,
        'accept_percentage': 80,
        'voting_scheme': 'A'
        },
        { # 1001 - 5000 users
        'number_of_users': 5000,
        'quorum': 30,
        'accept_percentage': 80,
        'voting_scheme': 'A'
        }
        ]

        selected_rule =  voting_rules[-1] # this default will apply if there are more users than the last voting rule covers

        for rule in voting_rules:
            if number_of_selected_users <= rule['number_of_users']:
                selected_rule = rule
                break

        #print('got rule: ', selected_rule)
        #print('total_votes', total_votes)

        # if total_votes is > quorum
        # use % of votes not of quorum
        # in case for example people dereference a reusable item with a pending change request
        # I'm not sure this will happen, but it seems best to cover for it

        max_votes = max(total_votes, selected_rule['quorum'])

        # enough have voted 'yes'
        if 100 * change_request_votes_yes / max_votes >= selected_rule['accept_percentage']:
            cls.accept_change(instance)

        # even if all remaining users vote 'yes', the accept percentage cannot be reached
        elif 100 * change_request_votes_no / max_votes > 100 - selected_rule['accept_percentage']:
            cls.reject_change(instance, 'rejected')

        return

    @classmethod
    def accept_change(cls, instance):
        """
        update the reusable item and record the change request in history
        """
        history_entry = {}

        history_entry['is_public'] = getattr(instance, 'is_public')

        history_entry['change_request'] = {}

        for key, value in instance.change_request.items():
            setattr(instance, key, value)
            history_entry['change_request'][key] = value

        history_entry['changed_request_submitted_by_id'] = getattr(instance, 'change_request_by').id.__str__()
        history_entry['change_request_resolution'] = 'accepted'
        history_entry['changed_request_resolved_at'] = timezone.now().__str__()

        history_entry['change_request_votes_yes_count'] = cls.get_change_request_votes_yes_count(cls, instance)
        history_entry['change_request_votes_no_count'] = cls.get_change_request_votes_no_count(cls, instance)
        history_entry['number_of_users'] = cls.count_users(instance)

        instance.history.append(history_entry)

        setattr(instance, 'modified_at', timezone.now().__str__())

        cls.remove_change_request(instance)
        instance.save()

    @classmethod
    def reject_change(cls, instance, reason):
        """
        record the change request in history but do not update the editable values
        """
        history_entry = {}

        history_entry['is_public'] = getattr(instance, 'is_public')

        history_entry['change_request'] = {}

        for key, value in instance.change_request.items():
            history_entry['change_request'][key] = value

        history_entry['changed_request_submitted_by_id'] = getattr(instance, 'change_request_by').id.__str__()
        history_entry['change_request_resolution'] = reason
        history_entry['changed_request_resolved_at'] = timezone.now().__str__()

        history_entry['change_request_votes_yes_count'] = cls.get_change_request_votes_yes_count(cls, instance)
        history_entry['change_request_votes_no_count'] = cls.get_change_request_votes_no_count(cls, instance)
        history_entry['number_of_users'] = cls.count_users(instance)

        instance.history.append(history_entry)

        cls.remove_change_request(instance)
        instance.save()

    @classmethod
    def remove_change_request(cls, instance):
        instance.change_request = None
        instance.change_request_at = None
        instance.change_request_by = None

        cls.reset_change_votes(instance)

    @classmethod
    def reset_change_votes(cls, instance):
        instance.change_request_votes_yes.clear()
        instance.change_request_votes_no.clear()

    def to_internal_value(self, data):
        """ intercept update data before it is validated
        data may contain one of these updates:

         a change to is_public
         a new change request
         cancel an existing change request
         a vote on an existing change request
        
        ensure only one, valid update is passed through
        ValidationError here seems to cause problems with the api return
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

        # if name, definition or link, a change request is created
        for key in ReusableItemSerializer.editable_properties:
            if key in data:
                change_type = 'change_request'
                count = count + 1
                break # don't count more than one

        if 'cancel' in data:
            change_type = 'cancel'
            count = count + 1

        # if vote (yes / no), a vote is registered
        if 'vote' in data:
            if data['vote'] in ['yes', 'no', '']: # '' to withdraw vote
                change_type = 'vote'
                count = count + 1

        # there must be an update
        if count == 0:
            validated_data = {}
            # raise ValidationError({'reusable item error': 'no change request submitted'})

        # only one type of update is allowed
        if count > 1:
            validated_data = {}
            # raise ValidationError({'reusable item error: you cannot submit more than one type of change in the same request'})

        # do not accept empty string for name
        if change_type == 'change_request':
            for key in ReusableItemSerializer.editable_properties:
                if key in data:
                    if data[key] is None:
                        validated_data = {}
                        break

                    elif key is 'name' and not data[key].strip(): # empty string
                        validated_data = {}
                        break

                    else:
                        validated_data[key] = data[key]

        elif change_type == 'vote':
            validated_data['vote'] = data['vote']

        elif change_type == 'is_public':
            validated_data['is_public'] = data['is_public']

        self.change_type = change_type # change_type ought to be declared in __init__ but I can't get it to work in the serializer
        return validated_data

    @classmethod
    def create(cls, validated_data):
        """
        create an initial history entry as well as the obvious data
        """
        history_entry = {}

        for key in cls.editable_properties:
            if validated_data.get(key, None) is not None:
                history_entry[key] = validated_data[key]

        validated_data['history'] = [history_entry]

        return ReusableItem.objects.create(**validated_data)

    # @classmethod here breaks the function
    def update(self, instance, validated_data):
        """ to_internal_value has made sure there is exactly one change request which may be:
        - a change to is_public
        - a proposed change request
        - a vote on an existing change request

        and that the instance's change_type is correct for the change request. No other data will be processed.
        """
        # print('***** update reusableItem *****')
        #print(instance.name)
        # print(instance.__dict__) # all values of current reusableItem

        current_user = self.context['request'].user
        created_by_current_user = (current_user == getattr(instance, 'created_by'))
        change_types = ['is_public', 'change_request', 'cancel', 'vote']

        # check permissions
        if not current_user.is_authenticated:
            raise ValidationError({'update reusable item error: user is not logged in'})

        try:
            email_address = EmailAddress.objects.get(user_id=current_user.id)

            if not email_address.verified:
                raise ValidationError({'update reusable item error: user does not have a verified email address'})

        except:
            raise ValidationError({'update reusable item error: error getting email_address'})

        if self.change_type not in change_types:
            raise ValidationError({'update reusable item error: invalid change type'})

        # Find the current user's topTenLists which reference this reusableItem
        # topTenItems whose parent topTenList was created by current user
        # select_related gets their parent topTenList as well so we can check ownership
        myTopTenItems = TopTenItem.objects.filter(reusableItem=instance,
            topTenList__created_by=current_user).select_related('topTenList')

        if myTopTenItems.count() == 0:
            raise ValidationError({'update reusable item error: you cannot update a reusableItem that is not used in any of your lists'})

        if self.change_type == 'is_public':
            if getattr(instance, 'is_public'):
                """
                make a public resuableItem private
                we make a new private reusableItem as a copy of the public one (intance)
                without the proposed change requests and votes
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

                # newReusableItem = ReusableItem.objects.create( **reusableItemData)
                newReusableItem = ReusableItemSerializer.create(reusableItemData)

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

        # submit a change request
        elif self.change_type == 'change_request':

            # if name, definition or link, a change request is submitted
            change_request = {}

            for key in self.editable_properties:
                if key in validated_data:
                    #print(key)
                    #print(getattr(instance, key))
                    # only process new values
                    if getattr(instance, key) != validated_data[key]:
                        change_request[key] = validated_data[key]

            if len(change_request) is 0:
                raise ValidationError({'update reusable item error: no new values have been submitted'})

            # there must not already be a change_request
            if instance.change_request is not None:
                raise ValidationError({'update reusable item error: a new change request cannot be submitted while there is an existing change request proposal'})

            # is this a private reusableItem?
            if not getattr(instance, 'is_public'):
                if not created_by_current_user:
                    raise ValidationError({'update reusable item error: cannot update the private reusable item because it was not created by the current user'})

            # set up a vote on the change request
            instance.change_request = change_request
            instance.change_request_at = timezone.now()
            instance.change_request_by = current_user
            self.reset_change_votes(instance)
            self.cast_vote(instance, current_user, 'yes')

            instance.save()
            return instance

        # cancel the change request
        elif self.change_type == 'cancel':
            # there must be a change_request
            if instance.change_request is None:
                raise ValidationError({'update reusable item error: there is no change request to cancel'})

            # the user must have created the change request
            if instance.change_request_by != current_user:
                raise ValidationError({'update reusable item error: you cannot cancel a change request that you did not create'})
            
            self.reject_change(instance, 'cancelled')
            return instance

        # vote on a change request
        elif self.change_type == 'vote':
            # is this a private reusableItem?
            if not getattr(instance, 'is_public'):
                raise ValidationError({'update reusable item error: you cannot vote on a private reusable item'})

            # there must be a change_request
            if instance.change_request is None:
                raise ValidationError({'update reusable item error: there is no change request to vote on'})

            # if vote is '' then the user has withdrawn their vote already
            # if yes or no, add the vote
            if validated_data['vote'] in ['yes', 'no', '']:
                self.cast_vote(instance, current_user, validated_data['vote'])

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
        'reusableItem': (ReusableItemSerializer, {'source': 'topTenItem', 'many': True, 'fields': ['id', 'name', 'definition', 'is_public', 'link', 'change_request_at', 'users_when_modified', 'change_request', 'change_request_by', 'history', 'change_request_votes_yes_count', 'change_request_votes_no_count', 'change_request_my_vote']})
    }

    class Meta:
        model = TopTenItem
        fields = ('id', 'name', 'description', 'topTenList_id', 'modified_at', 'order', 'reusableItem', 'reusableItem_id')
        # note 'topTenList_id' is the field that can be returned, even though 'topTenList' is the actual foreign key in the model

    def to_internal_value(self, data):
        # intercept data before it is validated
        # to use fields like reusableItem_id which do not directly go into model
        internal_value = super(TopTenItemSerializer, self).to_internal_value(data)
        # print('*** in TopTenItemSerializer ***')
        # print('data', data)
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
                # create a new reusableItem
                # assign the new reusableItem to that topTenItem

                if 'topTenItemForNewReusableItem' in data:
                # create the reusable item from an existing topTenItem
                # This may belong to the user, or be another user's public topTenItem
                # this is to encourage reusableItems when people enter the same name
                    try:
                        topTenItem = TopTenItem.objects.get(id=data['topTenItemForNewReusableItem'])

                        reusableItemData = {'name': topTenItem.name}

                        if 'reusableItemDefinition' in data:
                            reusableItemData['definition'] = data['reusableItemDefinition']

                        if 'reusableItemLink' in data:
                            reusableItemData['link'] = data['reusableItemLink']

                        reusableItemData['created_by'] = self.context['request'].user
                        reusableItemData['created_by_username'] = self.context['request'].user.username

                        newReusableItem = ReusableItemSerializer.create(reusableItemData)

                        internal_value['reusableItem'] = newReusableItem

                    except:
                        print('error attempting to use non-existent topTenItem as basis for new reusableItem')

                    # TODO if the existing topTenItem belongs to the user, make that use the new reusableItem also
                    # TODO test this

                # create a new reusableItem from the entered name
                else:
                    reusableItemData = {'name': data['name']}

                    reusableItemData['created_by'] = self.context['request'].user
                    reusableItemData['created_by_username'] = self.context['request'].user.username

                    if 'reusableItemDefinition' in data:
                        reusableItemData['definition'] = data['reusableItemDefinition']

                    if 'reusableItemLink' in data:
                        reusableItemData['link'] = data['reusableItemLink']

                    newReusableItem = ReusableItemSerializer.create(reusableItemData)
                    # newReusableItem = ReusableItem.objects.create( **reusableItemData)

                    internal_value['reusableItem'] = newReusableItem

        return internal_value

    def update(self, instance, validated_data):
        current_reusableitem = instance.reusableItem
        new_reusableitem = None

        if 'reusableItem' in validated_data:
            new_reusableitem = validated_data['reusableItem']

        if current_reusableitem != new_reusableitem:
            # recount votes in case a change request should be resolved

            if current_reusableitem is not None:
                ReusableItemSerializer.count_votes(current_reusableitem)

            if new_reusableitem is not None:
                ReusableItemSerializer.count_votes(new_reusableitem)

        return super(TopTenItemSerializer, self).update(instance, validated_data)


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

                        # print('data', topTenItem_data)
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
                    #print('topTenItem_id')
                    #print(topTenItem_data['topTenItem_id'])

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

class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for notifications
    """

    class Meta:
        model = Notification

        fields = ('id', 'created_at', 'context', 'event', 'reusableItem_id', 'created_by', 'unread')
