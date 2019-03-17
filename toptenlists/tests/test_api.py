"""
Test the API for toptenlists and items
"""

import json

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import CustomUser
from toptenlists.models import TopTenList, Item

class CreateTopTenListAPITest(APITestCase):
    @classmethod
    # def setUpTestData(cls):
        # Set up non-modified objects used by all test methods

    def setUp(self):
        self.data = {'name': 'Test toptenlist', 'description':'A description', 'item': [
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
        # 'toptenlists' is the app_name set in endpoints.py
        # 'TopTenLists' is the base_name set for the toptenlist route in endpoints.py
        # '-list' seems to be api magic unrelated to our toptenlist object name
        self.url = reverse('toptenlists:TopTenLists-list')

    def test_create_toptenlist_authenticated(self):
        """
        Logged in, verified user can create a new toptenlist object.
        """

        user = CustomUser.objects.create(email='person@example.com', username='Test user', email_verified=True)

        self.client.force_authenticate(user=user)
        response = self.client.post(self.url, self.data, format='json')
        toptenlist_id = json.loads(response.content)['id']

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # there should now be 1 TopTenList in the database
        self.assertEqual(TopTenList.objects.count(), 1)

        new_toptenlist = TopTenList.objects.get(pk=toptenlist_id)

        # it should have the right name
        self.assertEqual(new_toptenlist.name, 'Test toptenlist')

        # it should have the right description
        self.assertEqual(new_toptenlist.description, 'A description')

        # it should belong to this user
        self.assertEqual(new_toptenlist.created_by, user)

        # and the username should also be correct
        self.assertEqual(new_toptenlist.created_by_username, 'Test user')

        # it should be a top level toptenlist (no parent_item)
        self.assertEqual(new_toptenlist.parent_item_id, None)

        # find the nested item data
        toptenlist_items_queryset = new_toptenlist.item.all()

        # the toptenlist should have 10 items
        self.assertEqual(toptenlist_items_queryset.count(), 10)

        # there should be 10 Items in the database
        self.assertEqual(Item.objects.all().count(), 10)

        # check order, name, description, toptenlist_id for each item
        for index, item in enumerate(toptenlist_items_queryset):
            self.assertEqual(item.order, index+1)
            self.assertEqual(item.name, 'Item ' + str(index+1) + ' Name')
            self.assertEqual(item.description, 'Item ' + str(index+1) + ' description')
            self.assertEqual(item.toptenlist_id, new_toptenlist.id)


    def test_create_toptenlist_not_verified(self):
        """
        create toptenlist should fail if user's email address is not verified
        """
        user = CustomUser.objects.create(email='person@example.com', username='Test user', email_verified=False)
        self.client.force_authenticate(user=user)
        response = self.client.post(self.url, self.data, format='json')

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_create_toptenlist_not_authenticated(self):
        """
        create toptenlist should fail if user not logged in
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
        self.toptenlist = TopTenList.objects.create(name='Test toptenlist', description='A description', created_by=self.user, created_by_username=self.user.username)
        self.url = reverse('toptenlists:TopTenLists-detail', kwargs={'pk': self.toptenlist.id})

    def test_delete_toptenlist_by_owner(self):
        """
        delete toptenlist should succeed if user created toptenlist
        """
        self.client.force_authenticate(user=self.user)

        response = self.client.delete(self.url)

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


    def test_delete_toptenlist_not_logged_in(self):
        """
        delete toptenlist should fail if user isn't logged in
        """
        response = self.client.delete(self.url)

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


    def test_delete_toptenlist_by_not_owner(self):
        """
        delete toptenlist should fail if user didn't create toptenlist
        """
        otherUser = CustomUser.objects.create(email='person@example.com', username='Other test user', email_verified=False)

        self.client.force_authenticate(user=otherUser)

        response = self.client.delete(self.url)

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

