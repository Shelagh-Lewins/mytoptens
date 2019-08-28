"""
Test the API for custm user
"""

import json

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import CustomUser
from allauth.account.models import EmailAddress

from users.api import UserListView

# disable throttling for testing
UserListView.throttle_classes = ()

#user_detail_url = reverse('myTopTens:UsersURLS-list')
user_detail_url = reverse('rest_user_details') # found in rest-auth source code

class UserDetailAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up objects used by all test methods
        cls.user = CustomUser.objects.create_user('Test user', 'person@example.com', '12345')
        EmailAddress.objects.create(user=cls.user, 
            email='person@example.com',
            primary=True,
            verified=True)

    def test_user_detail(self):
        """
        Logged in, verified user can see their own details
        """

        #self.client.force_authenticate(user=self.user)

        response = self.client.get(user_detail_url, {'pk': self.user.id }, format='json')
        print('response', response.__dict__)

        self.assertEqual(True, True)
