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

def create_users(self):
    self.user_1 = CustomUser.objects.create_user('Test user 1', 'person_1@example.com', '12345')
    EmailAddress.objects.create(user=self.user_1, 
            email='person_1@example.com',
            primary=True,
            verified=True)

    self.user_2 = CustomUser.objects.create_user('Test user 2', 'person_2@example.com', '12345')
    EmailAddress.objects.create(user=self.user_2, 
            email='person_2@example.com',
            primary=True,
            verified=True)

def create_toptenlist_1(self):
    """
    # use the api to create a Top Ten List and its Top Ten Items
    # user_1 is automatically authenticted because this is part of setup and should not fail
    """
    self.client.force_authenticate(user=self.user_1)
    response = self.client.post(create_list_url, toptenlist_data_1, format='json')
    toptenlist_1_id = json.loads(response.content)['id']

    self.toptenlist_1 = TopTenList.objects.get(pk=toptenlist_1_id)

    # the request should succeed
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    # there should now be 1 TopTenList in the database
    self.assertEqual(TopTenList.objects.count(), 1)

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

class CreateReusableItemAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        create_users(cls)

    def setUp(self):
        create_toptenlist_1(self)

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

    def test_create_reusableitem_not_owner(self):
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
        create_users(cls)

    def setUp(self):
        # use the api to create a Top Ten List and its Top Ten Items
        create_toptenlist_1(self)

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

        self.client.force_authenticate(user=self.user_2)

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

    def test_modify_reusableitem_is_public_owner(self):
        """
        Only the owner can make a reusable item public
        Making a reusable item private actually creates a clone that is referenced by the user's own Top Ten Items

        """

        # ensure is_public is false to start with
        original_reusableitem = ReusableItem.objects.get(pk=self.reusableitem_1.id)
        original_reusableitem.is_public = False
        original_reusableitem.save()

        check_object = ReusableItem.objects.get(pk=self.reusableitem_1.id)
        self.assertEqual(check_object.is_public, False)

        self.client.force_authenticate(user=self.user_1)
        reusableitem_url = reverse('topTenLists:ReusableItems-detail',  kwargs={'pk': self.reusableitem_1.id})
        response = self.client.patch(reusableitem_url, {'is_public': True}, format='json')

        updated_object = ReusableItem.objects.get(pk=self.reusableitem_1.id)

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # the value should be updated
        self.assertEqual(updated_object.is_public, True)

    """
    tests required:

    ensure reusable item is deleted if no longer referenced

    must submit one valid modification

    propose modification:
    cannot directly edit a reusableItem
    can submit modification if none exists already, and user references the item, and new data
    automatically vote after successfully proposing modification
    cannot set name to empty string, but can set definition and link to empty string

    vote:
    can vote if modification exists and have not voted on it
    vote must be 'yes' or 'no'
    votes are processed and modification removed and reusable item updated if 'yes' passes
    reusableItem history is updated
    do we keep a record of failed modifications?

    """