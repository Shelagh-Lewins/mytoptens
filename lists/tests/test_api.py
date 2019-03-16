"""
Test the API for lists and items
"""

import json

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import CustomUser
from lists.models import List, Item

class ListAPITest(APITestCase):
    @classmethod
    # def setUpTestData(cls):
        # Set up non-modified objects used by all test methods

    def setUp(self):
        self.data = {'name': 'Test list', 'description':'A description', 'item': [
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
        # 'lists' is the app_name set in endpoints.py
        # 'Lists' is the base_name set for the list route in endpoints.py
        # '-list' seems to be api magic unrelated to our list object name
        self.url = reverse('lists:Lists-list')

    def test_create_list_authenticated(self):
        """
        Ensure we can create a new list object.
        """

        user = CustomUser.objects.create(email='person@example.com', username='Test user', email_verified=True)

        self.client.force_authenticate(user=user)
        response = self.client.post(self.url, self.data, format='json')
        list_id = json.loads(response.content)['id']

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # there should now be 1 List in the database
        self.assertEqual(List.objects.count(), 1)

        new_list = List.objects.get(pk=list_id)

        # it should have the right name
        self.assertEqual(new_list.name, 'Test list')

        # it should have the right description
        self.assertEqual(new_list.description, 'A description')

        # it should belong to this user
        self.assertEqual(new_list.created_by, user)

        # and the username should also be correct
        self.assertEqual(new_list.created_by_username, 'Test user')

        # it should be a top level list (no parent_item)
        self.assertEqual(new_list.parent_item_id, None)

        # find the nested item data
        list_items_queryset = new_list.item.all()

        # the list should have 10 items
        self.assertEqual(list_items_queryset.count(), 10)

        # there should be 10 Items in the database
        self.assertEqual(Item.objects.all().count(), 10)

        # check order, name, description, list_id for each item
        for index, item in enumerate(list_items_queryset):
         self.assertEqual(item.order, index+1)
         self.assertEqual(item.name, 'Item ' + str(index+1) + ' Name')
         self.assertEqual(item.description, 'Item ' + str(index+1) + ' description')
         self.assertEqual(item.list_id, new_list.id)


    def test_create_list_not_verified(self):
        """
        create list should fail if user's email address is not verified
        """
        user = CustomUser.objects.create(email='person@example.com', username='Test user', email_verified=False)
        self.client.force_authenticate(user=user)
        response = self.client.post(self.url, self.data, format='json')

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_create_list_not_authenticated(self):
        """
        create list should fail if user not logged in
        """
        user = CustomUser.objects.create(email='person@example.com', username='Test user', email_verified=True)
        response = self.client.post(self.url, self.data, format='json')

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


    def test_delete_list_by_owner(self):
        """
        delete list should succeed if user created list
        """
        user = CustomUser.objects.create(email='person@example.com', username='Test user', email_verified=True)
        new_list = List.objects.create(name='Test list', description='A description', created_by=user, created_by_username=user.username)

        url = reverse('lists:Lists-detail', kwargs={'pk': new_list.id})
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


    def test_delete_list_by_not_owner(self):
        """
        delete list should fail if user didn't create list
        """
        user = CustomUser.objects.create(email='person@example.com', username='Test user', email_verified=False)
        new_list = List.objects.create(name='Test list', description='A description', created_by=user, created_by_username=user.username)

        url = reverse('lists:Lists-detail', kwargs={'pk': new_list.id})
        response = self.client.delete(url)

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

