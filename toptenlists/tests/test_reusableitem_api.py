"""
Tests for ReusableItems api
"""

import json

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import CustomUser
from allauth.account.models import EmailAddress 
from toptenlists.models import TopTenList, TopTenItem, ReusableItem

# disable throttling for testing
from toptenlists.api import TopTenListViewSet, TopTenItemViewSet, TopTenListDetailViewSet, ReusableItemViewSet

TopTenListViewSet.throttle_classes = ()
TopTenItemViewSet.throttle_classes = ()
TopTenListDetailViewSet.throttle_classes = ()
ReusableItemViewSet.throttle_classes = ()

# data
# Top Ten Lists
toptenlist_data_1 = {'name': 'Writers', 'description':'My favourite writers',
'topTenItem': [
    {'name': 'Jane Austen', 'description': 'Regency writer', 'order': 1},
    {'name': 'Agatha Christie', 'description': 'Mysteries', 'order': 2},
    {'name': 'Georgette Heyer', 'description': 'Best on Regency novels', 'order': 3},
    {'name': '', 'description': '', 'order': 4},
    {'name': '', 'description': '', 'order': 5},
    {'name': '', 'description': '', 'order': 6},
    {'name': 'Ursula le Guin', 'description': '', 'order': 7},
    {'name': '', 'description': '', 'order': 8},
    {'name': '', 'description': '', 'order': 9},
    {'name': '', 'description': '', 'order': 10}
    ]}

# Reusable Items
reusableitem_1_data = {'name': 'Jane Austen', 'reusableItemDefinition': 'A definition', 'reusableItemLink': 'A link', 'newReusableItem': True}

# 'topTenLists' is the app_name set in endpoints.py and is common to top ten lists, top ten items and reusable items because they are all defined in the same app
# 'TopTenLists' is the base_name set for the topTenList route in endpoints.py
# '-list' is a standard api command to list a model. It is unrelated to our topTenList object name

create_list_url = reverse('topTenLists:TopTenLists-list')

def get_reusable_item_1_url(self):
    return reverse('topTenLists:ReusableItems-detail',  kwargs={'pk': self.reusableitem_1.id})

def create_user(self, index):
    user_ref = 'user_' + str(index) # refer to user by self.user_1 etc
    username = 'Test user ' + str(index)
    email_address = 'person_' + str(index) + '@example.com'
    password = str(index) + str(index) + str(index) + str(index) + str(index)

    setattr(self, user_ref, CustomUser.objects.create_user(username, email_address, email_address))
    EmailAddress.objects.create(user=getattr(self, user_ref), 
            email=email_address,
            primary=True,
            verified=True)

def create_toptenlist(self, user_ref, index):
    """
    # use the api to create a Top Ten List and its Top Ten Items
    # users are automatically authenticted because this is part of setup and should not fail
    """
    self.client.force_authenticate(user=getattr(self, user_ref))
    response = self.client.post(create_list_url, toptenlist_data_1, format='json')
    toptenlist_id = json.loads(response.content)['id']

    toptenlist_ref = 'toptenlist_' + str(index) # refer to toptenlist by self.toptenlist_1 etc

    # this allows us to reference the originial toptenlist from self
    # self.toptenlist_1 etc
    # this is not safe for properties like name, but is safe for getting toptenlist and toptenitem id because these do not change
    setattr(self, toptenlist_ref, TopTenList.objects.get(pk=toptenlist_id))

    # the request should succeed
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.client.logout()


def create_reusable_item_1(self, toptenitem_id, **kwargs):
    """
    Use the api to create a new Reusable Item from the kwargs data.
    Warning! It is referenced from 'self' and there can be only one.
    This item will belong to whatever toptenitem is specified
    To succeed, authenticate the owner of that toptenitem before calling this function
    This Reusable Item will be referenced by the specified Top Ten Item.
    Note that the user is not automatically authenticated, because we want to test failure as well as success
    """
    item_detail_url = reverse('topTenLists:TopTenItems-detail', kwargs={'pk': toptenitem_id})

    response = self.client.patch(item_detail_url, kwargs, format='json')

    try:
        newreusableitem_id = json.loads(response.content)['reusableItem']['id']

        self.reusableitem_1 = ReusableItem.objects.get(pk=newreusableitem_id)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ReusableItem.objects.count(), 1)
        self.client.logout()

    except:
        self.client.logout()

    return response

