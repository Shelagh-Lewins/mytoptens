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

# 'topTenLists' is the app_name set in endpoints.py
# 'TopTenLists' is the base_name set for the topTenList route in endpoints.py
# '-list' is a standard api command to list a model. It is unrelated to our topTenList object name
create_list_url = reverse('topTenLists:TopTenLists-list')

def create_reusable_item(api_test_case, toptenitem_id, **kwargs):
    """
    Use the api to create a new Reusable Item from the kwargs data.
    This Reusable Item will be referenced by the specified Top Ten Item.
    """
    item_detail_url = reverse('topTenLists:TopTenItems-detail', kwargs={'pk': toptenitem_id})

    response = api_test_case.client.patch(item_detail_url, kwargs, format='json')

    try:
        newreusableitem_id = json.loads(response.content)['reusableItem']['id']
        newreusableitem = ReusableItem.objects.get(pk=newreusableitem_id)
        return {'response': response, 'reusableitem': newreusableitem}

    except:
        return {'response': response}

class CreateReusableItemAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up non-modified objects used by all test methods
        cls.user = CustomUser.objects.create_user('Test user', 'person@example.com', '12345')
        EmailAddress.objects.create(user=cls.user, 
            email='person@example.com',
            primary=True,
            verified=True)

    def setUp(self):
        # use the api to create a Top Ten List and its Top Ten Items
        self.client.force_authenticate(user=self.user)
        response = self.client.post(create_list_url, toptenlist_data_1, format='json')
        toptenlist_1_id = json.loads(response.content)['id']

        self.toptenlist_1 = TopTenList.objects.get(pk=toptenlist_1_id)

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # there should now be 1 TopTenList in the database
        self.assertEqual(TopTenList.objects.count(), 1)

        self.client.logout()

    def test_create_reusableitem_api_fails(self):
        """
        This should fail because Reusable Items cannot be created directly via the API
        They can only be created when updating a Top Ten Item
        """
        self.client.force_authenticate(user=self.user)

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

        result = create_reusable_item(self, toptenitem_1_id, **reusableitem_1_data)

        response = result['response']

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_reusableitem_not_verified(self):
        """
        create a Reusable Item should fail if user's email address is not verified
        """

        email_address = EmailAddress.objects.get(user_id=self.user.id)
        email_address.verified = False
        email_address.save()

        self.client.force_authenticate(user=self.user)

        toptenitems = self.toptenlist_1.topTenItem.all()
        toptenitem_1_id = toptenitems[0].id

        result = create_reusable_item(self, toptenitem_1_id, **reusableitem_1_data)

        response = result['response']

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_reusableitem_not_owner(self):
        """
        create a Reusable Item should fail if the user didn't create the Top Ten List
        """

        self.client.logout()

        otherUser = CustomUser.objects.create_user('Other test user', 'otherperson@example.com', '12345')
        EmailAddress.objects.create(user=otherUser, 
            email='otherperson@example.com',
            primary=True,
            verified=False)

        self.client.force_authenticate(user=otherUser)

        toptenitems = self.toptenlist_1.topTenItem.all()
        toptenitem_1_id = toptenitems[0].id

        result = create_reusable_item(self, toptenitem_1_id, **reusableitem_1_data)

        response = result['response']

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_create_reusableitem_authenticated(self):
        """
        create a Reusable Item and assign it to a Top Ten Item
        """

        self.client.force_authenticate(user=self.user)

        toptenitems = self.toptenlist_1.topTenItem.all()
        toptenitem_1_id = toptenitems[0].id

        result = create_reusable_item(self, toptenitem_1_id, **reusableitem_1_data)

        newreusableitem = result['reusableitem']
        response = result['response']

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(ReusableItem.objects.count(), 1)

        # the new Reusable Item has the correct properties
        self.assertEqual(newreusableitem.name, reusableitem_1_data['name'])
        self.assertEqual(newreusableitem.definition, reusableitem_1_data['reusableItemDefinition'])
        self.assertEqual(newreusableitem.link, reusableitem_1_data['reusableItemLink'])

    def test_delete_reusableitem_api_fails(self):
        """
        This should fail because Reusable Items cannot be created directly via the API
        They can only be created when updating a Top Ten Item
        """
        self.client.force_authenticate(user=self.user)

        # create a Reusable Item
        toptenitems = self.toptenlist_1.topTenItem.all()
        toptenitem_1_id = toptenitems[0].id

        result = create_reusable_item(self, toptenitem_1_id, **reusableitem_1_data)

        newreusableitem = result['reusableitem']
        response = result['response']

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(ReusableItem.objects.count(), 1)

        delete_reusableitem_url = reverse('topTenLists:ReusableItems-detail',  kwargs={'pk': newreusableitem.id})
        response = self.client.delete(delete_reusableitem_url)

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)


    #def test_modify_reusableitem(self):
        """
        a modification can be proposed if none exists already
        """

        #self.client.force_authenticate(user=self.user)

        #edit_data = { 'name': 'A new name' }

        #reusableitem_detail_url = reverse('topTenLists:ReusableItems-detail', kwargs={'pk': self.reusableItem.id})

        #response = self.client.patch(reusableitem_detail_url, edit_data, format='json')

        # the request should succeed
        #self.assertEqual(response.status_code, status.HTTP_200_OK)

    """
    tests required:

    basics:
    permissions -
    user must be logged in
    user's email address must be verified
    reusable item is public or owned by user

    ensure delete via api fails

    ensure reusable item is deleted if no longer referenced

    must submit one valid modification

    is_public:
    can only see public reusableItems and those they created
    can make a reusableItem public if they created it
    can make a reusableItem private if they created it and nobody else referencing it

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