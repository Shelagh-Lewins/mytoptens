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

def reference_reusable_item(self, user_ref, reusableitem_id, toptenlist_ref, index):
    """
    Set a top ten item to reference a reusable item
    """

    self.client.force_authenticate(user=getattr(self, user_ref))

    toptenitems = getattr(self, toptenlist_ref).topTenItem.all()
    toptenitem_id = toptenitems[index].id

    item_detail_url = reverse('topTenLists:TopTenItems-detail', kwargs={'pk': toptenitem_id})
    response = self.client.patch(item_detail_url, {'reusableItem_id': reusableitem_id}, format='json')

    self.client.logout()

    return response

def setup_public_reusable_item_1(self):
    """
    Make self.reusableitem_1 public
    Make another user reference it
    So that when a change request is submitted, it will not update automatically
    """

    # ensure reusable item is public
    reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)
    reusableitem.is_public = True
    reusableitem.save()

    # add a reference to this reusable item by user 2
    reference_reusable_item(self, 'user_2', self.reusableitem_1.id, 'toptenlist_2', 0)

    return reusableitem

def submit_change_request_1(self, user):
    """
    Submit a valid change request to the public reusable item set up in setup_public_reusable_item_1() 

    """

    # a user proposes a change request
    self.client.force_authenticate(user=user)
    change_request = {'name': 'Not Jane Austen', 'definition': 'A writer', 'link': 'someurl'}
    response = self.client.patch(get_reusable_item_1_url(self), change_request, format='json')

    self.assertEqual(response.status_code, status.HTTP_200_OK)

    self.client.logout()

    return change_request

def make_reusable_item_public(id):
    """
    Make a reusable item public
    """
    reusableitem = ReusableItem.objects.get(pk=id)
    reusableitem.is_public = True
    reusableitem.save()

    return reusableitem


class CreateReusableItemAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        for index in range(1, 3): # user_1 to user_2
            create_user(cls, index)

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
        for index in range(1, 101): # user_1 to user_10
            create_user(cls, index)

    def setUp(self):
        # for each test user, use the api to create a Top Ten List and its Top Ten Items
        for index in range(1, 101): # user_1 to user_10
            create_toptenlist(self, 'user_' + index.__str__(), index)

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

        original_reusableitem = make_reusable_item_public(self.reusableitem_1.id)

        # make another user reference the Reusable Item, so it won't be deleted
        reference_reusable_item(self, 'user_2', self.reusableitem_1.id, 'toptenlist_2', 0)

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
        toptenitems_2 = self.toptenlist_2.topTenItem.all()
        toptenitem_2_id = toptenitems_2[0].id

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

        original_reusableitem = make_reusable_item_public(self.reusableitem_1.id)

        # make another user reference the Reusable Item, so it won't be deleted
        reference_reusable_item(self, 'user_2', self.reusableitem_1.id, 'toptenlist_2', 0)

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

        reference_reusable_item(self, 'user_1', None, 'toptenlist_1', 0)

        toptenitems_1 = self.toptenlist_1.topTenItem.all()
        toptenitem_1_id = toptenitems_1[0].id

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
        reference_reusable_item(self, 'user_1', self.reusableitem_1.id, 'toptenlist_1', 1)

        self.client.force_authenticate(user=self.user_1)

        # ensure is_public is false to start with
        original_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)
        original_reusableitem.is_public = False
        original_reusableitem.save()
        
        # owner can change name directly when nobody else references the reusable item
        data = {'name': 'Not Jane Austen'}
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

        # Note: there should never be an existing change request for a reusable item referenced by only one user
        # it should have been resolved
        # should this occur through some bug, the user could withdraw their vote and then revote, that should trigger a count

        # other user cannot add change request
        self.client.force_authenticate(user=self.user_2)

        data = {'name': 'Not Jane Austen'}

        response = self.client.patch(get_reusable_item_1_url(self), data, format='json')

        updated_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_resuableitem_submit_changerequest_public_owner_accept(self):
        """
        The owner can submit a change request to a public reusable item
        """

        original_reusableitem = make_reusable_item_public(self.reusableitem_1.id)

        # Create a second list for the owner
        create_toptenlist(self, 'user_1', '1_2')

        # And set one of its items to reference the reusable item
        # This allows the count of users to be checked
        reference_reusable_item(self, 'user_1', self.reusableitem_1.id, 'toptenlist_1_2', 4)

        # submit the change request
        data1 = submit_change_request_1(self, self.user_1)
        updated_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # editable values have been updated
        self.assertEqual(updated_reusableitem.name, data1['name'])
        self.assertEqual(updated_reusableitem.definition, data1['definition'])
        self.assertEqual(updated_reusableitem.link, data1['link'])

        # history has been updated
        history_entry = updated_reusableitem.history[1]
        self.assertNotEqual(history_entry, None)
        self.assertEqual(history_entry['change_request_resolution'], 'accepted')
        self.assertNotEqual(history_entry['changed_request_resolved_at'], None)
        self.assertEqual(history_entry['changed_request_submitted_by_id'], self.user_1.id.__str__())
        self.assertEqual(history_entry['number_of_users'], 1)
        self.assertEqual(history_entry['change_request_votes_yes_count'], 1)
        self.assertEqual(history_entry['change_request_votes_no_count'], 0)

        self.assertEqual(history_entry['change_request']['name'], data1['name'])
        self.assertEqual(history_entry['change_request']['definition'], data1['definition'])
        self.assertEqual(history_entry['change_request']['link'], data1['link'])

        # add a second reference to this reusable item, by a different user
        reference_reusable_item(self, 'user_2', self.reusableitem_1.id, 'toptenlist_2', 0)

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
        history_entry = updated_reusableitem.history[2]
        self.assertNotEqual(history_entry, None)
        self.assertEqual(history_entry['change_request_resolution'], 'accepted')
        self.assertNotEqual(history_entry['changed_request_resolved_at'], None)
        self.assertEqual(history_entry['changed_request_submitted_by_id'], self.user_1.id.__str__())
        self.assertEqual(history_entry['number_of_users'], 2)
        self.assertEqual(history_entry['change_request_votes_yes_count'], 2)
        self.assertEqual(history_entry['change_request_votes_no_count'], 0)

        self.assertEqual(history_entry['change_request']['name'], data2['name'])
        self.assertEqual(history_entry['change_request']['definition'], data2['definition'])
        self.assertEqual(history_entry['change_request']['link'], data2['link'])

    def test_resuableitem_submit_changerequest_public_not_owner_accept(self):
        """
        Another user can submit a change request to a public reusable item
        """

        original_reusableitem = setup_public_reusable_item_1(self)

        # user 2 can propose a change request
        # it does not update immediately
        data = submit_change_request_1(self, self.user_2)

        updated_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # editable properties unchanged
        self.assertEqual(updated_reusableitem.name, original_reusableitem.name)
        self.assertEqual(updated_reusableitem.definition, original_reusableitem.definition)
        self.assertEqual(updated_reusableitem.link, original_reusableitem.link)

        # change request created
        self.assertEqual(updated_reusableitem.change_request['name'], data['name'])
        self.assertEqual(updated_reusableitem.change_request['definition'], data['definition'])
        self.assertEqual(updated_reusableitem.change_request['link'], data['link'])

        # user 2 has voted for it
        self.assertEqual(updated_reusableitem.change_request_votes_no.count(), 0)
        self.assertEqual(updated_reusableitem.change_request_votes_yes.count(), 1)
        self.assertEqual(updated_reusableitem.change_request_votes_yes.first(), self.user_2)

        # user 1 now votes for the change request
        self.client.force_authenticate(user=self.user_1)

        data3 = {'vote': 'yes'}
        response = self.client.patch(get_reusable_item_1_url(self), data3, format='json')

        updated_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # it should be resolved
        self.assertEqual(updated_reusableitem.change_request, None)
        self.assertEqual(updated_reusableitem.change_request_votes_no.count(), 0)
        self.assertEqual(updated_reusableitem.change_request_votes_yes.count(), 0)

        self.assertEqual(updated_reusableitem.name, data['name'])
        self.assertEqual(updated_reusableitem.definition, data['definition'])
        self.assertEqual(updated_reusableitem.link, data['link'])

        # history has been updated
        history_entry = updated_reusableitem.history[1]
        self.assertNotEqual(history_entry, None)
        self.assertEqual(history_entry['change_request_resolution'], 'accepted')
        self.assertNotEqual(history_entry['changed_request_resolved_at'], None)
        self.assertEqual(history_entry['changed_request_submitted_by_id'], self.user_2.id.__str__())
        self.assertEqual(history_entry['number_of_users'], 2)
        self.assertEqual(history_entry['change_request_votes_yes_count'], 2)
        self.assertEqual(history_entry['change_request_votes_no_count'], 0)

        self.assertEqual(history_entry['change_request']['name'], data['name'])
        self.assertEqual(history_entry['change_request']['definition'], data['definition'])
        self.assertEqual(history_entry['change_request']['link'], data['link'])

    def test_resuableitem_submit_changerequest_public_owner_reject(self):
        """
        The owner can submit a change request to a public reusable item
        """
        original_reusableitem = setup_public_reusable_item_1(self)
        data1 = submit_change_request_1(self, self.user_1)

        # user 2 now votes against the change request
        self.client.force_authenticate(user=self.user_2)

        data2 = {'vote': 'no'}
        response = self.client.patch(get_reusable_item_1_url(self), data2, format='json')

        updated_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # the change request should be resolved
        self.assertEqual(updated_reusableitem.change_request, None)
        self.assertEqual(updated_reusableitem.change_request_votes_no.count(), 0)
        self.assertEqual(updated_reusableitem.change_request_votes_yes.count(), 0)

        # the editable properties should be unchanged
        self.assertEqual(updated_reusableitem.name, original_reusableitem.name)
        self.assertEqual(updated_reusableitem.definition, original_reusableitem.definition)
        self.assertEqual(updated_reusableitem.link, original_reusableitem.link)

        # history has been updated
        history_entry = updated_reusableitem.history[1]

        self.assertNotEqual(history_entry, None)
        self.assertEqual(history_entry['change_request_resolution'], 'rejected')
        self.assertNotEqual(history_entry['changed_request_resolved_at'], None)
        self.assertEqual(history_entry['changed_request_submitted_by_id'], self.user_1.id.__str__())
        self.assertEqual(history_entry['number_of_users'], 2)
        self.assertEqual(history_entry['change_request_votes_yes_count'], 1)
        self.assertEqual(history_entry['change_request_votes_no_count'], 1)

        self.assertEqual(history_entry['change_request']['name'], data1['name'])
        self.assertEqual(history_entry['change_request']['definition'], data1['definition'])
        self.assertEqual(history_entry['change_request']['link'], data1['link'])

    def test_resuableitem_submit_changerequest_public_owner_not_referenced(self):
        """
        A user cannot submit a change request to a public reusable item that they do not reference
        """

        original_reusableitem = make_reusable_item_public(self.reusableitem_1.id)

        self.client.force_authenticate(user=self.user_2)

        # user 2 tries to submit a change request to a reusable item they do not reference in their top ten lists
        data = {'name': 'Not Jane Austen', 'definition': 'A writer', 'link': 'someurl'}
        response = self.client.patch(get_reusable_item_1_url(self), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resuableitem_cancel_changerequest_submitter(self):
        """
        The submitter can cancel a change request
        """

        original_reusableitem = setup_public_reusable_item_1(self)
        data1 = submit_change_request_1(self, self.user_1)

        # user 1 now cancels the change request
        self.client.force_authenticate(user=self.user_1)
        data2 = {'cancel': 'true'}
        response = self.client.patch(get_reusable_item_1_url(self), data2, format='json')

        updated_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # change request has been removed
        self.assertEqual(updated_reusableitem.change_request, None)
        self.assertEqual(updated_reusableitem.change_request_votes_no.count(), 0)
        self.assertEqual(updated_reusableitem.change_request_votes_yes.count(), 0)

        # history has been updated
        history_entry = updated_reusableitem.history[1]

        self.assertNotEqual(history_entry, None)
        self.assertEqual(history_entry['change_request_resolution'], 'cancelled')
        self.assertNotEqual(history_entry['changed_request_resolved_at'], None)
        self.assertEqual(history_entry['changed_request_submitted_by_id'], self.user_1.id.__str__())
        self.assertEqual(history_entry['number_of_users'], 2)
        self.assertEqual(history_entry['change_request_votes_yes_count'], 1)
        self.assertEqual(history_entry['change_request_votes_no_count'], 0)

        self.assertEqual(history_entry['change_request']['name'], data1['name'])
        self.assertEqual(history_entry['change_request']['definition'], data1['definition'])
        self.assertEqual(history_entry['change_request']['link'], data1['link'])

    def test_resuableitem_cancel_changerequest_not_submitter(self):
        """
        The submitter can cancel a change request
        """

        original_reusableitem = setup_public_reusable_item_1(self)

        # user 2 proposes a change request
        data1 = submit_change_request_1(self, self.user_2)

        # user 2 now cancels the change request
        self.client.force_authenticate(user=self.user_1)

        data2 = {'cancel': 'true'}
        response = self.client.patch(get_reusable_item_1_url(self), data2, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resuableitem_invalid_vote(self):
        """
        Vote must be 'yes', 'no' or '' (to withdraw vote)
        """

        original_reusableitem = setup_public_reusable_item_1(self)
        data1 = submit_change_request_1(self, self.user_1)

        # user 2 now submits an invalid vote
        self.client.force_authenticate(user=self.user_2)

        data2 = {'vote': 'banana'}
        response = self.client.patch(get_reusable_item_1_url(self), data2, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resuableitem_vote_not_referenced(self):
        """
        You cannot vote on a change request if you do not reference the reusable item
        """

        original_reusableitem = setup_public_reusable_item_1(self)
        data1 = submit_change_request_1(self, self.user_1)

        # user 3 now submits a vote
        self.client.force_authenticate(user=self.user_3)

        data2 = {'vote': 'banana'}
        response = self.client.patch(get_reusable_item_1_url(self), data2, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reusableitem_withdraw_vote(self):
        original_reusableitem = make_reusable_item_public(self.reusableitem_1.id)

        # user 2 references it
        reference_reusable_item(self, 'user_2', self.reusableitem_1.id, 'toptenlist_2', 0)

        # submit the change request
        data1 = submit_change_request_1(self, self.user_1)
        updated_reusableitem1 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        self.assertEqual(updated_reusableitem1.change_request_votes_yes.first(), self.user_1)
        self.assertEqual(updated_reusableitem1.change_request_votes_yes.count(), 1)

        # User 1 withdraws their vote
        self.client.force_authenticate(user=self.user_1)
        data2 = {'vote': ''}
        response = self.client.patch(get_reusable_item_1_url(self), data2, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem2 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        self.assertEqual(updated_reusableitem2.change_request_votes_yes.count(), 0)

    def test_reusableitem_vote_user_count_3_accept(self):
        """
        Test voting when 3 users reference a top ten item
        And 2 vote for it
        """

        original_reusableitem = make_reusable_item_public(self.reusableitem_1.id)

        # user 2 and user 3 reference it
        reference_reusable_item(self, 'user_2', self.reusableitem_1.id, 'toptenlist_2', 0)
        reference_reusable_item(self, 'user_3', self.reusableitem_1.id, 'toptenlist_3', 0)

        # submit the change request
        #print('===============')
        data1 = submit_change_request_1(self, self.user_1)
        updated_reusableitem1 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        self.assertEqual(updated_reusableitem1.change_request_votes_yes.first(), self.user_1)
        self.assertEqual(updated_reusableitem1.change_request_votes_yes.count(), 1)

        # User 2 votes against
        #print('*******')
        self.client.force_authenticate(user=self.user_2)
        data2 = {'vote': 'no'}
        response = self.client.patch(get_reusable_item_1_url(self), data2, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem2 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        #print('updated_reusableitem2.change_request_votes_yes.first()', updated_reusableitem2.change_request_votes_yes.first())
        # the change request should not be resolved
        self.assertNotEqual(updated_reusableitem2.change_request, None)

        self.assertEqual(updated_reusableitem2.change_request_votes_yes.first(), self.user_1)
        self.assertEqual(updated_reusableitem2.change_request_votes_yes.count(), 1)

        self.assertEqual(updated_reusableitem2.change_request_votes_no.first(), self.user_2)
        self.assertEqual(updated_reusableitem2.change_request_votes_no.count(), 1)

       # User 3 votes for
        #print('*******222')
        self.client.force_authenticate(user=self.user_3)
        data3 = {'vote': 'yes'}
        response = self.client.patch(get_reusable_item_1_url(self), data3, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem3 = ReusableItem.objects.get(pk=self.reusableitem_1.id)
        #print('updated_reusableitem3', updated_reusableitem3.__dict__)
        # it should be resolved
        self.assertEqual(updated_reusableitem3.change_request, None)
        self.assertEqual(updated_reusableitem3.change_request_votes_no.count(), 0)
        self.assertEqual(updated_reusableitem3.change_request_votes_yes.count(), 0)

        self.assertEqual(updated_reusableitem3.name, data1['name'])
        self.assertEqual(updated_reusableitem3.definition, data1['definition'])
        self.assertEqual(updated_reusableitem3.link, data1['link'])

    def test_reusableitem_vote_user_count_3_reject(self):
        """
        Test voting when 3 users reference a top ten item
        And 2 vote against
        """

        original_reusableitem = make_reusable_item_public(self.reusableitem_1.id)

        # user 2 and user 3 reference it
        reference_reusable_item(self, 'user_2', self.reusableitem_1.id, 'toptenlist_2', 0)
        reference_reusable_item(self, 'user_3', self.reusableitem_1.id, 'toptenlist_3', 0)

        # submit the change request
        data1 = submit_change_request_1(self, self.user_1)
        updated_reusableitem1 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        self.assertEqual(updated_reusableitem1.change_request_votes_yes.first(), self.user_1)
        self.assertEqual(updated_reusableitem1.change_request_votes_yes.count(), 1)

        # User 2 votes against
        self.client.force_authenticate(user=self.user_2)
        data2 = {'vote': 'no'}
        response = self.client.patch(get_reusable_item_1_url(self), data2, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem2 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should not be resolved
        self.assertNotEqual(updated_reusableitem2.change_request, None)

       # User 3 votes against
        self.client.force_authenticate(user=self.user_3)
        data3 = {'vote': 'no'}
        response = self.client.patch(get_reusable_item_1_url(self), data3, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem3 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # it should be rejected
        #print('********')
        self.assertEqual(updated_reusableitem3.change_request, None)
        history_entry = updated_reusableitem3.history[1]
        self.assertEqual(history_entry['change_request_resolution'], 'rejected')

    def test_reusableitem_vote_user_count_4_reject(self):
        """
        Test voting when 4 users reference a top ten item
        """

        original_reusableitem = make_reusable_item_public(self.reusableitem_1.id)

        for index in range(2, 5): # users 2 to 4
            reference_reusable_item(self, 'user_' + index.__str__(), self.reusableitem_1.id, 'toptenlist_' + index.__str__(), 0)

        # submit the change request
        data1 = submit_change_request_1(self, self.user_1)
        updated_reusableitem1 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # User 2 votes against
        self.client.force_authenticate(user=self.user_2)
        data2 = {'vote': 'no'}
        response = self.client.patch(get_reusable_item_1_url(self), data2, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem2 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should not be resolved
        self.assertNotEqual(updated_reusableitem2.change_request, None)

        # User 3 votes against
        self.client.force_authenticate(user=self.user_3)
        data2 = {'vote': 'no'}
        response = self.client.patch(get_reusable_item_1_url(self), data2, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem3 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should be resolved
        self.assertEqual(updated_reusableitem3.change_request, None)

        # it should be rejected
        history_entry = updated_reusableitem3.history[-1]
        self.assertEqual(history_entry['change_request_resolution'], 'rejected')

    def test_reusableitem_vote_user_count_4_accept(self):
        """
        Test voting when 4 users reference a top ten item
        """

        original_reusableitem = make_reusable_item_public(self.reusableitem_1.id)

        for index in range(2, 5): # users 2 to 4
            reference_reusable_item(self, 'user_' + index.__str__(), self.reusableitem_1.id, 'toptenlist_' + index.__str__(), 0)

        # submit the change request
        data1 = submit_change_request_1(self, self.user_1)
        updated_reusableitem1 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # User 2 votes against
        self.client.force_authenticate(user=self.user_2)
        data2 = {'vote': 'no'}
        response = self.client.patch(get_reusable_item_1_url(self), data2, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem2 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should not be resolved
        self.assertNotEqual(updated_reusableitem2.change_request, None)

        # User 3 votes for
        self.client.force_authenticate(user=self.user_3)
        data2 = {'vote': 'yes'}
        response = self.client.patch(get_reusable_item_1_url(self), data2, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem3 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should be resolved
        self.assertEqual(updated_reusableitem3.change_request, None)

        # it should be accepted
        history_entry = updated_reusableitem3.history[-1]
        self.assertEqual(history_entry['change_request_resolution'], 'accepted')

    def test_reusableitem_vote_user_count_5_accept(self):
        """
        Test voting when 5 users reference a top ten item
        """

        original_reusableitem = make_reusable_item_public(self.reusableitem_1.id)

        for index in range(2, 6): # users 2 to 5
            reference_reusable_item(self, 'user_' + index.__str__(), self.reusableitem_1.id, 'toptenlist_' + index.__str__(), 0)

        # submit the change request
        data1 = submit_change_request_1(self, self.user_1)
        updated_reusableitem1 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # User 2 votes against
        self.client.force_authenticate(user=self.user_2)
        data2 = {'vote': 'no'}
        response = self.client.patch(get_reusable_item_1_url(self), data2, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem2 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should not be resolved
        self.assertNotEqual(updated_reusableitem2.change_request, None)

        # User 3 votes against
        self.client.force_authenticate(user=self.user_3)
        data3 = {'vote': 'no'}
        response = self.client.patch(get_reusable_item_1_url(self), data3, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem3 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should not be resolved
        self.assertNotEqual(updated_reusableitem3.change_request, None)

        # User 4 votes for
        self.client.force_authenticate(user=self.user_4)
        data4 = {'vote': 'yes'}
        response = self.client.patch(get_reusable_item_1_url(self), data4, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem4 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should not be resolved
        self.assertNotEqual(updated_reusableitem4.change_request, None)

        # User 5 votes for
        self.client.force_authenticate(user=self.user_5)
        data5 = {'vote': 'yes'}
        response = self.client.patch(get_reusable_item_1_url(self), data5, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem5 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should be resolved
        self.assertEqual(updated_reusableitem5.change_request, None)

        # it should be accepted
        history_entry = updated_reusableitem5.history[-1]
        self.assertEqual(history_entry['change_request_resolution'], 'accepted')
    
    def test_reusableitem_vote_user_count_5_reject(self):
        """
        5 users reference a top ten item
        """

        original_reusableitem = make_reusable_item_public(self.reusableitem_1.id)

        for index in range(2, 6): # users 2 to 5
            reference_reusable_item(self, 'user_' + index.__str__(), self.reusableitem_1.id, 'toptenlist_' + index.__str__(), 0)

        # submit the change request
        data1 = submit_change_request_1(self, self.user_1)
        updated_reusableitem1 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # User 2 votes against
        self.client.force_authenticate(user=self.user_2)
        data2 = {'vote': 'no'}
        response = self.client.patch(get_reusable_item_1_url(self), data2, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem2 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should not be resolved
        self.assertNotEqual(updated_reusableitem2.change_request, None)

        # User 3 votes against
        self.client.force_authenticate(user=self.user_3)
        data2 = {'vote': 'no'}
        response = self.client.patch(get_reusable_item_1_url(self), data2, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem3 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should not be resolved
        self.assertNotEqual(updated_reusableitem3.change_request, None)

        # User 4 votes for
        self.client.force_authenticate(user=self.user_4)
        data2 = {'vote': 'no'}
        response = self.client.patch(get_reusable_item_1_url(self), data2, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem4 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should not be resolved
        self.assertEqual(updated_reusableitem4.change_request, None)

        # it should be accepted
        history_entry = updated_reusableitem4.history[-1]
        self.assertEqual(history_entry['change_request_resolution'], 'rejected')

    def test_reusableitem_vote_user_count_7_accept(self):
        """
        7 users reference a top ten item
        """

        original_reusableitem = make_reusable_item_public(self.reusableitem_1.id)

        for index in range(2, 8): # users 2 to 7
            reference_reusable_item(self, 'user_' + index.__str__(), self.reusableitem_1.id, 'toptenlist_' + index.__str__(), 0)

        # submit the change request
        data1 = submit_change_request_1(self, self.user_1)
        updated_reusableitem1 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # User 2 votes against
        self.client.force_authenticate(user=self.user_2)
        data2 = {'vote': 'no'}
        response = self.client.patch(get_reusable_item_1_url(self), data2, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem2 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should not be resolved
        self.assertNotEqual(updated_reusableitem2.change_request, None)

        # User 3 votes for
        self.client.force_authenticate(user=self.user_3)
        data3 = {'vote': 'yes'}
        response = self.client.patch(get_reusable_item_1_url(self), data3, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem3 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should not be resolved
        self.assertNotEqual(updated_reusableitem3.change_request, None)

        # User 4 votes for
        self.client.force_authenticate(user=self.user_4)
        data4 = {'vote': 'yes'}
        response = self.client.patch(get_reusable_item_1_url(self), data4, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem4 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should be resolved
        self.assertEqual(updated_reusableitem4.change_request, None)

        # it should be accepted
        history_entry = updated_reusableitem4.history[-1]
        self.assertEqual(history_entry['change_request_resolution'], 'accepted')
    
    def test_reusableitem_vote_user_count_7_rejecta(self):
        """
        7 users reference a top ten item
        2 users vote against, meaning the change request cannot be accepted before reaching the reject quorum
        """

        original_reusableitem = make_reusable_item_public(self.reusableitem_1.id)

        for index in range(2, 8): # users 2 to 7
            reference_reusable_item(self, 'user_' + index.__str__(), self.reusableitem_1.id, 'toptenlist_' + index.__str__(), 0)

        # submit the change request
        data1 = submit_change_request_1(self, self.user_1)
        updated_reusableitem1 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # User 2 votes against
        self.client.force_authenticate(user=self.user_2)
        data2 = {'vote': 'no'}
        response = self.client.patch(get_reusable_item_1_url(self), data2, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem2 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should not be resolved
        self.assertNotEqual(updated_reusableitem2.change_request, None)

        # User 3 votes against
        self.client.force_authenticate(user=self.user_3)
        data2 = {'vote': 'no'}
        response = self.client.patch(get_reusable_item_1_url(self), data2, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem3 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should be resolved
        self.assertEqual(updated_reusableitem3.change_request, None)

        history_entry = updated_reusableitem3.history[-1]
        self.assertEqual(history_entry['change_request_resolution'], 'rejected')

    def test_reusableitem_vote_user_count_7_reject_b(self):
        """
        7 users reference a top ten item
        order of voting is different, so different reject criterion is triggered
        """

        original_reusableitem = make_reusable_item_public(self.reusableitem_1.id)

        for index in range(2, 8): # users 2 to 7
            reference_reusable_item(self, 'user_' + index.__str__(), self.reusableitem_1.id, 'toptenlist_' + index.__str__(), 0)

        # submit the change request
        data1 = submit_change_request_1(self, self.user_1)
        updated_reusableitem1 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # User 2 votes against
        self.client.force_authenticate(user=self.user_2)
        data2 = {'vote': 'no'}
        response = self.client.patch(get_reusable_item_1_url(self), data2, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem2 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should not be resolved
        self.assertNotEqual(updated_reusableitem2.change_request, None)

        # User 3 votes for
        self.client.force_authenticate(user=self.user_3)
        data2 = {'vote': 'yes'}
        response = self.client.patch(get_reusable_item_1_url(self), data2, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem3 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should not be resolved
        self.assertNotEqual(updated_reusableitem3.change_request, None)

        # User 4 votes against
        self.client.force_authenticate(user=self.user_4)
        data2 = {'vote': 'no'}
        response = self.client.patch(get_reusable_item_1_url(self), data2, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem4 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should not be resolved
        self.assertEqual(updated_reusableitem4.change_request, None)

        # it should be accepted
        history_entry = updated_reusableitem4.history[-1]
        self.assertEqual(history_entry['change_request_resolution'], 'rejected')

    def test_reusableitem_vote_user_count_20_accept(self):
        """
        20 users reference a top ten item
        """

        original_reusableitem = make_reusable_item_public(self.reusableitem_1.id)

        for index in range(2, 21): # users 2 to 20
            reference_reusable_item(self, 'user_' + index.__str__(), self.reusableitem_1.id, 'toptenlist_' + index.__str__(), 0)

        # submit the change request
        data1 = submit_change_request_1(self, self.user_1)
        updated_reusableitem1 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # users vote for
        for index in range(2, 6): # users 2 to 5
            #print('INDEX for:', index)
            self.client.force_authenticate(user=getattr(self, 'user_' + index.__str__()))
            response = self.client.patch(get_reusable_item_1_url(self), {'vote': 'yes'}, format='json')

            self.assertEqual(response.status_code, status.HTTP_200_OK)

        # users vote against
        for index in range(6, 7): # users 6 to 6
            #print('INDEX against:', index)
            self.client.force_authenticate(user=getattr(self, 'user_' + index.__str__()))
            response = self.client.patch(get_reusable_item_1_url(self), {'vote': 'no'}, format='json')

            self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem2 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should be resolved
        self.assertEqual(updated_reusableitem2.change_request, None)

        # it should be accepted
        history_entry = updated_reusableitem2.history[-1]
        self.assertEqual(history_entry['change_request_resolution'], 'accepted')


    def test_reusableitem_vote_user_count_20_reject(self):
        """
        20 users reference a top ten item
        """

        original_reusableitem = make_reusable_item_public(self.reusableitem_1.id)

        for index in range(2, 21): # users 2 to 20
            reference_reusable_item(self, 'user_' + index.__str__(), self.reusableitem_1.id, 'toptenlist_' + index.__str__(), 0)

        # submit the change request
        data1 = submit_change_request_1(self, self.user_1)
        updated_reusableitem1 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # users vote for
        for index in range(2, 5):
            #print('INDEX for:', index)
            self.client.force_authenticate(user=getattr(self, 'user_' + index.__str__()))
            response = self.client.patch(get_reusable_item_1_url(self), {'vote': 'yes'}, format='json')

            self.assertEqual(response.status_code, status.HTTP_200_OK)

        # users vote against
        for index in range(5, 8):
            #print('INDEX against:', index)
            self.client.force_authenticate(user=getattr(self, 'user_' + index.__str__()))
            response = self.client.patch(get_reusable_item_1_url(self), {'vote': 'no'}, format='json')

            self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem2 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should be resolved
        self.assertEqual(updated_reusableitem2.change_request, None)

        # it should be accepted
        history_entry = updated_reusableitem2.history[-1]
        self.assertEqual(history_entry['change_request_resolution'], 'rejected')

    def test_reusableitem_vote_user_count_80_accept(self):
        """
        80 users reference a top ten item
        """

        original_reusableitem = make_reusable_item_public(self.reusableitem_1.id)

        for index in range(2, 81):
            reference_reusable_item(self, 'user_' + index.__str__(), self.reusableitem_1.id, 'toptenlist_' + index.__str__(), 0)

        # submit the change request
        data1 = submit_change_request_1(self, self.user_1)
        updated_reusableitem1 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # users vote against
        for index in range(2, 4):
            #print('INDEX against:', index)
            self.client.force_authenticate(user=getattr(self, 'user_' + index.__str__()))
            response = self.client.patch(get_reusable_item_1_url(self), {'vote': 'no'}, format='json')

            self.assertEqual(response.status_code, status.HTTP_200_OK)

        # users vote for
        for index in range(4, 11):
            #print('INDEX for 1:', index)
            self.client.force_authenticate(user=getattr(self, 'user_' + index.__str__()))
            response = self.client.patch(get_reusable_item_1_url(self), {'vote': 'yes'}, format='json')

            self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem2 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should be resolved
        self.assertEqual(updated_reusableitem2.change_request, None)

        # it should be accepted
        history_entry = updated_reusableitem2.history[-1]
        self.assertEqual(history_entry['change_request_resolution'], 'accepted')

    def test_reusableitem_vote_user_count_80_reject(self):
        """
        80 users reference a top ten item
        """

        original_reusableitem = make_reusable_item_public(self.reusableitem_1.id)

        for index in range(2, 81):
            reference_reusable_item(self, 'user_' + index.__str__(), self.reusableitem_1.id, 'toptenlist_' + index.__str__(), 0)

        # submit the change request
        data1 = submit_change_request_1(self, self.user_1)
        updated_reusableitem1 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # users vote against
        for index in range(2, 5):
            #print('INDEX for:', index)
            self.client.force_authenticate(user=getattr(self, 'user_' + index.__str__()))
            response = self.client.patch(get_reusable_item_1_url(self), {'vote': 'no'}, format='json')

            self.assertEqual(response.status_code, status.HTTP_200_OK)

        # users vote for
        for index in range(5, 16):
            #print('INDEX for 2:', index)
            self.client.force_authenticate(user=getattr(self, 'user_' + index.__str__()))
            response = self.client.patch(get_reusable_item_1_url(self), {'vote': 'yes'}, format='json')

            self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_reusableitem2 = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the change request should be resolved
        self.assertEqual(updated_reusableitem2.change_request, None)

        # it should be accepted
        history_entry = updated_reusableitem2.history[-1]
        self.assertEqual(history_entry['change_request_resolution'], 'accepted')