def reference_reusable_item(self, user_ref, reusableitem_id, toptenitem_id):
    """
    Set a top ten item to reference a reusable item
    """

    self.client.force_authenticate(user=getattr(self, user_ref))

    item_detail_url = reverse('topTenLists:TopTenItems-detail', kwargs={'pk': toptenitem_id})
    response = self.client.patch(item_detail_url, {'reusableItem_id': reusableitem_id}, format='json')

    self.client.logout()

    return response


class CreateReusableItemAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        create_user(cls, 1)
        create_user(cls, 2)

    def setUp(self):
        create_toptenlist(self, 'user_1', 1)

    def test_create_reusableitem_api_fails(self):
        """
        This should fail because Reusable Items cannot be created directly via the API
        They can only be created when updating a Top Ten Item
        """
        self.client.force_authenticate(user=self.user_1)

        data = reusableitem_1_data
        create_reusableitem_url = reverse('topTenLists:ReusableItems-list')
        response = self.client.post(create_reusableitem_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_create_reusableitem_not_authenticated(self):
        """
        create a Reusable Item should fail if user is not logged in
        """

        self.client.logout()

        toptenitems = self.toptenlist_1.topTenItem.all()
        toptenitem_1_id = toptenitems[0].id

        response = create_reusable_item_1(self, toptenitem_1_id, **reusableitem_1_data)

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_reusableitem_not_verified(self):
        """
        create a Reusable Item should fail if user's email address is not verified
        """

        email_address = EmailAddress.objects.get(user_id=self.user_1.id)
        email_address.verified = False
        email_address.save()

        self.client.force_authenticate(user=self.user_1)

        toptenitems = self.toptenlist_1.topTenItem.all()
        toptenitem_1_id = toptenitems[0].id

        response = create_reusable_item_1(self, toptenitem_1_id, **reusableitem_1_data)

        # the user can see the Top Ten Item because they created it
        # but cannot change it because their email address is not verified
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_reusableitem_not_toptenlist_owner(self):
        """
        create a Reusable Item should fail if the user didn't create the Top Ten List
        """

        self.client.logout()

        self.client.force_authenticate(user=self.user_2)

        toptenitems = self.toptenlist_1.topTenItem.all()
        toptenitem_1_id = toptenitems[0].id

        response = create_reusable_item_1(self, toptenitem_1_id, **reusableitem_1_data)

        # the user cannot see the Top Ten Item because they did not create it
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_reusableitem_authenticated(self):
        """
        create a Reusable Item and assign it to a Top Ten Item
        """

        self.client.force_authenticate(user=self.user_1)

        toptenitems = self.toptenlist_1.topTenItem.all()
        toptenitem_1_id = toptenitems[0].id

        response = create_reusable_item_1(self, toptenitem_1_id, **reusableitem_1_data)

        newreusableitem = self.reusableitem_1

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(ReusableItem.objects.count(), 1)

        # the new Reusable Item has the correct properties
        self.assertEqual(newreusableitem.name, reusableitem_1_data['name'])
        self.assertEqual(newreusableitem.definition, reusableitem_1_data['reusableItemDefinition'])
        self.assertEqual(newreusableitem.link, reusableitem_1_data['reusableItemLink'])

class ModifyReusableItemAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up non-modified objects used by all test methods
        # create_users(cls)
        create_user(cls, 1)
        create_user(cls, 2)

    def setUp(self):
        # use the api to create a Top Ten List and its Top Ten Items
        #create_toptenlist_1(self)
        create_toptenlist(self, 'user_1', 1)
        create_toptenlist(self, 'user_2', 2)

        # use the api to create a a Reusable Item
        self.client.force_authenticate(user=self.user_1)
        toptenitems = self.toptenlist_1.topTenItem.all()
        toptenitem_1_id = toptenitems[0].id

        create_reusable_item_1(self, toptenitem_1_id, **reusableitem_1_data)

    def test_get_reusableitem_api_not_public(self):
        """
        Can the user see a private reusable item?
        """

        # user not logged in
        self.client.logout()

        response = self.client.get(get_reusable_item_1_url(self))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # user logged in and created the Reusable Item
        self.client.force_authenticate(user=self.user_1)

        response = self.client.get(get_reusable_item_1_url(self))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # user logged in and did not create the Reusable Item
        self.client.logout()
        self.client.force_authenticate(user=self.user_2)

        response = self.client.get(get_reusable_item_1_url(self))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_reusableitem_api_public(self):
        """
        This should succeeed because the reusable item is public
        """

        self.reusableitem_1.is_public = True
        self.reusableitem_1.save()

        self.client.logout()


        response = self.client.get(get_reusable_item_1_url(self))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_reusableitem_api_fails(self):
        """
        This should fail because Reusable Items cannot be created directly via the API
        They can only be created when updating a Top Ten Item
        """
        self.client.force_authenticate(user=self.user_1)

        response = self.client.delete(get_reusable_item_1_url(self))

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_modify_reusableitem_not_authenticated(self):
        """
        modify a Reusable Item should fail if user is not logged in
        """
        self.client.logout()
        
        response = self.client.patch(get_reusable_item_1_url(self), {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_modify_reusableitem_not_verified(self):
        """
        modify a Reusable Item should fail if user's email address is not verified
        """
        email_address = EmailAddress.objects.get(user_id=self.user_1.id)
        email_address.verified = False
        email_address.save()

        self.client.force_authenticate(user=self.user_1)

        response = self.client.patch(get_reusable_item_1_url(self), {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_reusableitem_unsupported_modification(self):
        """
        Only certain modifications are allowed
        The api cannot modify a forbidden property

        """

        self.client.force_authenticate(user=self.user_1)

        response = self.client.patch(get_reusable_item_1_url(self), {'change_request': 'Some text'}, format='json')

        updated_object = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_make_reusableitem_public_owner(self):
        """
        The owner can make a reusable item public

        """

        # ensure is_public is false to start with
        original_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)
        original_reusableitem.is_public = False
        original_reusableitem.save()

        self.client.force_authenticate(user=self.user_1)

        response = self.client.patch(get_reusable_item_1_url(self), {'is_public': True}, format='json')

        updated_object = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # the value should be updated
        self.assertEqual(updated_object.is_public, True)

    def test_make_reusableitem_public_not_owner(self):
        """
        You can't make a reusable item public if you don't own it
        TODO make user_2 reference the reusable item
        """

        # ensure is_public is false to start with
        original_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)
        original_reusableitem.is_public = False
        original_reusableitem.save()

        self.client.force_authenticate(user=self.user_2)

        response = self.client.patch(get_reusable_item_1_url(self), {'is_public': True}, format='json')

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_make_reusableitem_private_owner(self):
        """
        This should create a private clone of the original public reusable item
        And leave the original as is
        """

        # ensure is_public is true to start with
        original_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)
        original_reusableitem.is_public = True
        original_reusableitem.save()

        # make another user reference the Reusable Item, so it won't be deleted
        toptenitems_2 = self.toptenlist_2.topTenItem.all()
        toptenitem_2_id = toptenitems_2[0].id

        reference_reusable_item(self, 'user_2', self.reusableitem_1.id, toptenitem_2_id)

        # user 1 makes the reusable item private
        self.client.force_authenticate(user=self.user_1)

        response = self.client.patch(get_reusable_item_1_url(self), {'is_public': False}, format='json')

        # find user 1's top ten item that references this reusable item
        toptenitems_1 = self.toptenlist_1.topTenItem.all()
        toptenitem_1_id = toptenitems_1[0].id

        # get the original reusable item again so we can check it hasn't changed
        updated_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # the original reusable item should still be public
        self.assertEqual(updated_reusableitem.is_public, True)

        # the new reusable item exists, is private and created by user 
        toptenitem_1 = TopTenItem.objects.get(pk=toptenitem_1_id)
        new_reusableitem = toptenitem_1.reusableItem

        # toptenitem_1 now references a new reusable item
        self.assertNotEqual(original_reusableitem, new_reusableitem)
        self.assertEqual(new_reusableitem.created_by, self.user_1)

        self.assertEqual(original_reusableitem.is_public, True)
        self.assertEqual(new_reusableitem.is_public, False)

        # user 2's top ten item should still reference the original reusable item
        toptenitem_2 = TopTenItem.objects.get(pk=toptenitem_2_id)
        self.assertEqual(original_reusableitem.id, toptenitem_2.reusableItem_id)

        # name, definition, link should be the same for all reusable items
        self.assertEqual(original_reusableitem.name, new_reusableitem.name)
        self.assertEqual(original_reusableitem.definition, new_reusableitem.definition)
        self.assertEqual(original_reusableitem.link, new_reusableitem.link)

        self.assertEqual(original_reusableitem.name, updated_reusableitem.name)
        self.assertEqual(original_reusableitem.definition, updated_reusableitem.definition)
        self.assertEqual(original_reusableitem.link, updated_reusableitem.link)

    def test_make_reusableitem_private_not_owner(self):
        """
        This should create a private clone of the original public reusable item
        And leave the original as is
        """

        # ensure is_public is true to start with
        original_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)
        original_reusableitem.is_public = True
        original_reusableitem.save()

        # make another user reference the Reusable Item, so it won't be deleted
        toptenitems_2 = self.toptenlist_2.topTenItem.all()
        toptenitem_2_id = toptenitems_2[0].id

        reference_reusable_item(self, 'user_2', self.reusableitem_1.id, toptenitem_2_id)

        # user 2 makes the reusable item private
        self.client.force_authenticate(user=self.user_2)

        response = self.client.patch(get_reusable_item_1_url(self), {'is_public': False}, format='json')

        # find user 2's top ten item that references this reusable item
        toptenitems_2 = self.toptenlist_2.topTenItem.all()
        toptenitem_2_id = toptenitems_2[0].id

        # get the original reusable item again so we can check it hasn't changed
        updated_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # the original reusable item should still be public
        self.assertEqual(updated_reusableitem.is_public, True)

        # the new reusable item exists, is private and created by user 
        toptenitem_2 = TopTenItem.objects.get(pk=toptenitem_2_id)
        new_reusableitem = toptenitem_2.reusableItem

        # toptenitem_2 now references a new reusable item
        self.assertNotEqual(original_reusableitem, new_reusableitem)
        self.assertEqual(new_reusableitem.created_by, self.user_2)

        self.assertEqual(original_reusableitem.is_public, True)
        self.assertEqual(new_reusableitem.is_public, False)

        # find user 1's top ten item that references this reusable item
        toptenitems_1 = self.toptenlist_1.topTenItem.all()
        toptenitem_1_id = toptenitems_1[0].id
        toptenitem_1 = TopTenItem.objects.get(pk=toptenitem_1_id)

        # user 1's top ten item should still reference the original reusable item
        self.assertEqual(original_reusableitem.id, toptenitem_1.reusableItem_id)

        # name, definition, link should be the same for both reusable items
        self.assertEqual(original_reusableitem.name, new_reusableitem.name)
        self.assertEqual(original_reusableitem.definition, new_reusableitem.definition)
        self.assertEqual(original_reusableitem.link, new_reusableitem.link)

        self.assertEqual(original_reusableitem.name, updated_reusableitem.name)
        self.assertEqual(original_reusableitem.definition, updated_reusableitem.definition)
        self.assertEqual(original_reusableitem.link, updated_reusableitem.link)
        # TODO three users should reference the ReusableItem so it is not deleted
        # TODO loop to create 10 users each with a Top Ten List

    def test_dereference_reusableitem(self):
        """
        if no top ten item references a reusable item, the reusable item should be deleted
        """

        original_reusableitem = ReusableItem.objects.filter(pk=self.reusableitem_1.id).first()

        self.assertNotEqual(original_reusableitem, None) 

        toptenitems_1 = self.toptenlist_1.topTenItem.all()
        toptenitem_1_id = toptenitems_1[0].id

        reference_reusable_item(self, 'user_1', None, toptenitem_1_id)

        check_reusableitem = ReusableItem.objects.filter(pk=self.reusableitem_1.id).first()

        self.assertEqual(check_reusableitem, None)

    def test_reusableitem_changerequest_bad_data(self):
        """
        Name cannot be set to empty string or None

        """

        self.client.force_authenticate(user=self.user_1)

        # name is empty string
        response = self.client.patch(get_reusable_item_1_url(self), {'name': '', 'link': 'hello'}, format='json')

        updated_object = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # name is None
        response = self.client.patch(get_reusable_item_1_url(self), {'name': None, 'link': 'hello'}, format='json')

        updated_object = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # no values
        response = self.client.patch(get_reusable_item_1_url(self), {}, format='json')

        updated_object = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # no new values
        response = self.client.patch(get_reusable_item_1_url(self), {'name': self.reusableitem_1.name}, format='json')

        updated_object = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resuableitem_submit_changerequest_private(self):
        """
        If a reusable item is private, and referenced only by its owner (but in more than one top ten item), they can update it directly
        """
        # add a second reference to this reusable item, by the same user
        toptenitems_2 = self.toptenlist_1.topTenItem.all()
        toptenitem_2_id = toptenitems_2[1].id

        reference_reusable_item(self, 'user_1', self.reusableitem_1.id, toptenitem_2_id)

        self.client.force_authenticate(user=self.user_1)

        # ensure is_public is false to start with
        original_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)
        original_reusableitem.is_public = False
        original_reusableitem.save()
        
        # owner can change name directly when nobody else references the reusable item
        data = {'name': 'Agatha Christie'}
        response = self.client.patch(get_reusable_item_1_url(self), data, format='json')

        updated_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(updated_reusableitem.name, data['name'])

        # owner can change definition, link directly
        data = {'definition': 'A writer', 'link': 'someurl'}
        response = self.client.patch(get_reusable_item_1_url(self), data, format='json')

        updated_object = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(updated_object.definition, data['definition'])
        self.assertEqual(updated_object.link, data['link'])

        # there should never be an existing change request for a reusable item referenced by only one user
        # it should have been resolved
        # should this occur through some bug, the user could withdraw their vote and then revote, that should trigger a count

        # other user cannot add change request
        self.client.force_authenticate(user=self.user_2)

        data = {'name': 'Agatha Christie'}

        response = self.client.patch(get_reusable_item_1_url(self), data, format='json')

        updated_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_resuableitem_submit_changerequest_public(self):
        # ensure is_public is true to start with
        original_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)
        original_reusableitem.is_public = True
        original_reusableitem.save()

        self.client.force_authenticate(user=self.user_1)

        # owner can change name directly when nobody else references the reusable item
        data1 = {'name': 'Agatha Christie', 'definition': 'A writer', 'link': 'someurl'}
        response = self.client.patch(get_reusable_item_1_url(self), data1, format='json')

        updated_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(updated_reusableitem.name, data1['name'])

        # add a second reference to this reusable item, by a different user
        toptenitems_2 = self.toptenlist_2.topTenItem.all()
        toptenitem_2_id = toptenitems_2[0].id

        reference_reusable_item(self, 'user_2', self.reusableitem_1.id, toptenitem_2_id)

        # owner can propose a change request
        # it does not update immediately
        self.client.force_authenticate(user=self.user_1)
        data2 = {'name': 'Agatha Christie 2', 'definition': 'A writer 2', 'link': 'someurl2'}
        response = self.client.patch(get_reusable_item_1_url(self), data2, format='json')

        updated_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # editable properties unchanged
        self.assertEqual(updated_reusableitem.name, data1['name'])
        self.assertEqual(updated_reusableitem.definition, data1['definition'])
        self.assertEqual(updated_reusableitem.link, data1['link'])

        # change request created
        self.assertEqual(updated_reusableitem.change_request['name'], data2['name'])
        self.assertEqual(updated_reusableitem.change_request['definition'], data2['definition'])
        self.assertEqual(updated_reusableitem.change_request['link'], data2['link'])

        # user 1 has voted for it
        self.assertEqual(updated_reusableitem.change_request_votes_no.count(), 0)
        self.assertEqual(updated_reusableitem.change_request_votes_yes.count(), 1)
        self.assertEqual(updated_reusableitem.change_request_votes_yes.first(), self.user_1)

        # user 2 now votes for the change request
        self.client.force_authenticate(user=self.user_2)

        data3 = {'vote': 'yes'}
        response = self.client.patch(get_reusable_item_1_url(self), data3, format='json')

        updated_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # it should be resolved
        self.assertEqual(updated_reusableitem.change_request, None)
        self.assertEqual(updated_reusableitem.change_request_votes_no.count(), 0)
        self.assertEqual(updated_reusableitem.change_request_votes_yes.count(), 0)

        self.assertEqual(updated_reusableitem.name, data2['name'])
        self.assertEqual(updated_reusableitem.definition, data2['definition'])
        self.assertEqual(updated_reusableitem.link, data2['link'])

        # history has been updated
        print(updated_reusableitem.history[1])
        self.assertNotEqual(updated_reusableitem.history[1], None)

        # TODO
        """
        reusable item is not public and different user
        user does not reference reusable item even if it is public
        change request already exists
        success by owner
        success by other user
        immediate update if only user
        """

    """
    tests required:

    submit change request
    vote on change request
    cancel change request

    propose change request:
    cannot directly edit a reusableItem
    can submit change request if none exists already, and user references the item, and new data
    automatically vote after successfully proposing change request
    cannot set name to empty string, but can set definition and link to empty string

    vote:
    can vote if change request exists and user references it
    vote must be 'yes' or 'no'
    votes are processed and change request removed and reusable item updated if 'yes' passes
    handle change request rejected
    reusableItem history is updated
    do we keep a record of failed change requests? Not at present, no.

    """