"""
Test the API for topTenLists and topTenItems
"""

import json

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import CustomUser
from allauth.account.models import EmailAddress 
from toptenlists.models import TopTenList, TopTenItem


class CreateEditTopTenListAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up objects used by all test methods
        cls.user = CustomUser.objects.create_user('Test user', 'person@example.com', '12345')
        EmailAddress.objects.create(user=cls.user, 
            email='person@example.com',
            primary=True,
            verified=True)

    def setUp(self):
        self.create_data = {'name': 'Tasty food', 'description':'My favourite foods', 'topTenItem': [
        {'name': 'Spaghetti bolognese', 'description': 'Like mum makes', 'order': 1},
        {'name': 'Cheese', 'description': 'Not goat!', 'order': 2},
        {'name': 'Steak', 'description': 'Medium rare', 'order': 3},
        {'name': 'Cauliflower cheese', 'description': 'With green pepper sauce', 'order': 4},
        {'name': 'Chocolate', 'description': 'Dark and orange', 'order': 5},
        {'name': 'Butter', 'description': 'Goes with everything!', 'order': 6},
        {'name': 'Apple crumble', 'description': 'With custard, obviously', 'order': 7},
        {'name': 'Apples', 'description': 'Cox, Royal Gala and other traditional varieties', 'order': 8},
        {'name': 'Carrots', 'description': 'Raw or cooked', 'order': 9},
        {'name': 'Hummus', 'description': 'Another staple', 'order': 10}
        ]}

        self.edit_data = {'name': 'Food, glorious food!', 'description':'This is a list of things'}
        # 'topTenLists' is the app_name set in endpoints.py
        # 'TopTenLists' is the base_name set for the topTenList route in endpoints.py
        # '-list' is a standard api command to list a model. It is unrelated to our topTenList object name
        self.create_url = reverse('topTenLists:TopTenLists-list')

        # TEST CREATING A LIST
    def test_create_topTenList_authenticated(self):
        """
        Logged in, verified user can create a new topTenList object.
        """

        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.create_url, self.create_data, format='json')
        topTenList_id = json.loads(response.content)['id']

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # there should now be 1 TopTenList in the database
        self.assertEqual(TopTenList.objects.count(), 1)

        new_topTenList = TopTenList.objects.get(pk=topTenList_id)

        # it should have the right name
        self.assertEqual(new_topTenList.name, self.create_data.get('name', None))

        # it should have the right description
        self.assertEqual(new_topTenList.description, self.create_data.get('description', None))

        # it should belong to this user
        self.assertEqual(new_topTenList.created_by, self.user)

        # and the username should also be correct
        self.assertEqual(new_topTenList.created_by_username, self.user.username)

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
            item_data = self.create_data.get('topTenItem', None)[index]
            self.assertEqual(topTenItem.name, item_data.get('name', None))
            self.assertEqual(topTenItem.description, item_data.get('description', None))
            self.assertEqual(topTenItem.topTenList_id, new_topTenList.id)


    def test_create_topTenList_not_verified(self):
        """
        create topTenList should fail if user's email address is not verified
        """

        email_address = EmailAddress.objects.get(user_id=self.user.id)
        email_address.verified = False
        email_address.save()

        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.create_url, self.create_data, format='json')

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_create_topTenList_not_authenticated(self):
        """
        create topTenList should fail if user not logged in
        """

        response = self.client.post(self.create_url, self.create_data, format='json')

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # TEST EDITING A LIST
    def test_edit_topTenList_by_owner(self):
        """
        edit topTenList should succeed if user created topTenList
        """

        # create a new toptenlist
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.create_url, self.create_data, format='json')
        topTenList_id = json.loads(response.content)['id']

        # creating the list should succeed
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        new_topTenList = TopTenList.objects.get(pk=topTenList_id)

        # now edit the list
        detail_url = reverse('topTenLists:TopTenLists-detail', kwargs={'pk': topTenList_id})

        response2 = self.client.patch(detail_url, self.edit_data, format='json')

        # the request should succeed
        self.assertEqual(response2.status_code, status.HTTP_200_OK)

        edited_topTenList = TopTenList.objects.get(pk=topTenList_id)

        # it should have the right name
        self.assertEqual(edited_topTenList.name, self.edit_data.get('name', None))

        # it should have the right description
        self.assertEqual(edited_topTenList.description, self.edit_data.get('description', None))

        # move an item up
        # find the nested topTenItem data
        topTenItems = new_topTenList.topTenItem.all()

        # the topTenList should have 10 topTenItems
        self.assertEqual(topTenItems.count(), 10)

        # check order, name, description, topTenList_id for each topTenItem
        for index, topTenItem in enumerate(topTenItems):
            print('item')
            print(topTenItem.order, index+1)
            print(topTenItem.name)
            print(topTenItem.description)
            print(topTenItem.topTenList_id)

        item_2_id = topTenItems[1].id
        move_up_url = reverse('topTenLists:TopTenItems-moveup', kwargs={'pk': item_2_id})
        print('move_up_url')
        print(move_up_url)

        response3 = self.client.patch(move_up_url)
        print('response')
        print(response3)
        print(json.loads(response3.content))

        edited_topTenList2 = TopTenList.objects.get(pk=topTenList_id)

        topTenItems_swapped = new_topTenList.topTenItem.all()

        # the topTenList should have 10 topTenItems
        self.assertEqual(topTenItems_swapped.count(), 10)

        # check order, name, description, topTenList_id for each topTenItem
        for index, topTenItem in enumerate(topTenItems_swapped):
            print('item')
            print(topTenItem.order, index+1)
            print(topTenItem.name)
            print(topTenItem.description)
            print(topTenItem.topTenList_id)

        # the request should succeed
        self.assertEqual(response3.status_code, status.HTTP_200_OK)

        # the first and second items should have swapped order
        # TODO



    def test_edit_topTenList_not_authenticated(self):
        """
        edit topTenList should fail if user not logged in
        """

        # create a new toptenlist
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.create_url, self.create_data, format='json')
        topTenList_id = json.loads(response.content)['id']

        # creating the list should succeed
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.client.logout()

        # now edit the list
        detail_url = reverse('topTenLists:TopTenLists-detail', kwargs={'pk': topTenList_id})

        response2 = self.client.patch(detail_url, self.edit_data, format='json')

        # the request should fail
        self.assertEqual(response2.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_edit_topTenList_by_not_owner(self):
        """
        edit topTenList should fail if user didn't create topTenList
        """

        # create a new toptenlist
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.create_url, self.create_data, format='json')
        topTenList_id = json.loads(response.content)['id']

        # creating the list should succeed
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.client.logout()

        otherUser = CustomUser.objects.create_user('Other test user', 'otherperson@example.com', '12345')
        EmailAddress.objects.create(user=otherUser, 
            email='otherperson@example.com',
            primary=True,
            verified=False)

        self.client.force_authenticate(user=otherUser)

        # now edit the list
        detail_url = reverse('topTenLists:TopTenLists-detail', kwargs={'pk': topTenList_id})

        response2 = self.client.patch(detail_url, self.edit_data, format='json')

        # the request should fail
        self.assertEqual(response2.status_code, status.HTTP_403_FORBIDDEN)


class DeleteTopTenListAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up non-modified objects used by all test methods
        cls.user = CustomUser.objects.create_user('Test user', 'person@example.com', '12345')
        EmailAddress.objects.create(user=cls.user, 
            email='person@example.com',
            primary=True,
            verified=True)

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
        otherUser = CustomUser.objects.create_user('Other test user', 'otherperson@example.com', '12345')
        EmailAddress.objects.create(user=otherUser, 
            email='otherperson@example.com',
            primary=True,
            verified=False)

        self.client.force_authenticate(user=otherUser)

        response = self.client.delete(self.url)

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

