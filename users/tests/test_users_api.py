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

user_detail_url = reverse('rest_user_details') # found in rest-auth source code (tests/mixins.py)

class UserDetailAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up objects used by all test methods
        cls.user = CustomUser.objects.create_user('Test user', 'person@example.com', '12345')
        EmailAddress.objects.create(user=cls.user, 
            email='person@example.com',
            primary=True,
            verified=True)


class UserDetailAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up objects used by all test methods
        cls.user = CustomUser.objects.create_user('Test user', 'person@example.com', '12345')
        EmailAddress.objects.create(user=cls.user, 
            email='person@example.com',
            primary=True,
            verified=True)

    def test_user_detail_not_logged_in(self):
        """
        Cannot see user details if not logged in
        This is covered by Django Rest Auth test, so this is just here as an example
        """

        response = self.client.get(user_detail_url,  format='json')

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_detail_logged_in(self):
        """
        Logged in, verified user can see their own details
        """

        self.client.force_authenticate(user=self.user)

        response = self.client.get(user_detail_url,  format='json')

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(response.data['email'], self.user.email)