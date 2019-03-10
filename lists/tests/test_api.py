from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import CustomUser
from lists.models import List
from lists.endpoints import ListViewSet

from rest_framework.test import force_authenticate
from rest_framework.authtoken.models import Token
from rest_framework.test import APIRequestFactory

class ListTest(APITestCase):
    @classmethod
    # def setUpTestData(cls):
        # Set up non-modified objects used by all test methods
        # CustomUser.objects.create(email='person@example.com', username='Test user', email_verified=True)

    def setUp(self):
        self.user = CustomUser.objects.create(email='person@example.com', username='Test user', email_verified=True)

    def test_create_list(self):
        """
        Ensure we can create a new list object.
        """

        # 'lists' is the app_name set in endpoints.py
        # 'Lists' is the base_name set for the list route in endpoints.py
        # '-list' seems to be api magic unrelated to our list object name
        url = reverse('lists:Lists-list')
        #items_data = []
        #item = {}
        #item.name = ''
        #item.description = ''
        #item.order = 1
        #items_data.push(item)
        data = {'name': 'Test list', 'description':'A description', 'item': [
        {'name': '', 'description': '', 'order': 1},
        {'name': '', 'description': '', 'order': 2},
        {'name': '', 'description': '', 'order': 3},
        {'name': '', 'description': '', 'order': 4},
        {'name': '', 'description': '', 'order': 5},
        {'name': '', 'description': '', 'order': 6},
        {'name': '', 'description': '', 'order': 7},
        {'name': '', 'description': '', 'order': 8},
        {'name': '', 'description': '', 'order': 9},
        {'name': '', 'description': '', 'order': 10}
        ]}
        self.client.force_authenticate(user=self.user)
        response = self.client.post(url, data, format='json')

        #print('response')
        #print(response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(List.objects.count(), 1)
        self.assertEqual(List.objects.get().name, 'Test list')
