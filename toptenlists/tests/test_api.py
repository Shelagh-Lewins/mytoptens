"""
Test the API for topTenLists and topTenItems
"""

import json

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import CustomUser
from topTenLists.models import TopTenList, TopTenItem

class CreateTopTenListAPITest(APITestCase):
    @classmethod
    # def setUpTestData(cls):
        # Set up non-modified objects used by all test methods

    def setUp(self):
        self.data = {'name': 'Test topTenList', 'description':'A description', 'topTenItem': [
        {'name': 'Item 1 Name', 'description': 'Item 1 description', 'order': 1},
        {'name': 'Item 2 Name', 'description': 'Item 2 description', 'order': 2},
        {'name': 'Item 3 Name', 'description': 'Item 3 description', 'order': 3},
        {'name': 'Item 4 Name', 'description': 'Item 4 description', 'order': 4},
        {'name': 'Item 5 Name', 'description': 'Item 5 description', 'order': 5},
        {'name': 'Item 6 Name', 'description': 'Item 6 description', 'order': 6},
        {'name': 'Item 7 Name', 'description': 'Item 7 description', 'order': 7},
        {'name': 'Item 8 Name', 'description': 'Item 8 description', 'order': 8},
        {'name': 'Item 9 Name', 'description': 'Item 9 description', 'order': 9},
        {'name': 'Item 10 Name', 'description': 'Item 10 description', 'order': 10}
        ]}
        # 'topTenLists' is the app_name set in endpoints.py
        # 'TopTenLists' is the base_name set for the topTenList route in endpoints.py
        # '-list' seems to be api magic unrelated to our topTenList object name
        self.url = reverse('topTenLists:TopTenLists-list')

    def test_create_topTenList_authenticated(self):
        """
        Logged in, verified user can create a new topTenList object.
        """

        user = CustomUser.objects.create(email='person@example.com', username='Test user', email_verified=True)

        self.client.force_authenticate(user=user)
        response = self.client.post(self.url, self.data, format='json')
        topTenList_id = json.loads(response.content)['id']

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # there should now be 1 TopTenList in the database
        self.assertEqual(TopTenList.objects.count(), 1)

        new_topTenList = TopTenList.objects.get(pk=topTenList_id)

        # it should have the right name
        self.assertEqual(new_topTenList.name, 'Test topTenList')

        # it should have the right description
        self.assertEqual(new_topTenList.description, 'A description')

        # it should belong to this user
        self.assertEqual(new_topTenList.created_by, user)

        # and the username should also be correct
        self.assertEqual(new_topTenList.created_by_username, 'Test user')

        # it should be a top level topTenList (no parent_topTenItem)
        self.assertEqual(new_topTenList.parent_topTenItem_id, None)

        # find the nested topTenItem data
        topTenList_topTenItems_queryset = new_topTenList.topTenItem.all()

        # the topTenList should have 10 topTenItems
        self.assertEqual(topTenList_topTenItems_queryset.count(), 10)

        # there should be 10 TopTenItemss in the database
        self.assertEqual(TopTenItem.objects.all().count(), 10)

        # check order, name, description, topTenList_id for each topTenItem
        for index, topTenItem in enumerate(topTenList_topTenItems_queryset):
            self.assertEqual(topTenItem.order, index+1)
            self.assertEqual(topTenItem.name, 'Item ' + str(index+1) + ' Name')
            self.assertEqual(topTenItem.description, 'Item ' + str(index+1) + ' description')
            self.assertEqual(topTenItem.topTenList_id, new_topTenList.id)


    def test_create_topTenList_not_verified(self):
        """
        create topTenList should fail if user's email address is not verified
        """
        user = CustomUser.objects.create(email='person@example.com', username='Test user', email_verified=False)
        self.client.force_authenticate(user=user)
        response = self.client.post(self.url, self.data, format='json')

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_create_topTenList_not_authenticated(self):
        """
        create topTenList should fail if user not logged in
        """
        user = CustomUser.objects.create(email='person@example.com', username='Test user', email_verified=True)
        response = self.client.post(self.url, self.data, format='json')

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class DeleteTopTenListAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up non-modified objects used by all test methods
        cls.user = CustomUser.objects.create(email='person@example.com', username='Test user', email_verified=True)

    def setUp(self):
        self.topTenList = TopTenList.objects.create(name='Test topTenList', description='A description', created_by=self.user, created_by_username=self.user.username)
        self.url = reverse('topTenLists:TopTenLists-detail', kwargs={'pk': self.topTenList.id})

    def test_delete_topTenList_by_owner(self):
        """
        delete topTenList should succeed if user created topTenList
        """
        self.client.force_authenticate(user=self.user)

        response = self.client.delete(self.url)

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


    def test_delete_topTenList_not_logged_in(self):
        """
        delete topTenList should fail if user isn't logged in
        """
        response = self.client.delete(self.url)

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


    def test_delete_topTenList_by_not_owner(self):
        """
        delete topTenList should fail if user didn't create topTenList
        """
        otherUser = CustomUser.objects.create(email='person@example.com', username='Other test user', email_verified=False)

        self.client.force_authenticate(user=otherUser)

        response = self.client.delete(self.url)

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

