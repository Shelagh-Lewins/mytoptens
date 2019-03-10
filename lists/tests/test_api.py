import json

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import CustomUser
from lists.models import List
from lists.endpoints import ListViewSet

from rest_framework.test import force_authenticate
# from rest_framework.authtoken.models import Token
# from rest_framework.test import APIRequestFactory

class ListAPITest(APITestCase):
    @classmethod
    # def setUpTestData(cls):
        # Set up non-modified objects used by all test methods
        # CustomUser.objects.create(email='person@example.com', username='Test user', email_verified=True)

    def setUp(self):
        self.user = CustomUser.objects.create(email='person@example.com', username='Test user', email_verified=True)

        self.data = {'name': 'Test list', 'description':'A description', 'item': [
        {'name': 'Item 1 Name', 'description': 'Item 1 description', 'order': 1},
        {'name': 'Item 2 Name', 'description': 'Item 2 description', 'order': 2},
        {'name': 'Item 3 Name', 'description': 'Item 3 description', 'order': 3},
        {'name': 'Item 4 Name', 'description': 'Item 4 description', 'order': 4},
        {'name': 'Item 5 Name', 'description': 'Item 5 description', 'order': 5},
        {'name': 'Item 6 Name', 'description': 'Item 6 description', 'order': 6},
        {'name': 'Item 7 Name', 'description': 'Item 7 description', 'order': 7},
        {'name': 'Item 8 Name', 'description': 'Item 8 description', 'order': 8},
        {'name': 'Item 9 Name', 'description': 'Item 0 description', 'order': 9},
        {'name': 'Item 10 Name', 'description': 'Item 10 description', 'order': 10}
        ]}
        self.url = reverse('lists:Lists-list')

    def test_create_list_authenticated(self):
        """
        Ensure we can create a new list object.
        """

        # 'lists' is the app_name set in endpoints.py
        # 'Lists' is the base_name set for the list route in endpoints.py
        # '-list' seems to be api magic unrelated to our list object name
        url = reverse('lists:Lists-list')

        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, self.data, format='json')
        #new_list = json.loads(response.content)
        #print(new_list)
        #print('id')
        #print(new_list['id'])
        list_id = json.loads(response.content)['id']

        
        #print('list from db')
        #print(new_list)


        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # there should now be 1 List in the database
        self.assertEqual(List.objects.count(), 1)

        new_list = List.objects.get(pk=list_id)

        # it should have the right name
        self.assertEqual(new_list.name, 'Test list')

        # the list should have 10 items

        # there should be 10 Items in the database

        # those 10 items should belong to this list

        # TODO check name and description of items
        # TODO check there are exactly 10 items
        # check list is created_by this user


  # create list should fail if user not email verified

  # create list should fail if user not logged in