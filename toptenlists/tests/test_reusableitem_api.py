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

    setattr(self, toptenlist_ref, TopTenList.objects.get(pk=toptenlist_id))

    # the request should succeed
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.client.logout()


def create_reusable_item_1(self, toptenitem_id, **kwargs):
    """
    Use the api to create a new Reusable Item from the kwargs data.
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

def reference_reusable_item(self, reusableitem_id, toptenitem_id):
    """
    Set a top ten item to reference a reusable item
    """

    item_detail_url = reverse('topTenLists:TopTenItems-detail', kwargs={'pk': toptenitem_id})
    response = self.client.patch(item_detail_url, {'reusableItem_id': reusableitem_id}, format='json')

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

        #response = result['response']

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

        #newreusableitem = result['reusableitem']
        #response = result['response']
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

        reusableitem_url = reverse('topTenLists:ReusableItems-detail',  kwargs={'pk': self.reusableitem_1.id})
        response = self.client.get(reusableitem_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # user logged in and created the Reusable Item
        self.client.force_authenticate(user=self.user_1)

        reusableitem_url = reverse('topTenLists:ReusableItems-detail',  kwargs={'pk': self.reusableitem_1.id})
        response = self.client.get(reusableitem_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # user logged in and did not create the Reusable Item
        self.client.logout()
        self.client.force_authenticate(user=self.user_2)

        reusableitem_url = reverse('topTenLists:ReusableItems-detail',  kwargs={'pk': self.reusableitem_1.id})
        response = self.client.get(reusableitem_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_reusableitem_api_public(self):
        """
        This should succeeed because the reusable item is public
        """

        self.reusableitem_1.is_public = True
        self.reusableitem_1.save()

        self.client.logout()

        reusableitem_url = reverse('topTenLists:ReusableItems-detail',  kwargs={'pk': self.reusableitem_1.id})
        response = self.client.get(reusableitem_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_reusableitem_api_fails(self):
        """
        This should fail because Reusable Items cannot be created directly via the API
        They can only be created when updating a Top Ten Item
        """
        self.client.force_authenticate(user=self.user_1)

        reusableitem_url = reverse('topTenLists:ReusableItems-detail',  kwargs={'pk': self.reusableitem_1.id})
        response = self.client.delete(reusableitem_url)

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_modify_reusableitem_not_authenticated(self):
        """
        modify a Reusable Item should fail if user is not logged in
        """
        self.client.logout()
        
        reusableitem_url = reverse('topTenLists:ReusableItems-detail',  kwargs={'pk': self.reusableitem_1.id})
        response = self.client.patch(reusableitem_url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_modify_reusableitem_not_verified(self):
        """
        modify a Reusable Item should fail if user's email address is not verified
        """
        email_address = EmailAddress.objects.get(user_id=self.user_1.id)
        email_address.verified = False
        email_address.save()

        self.client.force_authenticate(user=self.user_1)

        reusableitem_url = reverse('topTenLists:ReusableItems-detail',  kwargs={'pk': self.reusableitem_1.id})
        response = self.client.patch(reusableitem_url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_reusableitem_unsupported_modification(self):
        """
        Only certain modifications are allowed
        The api cannot modify a forbidden property

        """

        self.client.force_authenticate(user=self.user_1)

        reusableitem_url = reverse('topTenLists:ReusableItems-detail',  kwargs={'pk': self.reusableitem_1.id})
        response = self.client.patch(reusableitem_url, {'change_request': 'Some text'}, format='json')

        updated_object = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_make_reusableitem_public_owner(self):
        """
        Only the owner can make a reusable item public

        """

        # ensure is_public is false to start with
        original_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)
        original_reusableitem.is_public = False
        original_reusableitem.save()

        self.client.force_authenticate(user=self.user_1)
        reusableitem_url = reverse('topTenLists:ReusableItems-detail',  kwargs={'pk': self.reusableitem_1.id})
        response = self.client.patch(reusableitem_url, {'is_public': True}, format='json')

        updated_object = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # the value should be updated
        self.assertEqual(updated_object.is_public, True)

    def test_make_reusableitem_public_not_owner(self):
        """
        Making a reusable item private creates a clone that is referenced by the user's own Top Ten Items
        """

        # ensure is_public is false to start with
        original_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)
        original_reusableitem.is_public = False
        original_reusableitem.save()

        self.client.force_authenticate(user=self.user_2)
        reusableitem_url = reverse('topTenLists:ReusableItems-detail',  kwargs={'pk': self.reusableitem_1.id})
        response = self.client.patch(reusableitem_url, {'is_public': True}, format='json')

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_make_reusableitem_private(self):
        """
        This should create a private clone of the original public reusable item
        And leave the original as is
        It should be the same for the owner and any other user who references the Reusable Item
        """

        # ensure is_public is true to start with
        original_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)
        original_reusableitem.is_public = True
        original_reusableitem.save()

        # make another user reference the Reusable Item, so it won't be deleted
        self.client.force_authenticate(user=self.user_2)

        toptenitems = self.toptenlist_2.topTenItem.all()
        toptenitem_1_id = toptenitems[0].id

        reference_reusable_item(self, self.reusableitem_1.id, toptenitem_1_id)

        self.client.force_authenticate(user=self.user_1)
        reusableitem_url = reverse('topTenLists:ReusableItems-detail',  kwargs={'pk': self.reusableitem_1.id})
        response = self.client.patch(reusableitem_url, {'is_public': False}, format='json')

        updated_object = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # the value should not be updated
        self.assertEqual(updated_object.is_public, True)

        # TODO check the new reusable item exists, is private and created by user 2, and referenced by their toptenitem

        # TODO three users should reference the ReusableItem so it is not deleted
        # TODO loop to create 10 users each with a Top Ten List


    """
    tests required:

    ensure reusable item is deleted if no longer referenced

    change is_public
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
    reusableItem history is updated
    do we keep a record of failed change requests?

    """