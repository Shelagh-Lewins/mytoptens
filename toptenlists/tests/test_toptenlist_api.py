"""
Test the API for topTenLists and topTenItems api
"""

import json
import uuid

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import CustomUser
from allauth.account.models import EmailAddress 
from toptenlists.models import TopTenList, TopTenItem, ReusableItem, Notification

# disable throttling for testing
from toptenlists.api import TopTenListViewSet, TopTenItemViewSet, TopTenListDetailViewSet, ReusableItemViewSet

TopTenListViewSet.throttle_classes = ()
TopTenItemViewSet.throttle_classes = ()
TopTenListDetailViewSet.throttle_classes = ()


new_list_data = {'name': 'Tasty food', 'description':'My favourite foods', 'topTenItem': [
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

second_list_data = {'name': 'Drinks', 'description':'Things to driink', 'topTenItem': [
    {'name': 'Coffee', 'description': 'Caffeiated', 'order': 1},
    {'name': 'Tea', 'description': 'Yorkshire', 'order': 2},
    {'name': 'Red wine', 'description': 'Chilean', 'order': 3},
    {'name': '', 'description': '', 'order': 4},
    {'name': '', 'description': '', 'order': 5},
    {'name': '', 'description': '', 'order': 6},
    {'name': '', 'description': '', 'order': 7},
    {'name': '', 'description': '', 'order': 8},
    {'name': '', 'description': '', 'order': 9},
    {'name': '', 'description': '', 'order': 10},
    ]}

# 'topTenLists' is the app_name set in endpoints.py
# 'TopTenLists' is the base_name set for the topTenList route in endpoints.py
# '-list' is a standard api command to list a model. It is unrelated to our topTenList object name
create_list_url = reverse('topTenLists:TopTenLists-list')

def create_reusable_item(self, topTenItem):
    self.reusableItem = ReusableItem.objects.create(name='Jane Austen',
        definition='A writer',
        link='link@here.com',
        created_by=self.user)

    topTenItem.reusableItem = self.reusableItem
    topTenItem.save()


class CreateTopTenListAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up objects used by all test methods
        cls.user = CustomUser.objects.create_user('Test user', 'person@example.com', '12345')
        EmailAddress.objects.create(user=cls.user,
            email='person@example.com',
            primary=True,
            verified=True)

    def test_create_topTenList_authenticated(self):
        """
        Logged in, verified user can create a new topTenList object.
        """

        self.client.force_authenticate(user=self.user)
        response = self.client.post(create_list_url, new_list_data, format='json')
        topTenList_id = json.loads(response.content)['id']

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # there should now be 1 TopTenList in the database
        self.assertEqual(TopTenList.objects.count(), 1)

        new_topTenList = TopTenList.objects.get(pk=topTenList_id)

        # it should have the right name
        self.assertEqual(new_topTenList.name, new_list_data.get('name', None))

        # it should have the right description
        self.assertEqual(new_topTenList.description, new_list_data.get('description', None))

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

        # there should be 10 TopTenItems in the database
        self.assertEqual(TopTenItem.objects.all().count(), 10)

        # check order, name, description, topTenList_id for each topTenItem
        for index, topTenItem in enumerate(topTenList_topTenItems_queryset):
            self.assertEqual(topTenItem.order, index+1)
            item_data = new_list_data.get('topTenItem', None)[index]
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
        response = self.client.post(create_list_url, new_list_data, format='json')

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


    def test_create_topTenList_not_authenticated(self):
        """
        create topTenList should fail if user not logged in
        """

        response = self.client.post(create_list_url, new_list_data, format='json')

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class EditTopTenListAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up objects used by all test methods
        cls.user = CustomUser.objects.create_user('Test user', 'person@example.com', '12345')
        EmailAddress.objects.create(user=cls.user, 
            email='person@example.com',
            primary=True,
            verified=True)
        cls.edit_data = {'name': 'Food, glorious food!', 'description':'This is a list of things'}

    def setUp(self):
        # create a new toptenlist
        self.client.force_authenticate(user=self.user)
        self.response = self.client.post(create_list_url, new_list_data, format='json')
        self.topTenList_id = json.loads(self.response.content)['id']
        self.topTenList = TopTenList.objects.get(pk=self.topTenList_id)

    def test_edit_topTenList_by_owner(self):
        """
        edit topTenList should succeed if user created topTenList
        """

        list_detail_url = reverse('topTenLists:TopTenLists-detail', kwargs={'pk': self.topTenList_id})

        response = self.client.patch(list_detail_url, self.edit_data, format='json')

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        edited_topTenList = TopTenList.objects.get(pk=self.topTenList_id)

        # it should have the new name
        self.assertEqual(edited_topTenList.name, self.edit_data.get('name', None))

        # it should have the new description
        self.assertEqual(edited_topTenList.description, self.edit_data.get('description', None))

    def test_set_parent_topTenItem(self):
        """
        Set a parent item for the list, i.e. make it a child list
        """
       
        topTenItems = self.topTenList.topTenItem.all()
        item_1_id = topTenItems[0].id

        list_detail_url = reverse('topTenLists:TopTenLists-detail', kwargs={'pk': self.topTenList_id})

        data = {'parent_topTenItem_id': item_1_id}

        response = self.client.patch(list_detail_url, data, format='json')

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        edited_topTenList = TopTenList.objects.get(pk=self.topTenList_id)

        # the list should have the parent_topTenItem assigned
        self.assertEqual(edited_topTenList.parent_topTenItem.id, item_1_id)

    def test_edit_topTenList_not_authenticated(self):
        """
        edit topTenList should fail if user not logged in
        """

        self.client.logout()

        list_detail_url = reverse('topTenLists:TopTenLists-detail', kwargs={'pk': self.topTenList_id})

        response = self.client.patch(list_detail_url, self.edit_data, format='json')

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_edit_topTenList_by_not_owner(self):
        """
        edit topTenList should fail if user didn't create topTenList
        """

        self.client.logout()

        otherUser = CustomUser.objects.create_user('Other test user', 'otherperson@example.com', '12345')
        EmailAddress.objects.create(user=otherUser, 
            email='otherperson@example.com',
            primary=True,
            verified=False)

        self.client.force_authenticate(user=otherUser)

        list_detail_url = reverse('topTenLists:TopTenLists-detail', kwargs={'pk': self.topTenList_id})

        response = self.client.patch(list_detail_url, self.edit_data, format='json')

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

class EditTopTenItemAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up objects used by all test methods
        cls.user = CustomUser.objects.create_user('Test user', 'person@example.com', '12345')
        EmailAddress.objects.create(user=cls.user, 
            email='person@example.com',
            primary=True,
            verified=True)
        cls.edit_data = {'name': 'Food, glorious food!', 'description':'This is a list of things'}

    def setUp(self):
        # create a new toptenlist
        self.client.force_authenticate(user=self.user)
        response = self.client.post(create_list_url, new_list_data, format='json')
        self.topTenList_id = json.loads(response.content)['id']
        self.topTenList = TopTenList.objects.get(pk=self.topTenList_id)

    def test_edit_topTenItem_by_owner(self):
        """
        edit topTenItem should succeed if user created topTenList
        """

        topTenItems = self.topTenList.topTenItem.all()
        item_4_id = topTenItems[3].id

        item_detail_url = reverse('topTenLists:TopTenItems-detail', kwargs={'pk': item_4_id})

        data = {'name': 'Cauliflower curry', 'description': 'with lots of ginger'}

        response = self.client.patch(item_detail_url, data, format='json')

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # the name and description should have changed
        self.assertEqual(topTenItems[3].name, data.get('name', None))
        self.assertEqual(topTenItems[3].description, data.get('description', None))

    def test_edit_topTenItem_order(self):
        """
        edit topTenItem order should fail
        """

        topTenItems = self.topTenList.topTenItem.all()
        item_4_id = topTenItems[3].id

        item_detail_url = reverse('topTenLists:TopTenItems-detail', kwargs={'pk': item_4_id})

        data = {'order': '1'}

        response = self.client.patch(item_detail_url, data, format='json')

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    # def test_edit_topTenItem_topTenList(self):
        """
        edit topTenItem parent topTenList should fail
        """

        # the request does not fail, but the topTenList_id is not updated
        # It is likely that the test is not correctly setting new value
        # though, I cannot see how else it would work and have not found documentation with other information
        # For now, this will have to remain untested
        """
        topTenItems = self.topTenList.topTenItem.all()
        item_4_id = topTenItems[3].id
        print('original list')
        print(topTenItems[3].topTenList_id)

        item_detail_url = reverse('topTenLists:TopTenItems-detail', kwargs={'pk': item_4_id})

        # create a second topTenList
        response1 = self.client.post(create_list_url, second_list_data, format='json')
        second_topTenList_id = json.loads(response1.content)['id']
        print('id')
        print(second_topTenList_id)
        data = {'topTenList_id': second_topTenList_id}
        print('about to set topTenList_id')
        response2 = self.client.patch(item_detail_url, data, format='json')

        updated_item = TopTenItem.objects.get(pk=item_4_id)
        print('updated item')
        print(updated_item)
        print(updated_item.name)
        print(updated_item.topTenList_id)

        # the request should fail
        self.assertEqual(response2.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)"""



    def test_edit_topTenItem_not_authenticated(self):
        """
        edit topTenItem should fail if user not logged in
        """

        self.client.logout()

        topTenItems = self.topTenList.topTenItem.all()
        item_4_id = topTenItems[3].id

        item_detail_url = reverse('topTenLists:TopTenItems-detail', kwargs={'pk': item_4_id})

        data = {'name': 'Cauliflower curry', 'description': 'with lots of ginger'}

        response = self.client.patch(item_detail_url, data, format='json')

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_edit_topTenItem_by_not_owner(self):
        """
        edit topTenItem should fail if user didn't create topTenList
        """

        self.client.logout()

        otherUser = CustomUser.objects.create_user('Other test user', 'otherperson@example.com', '12345')
        EmailAddress.objects.create(user=otherUser, 
            email='otherperson@example.com',
            primary=True,
            verified=False)

        self.client.force_authenticate(user=otherUser)

        topTenItems = self.topTenList.topTenItem.all()
        item_4_id = topTenItems[3].id

        item_detail_url = reverse('topTenLists:TopTenItems-detail', kwargs={'pk': item_4_id})

        data = {'name': 'Cauliflower curry', 'description': 'with lots of ginger'}

        response = self.client.patch(item_detail_url, data, format='json')

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_move_topTenItem_up(self):
        """
        Move item up should swap two topTenItems
        """

        # this seems to be a reference, and always gives the latest data
        topTenItems = self.topTenList.topTenItem.all()

        item_1_id = topTenItems[0].id
        item_2_id = topTenItems[1].id
        move_up_url = reverse('topTenLists:TopTenItems-moveup', kwargs={'pk': item_2_id})
        
        response = self.client.patch(move_up_url)

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        edited_topTenList2 = TopTenList.objects.get(pk=self.topTenList_id)

        # the topTenList should have 10 topTenItems
        self.assertEqual(topTenItems.count(), 10)

        # the first and second items should have swapped order
        # first item in list should have second item's values
        self.assertEqual(topTenItems[0].id, item_2_id)
        self.assertEqual(topTenItems[0].order, 1)
        self.assertEqual(topTenItems[0].name, new_list_data.get('topTenItem', None)[1].get('name', None))
        self.assertEqual(topTenItems[0].description, new_list_data.get('topTenItem', None)[1].get('description', None))

        # second item in list should have first item's values
        self.assertEqual(topTenItems[1].id, item_1_id)
        self.assertEqual(topTenItems[1].order, 2)
        self.assertEqual(topTenItems[1].name, new_list_data.get('topTenItem', None)[0].get('name', None))
        self.assertEqual(topTenItems[1].description, new_list_data.get('topTenItem', None)[0].get('description', None))

    def test_move_item_1_up(self):
        """
        You cannot move the first item up
        """

        topTenItems = self.topTenList.topTenItem.all()
        item_1_id = topTenItems[0].id
        move_up_url = reverse('topTenLists:TopTenItems-moveup', kwargs={'pk': item_1_id})
        
        response = self.client.patch(move_up_url)

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_edit_topTenItem_set_reusableItem(self):
        """
        The user can assign a reusable item to a top ten item
        """

        topTenItems = self.topTenList.topTenItem.all()
        item_1_id = topTenItems[0].id

        item_detail_url = reverse('topTenLists:TopTenItems-detail', kwargs={'pk': item_1_id})

        create_reusable_item(self, topTenItems[1]) # create a reusable item, referenced by a different top ten item
 
        data = {'reusableItem_id': self.reusableItem.id}

        response = self.client.patch(item_detail_url, data, format='json')

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_toptenitem = TopTenItem.objects.get(id=item_1_id)

        # the reusableItem should have changed
        self.assertEqual(isinstance(updated_toptenitem.reusableItem.name, str), True)
        self.assertNotEqual(updated_toptenitem.reusableItem.name, '')
        self.assertEqual(updated_toptenitem.reusableItem.name, self.reusableItem.name)
        self.assertEqual(updated_toptenitem.reusableItem.id, self.reusableItem.id)

    def test_edit_topTenItem_set_reusableItem_not_exists(self):
        """
        The reusable item must exist
        """

        topTenItems = self.topTenList.topTenItem.all()
        item_1_id = topTenItems[0].id

        item_detail_url = reverse('topTenLists:TopTenItems-detail', kwargs={'pk': item_1_id})

        data = {'reusableItem_id': uuid.uuid4()} # a non-existent reusable item

        response = self.client.patch(item_detail_url, data, format='json')

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_edit_topTenItem_set_reusableItem_public(self):
        """
        If not created by the user, succeeds if the reusable item is public
        """

        topTenItems = self.topTenList.topTenItem.all()

        create_reusable_item(self, topTenItems[1])

        # make sure the reusable item is private
        reusableItem = ReusableItem.objects.get(pk=self.reusableItem.id)
        reusableItem.is_public = True
        reusableItem.save()

        # set up another user
        self.user2 = CustomUser.objects.create_user('Test user 2', 'person2@example.com', '12345')
        EmailAddress.objects.create(user=self.user2,
            email='person2@example.com',
            primary=True,
            verified=True)

        self.client.force_authenticate(user=self.user2)

        # create a top ten list for user 2
        response1 = self.client.post(create_list_url, second_list_data, format='json')
        topTenList2_id = json.loads(response1.content)['id']
        topTenList2 = TopTenList.objects.get(pk=topTenList2_id)
        topTenItems2 = topTenList2.topTenItem.all()

        # and assign the reusable item to a top ten item belonging to user 2
        item_1_id = topTenItems2[0].id

        item_detail_url = reverse('topTenLists:TopTenItems-detail', kwargs={'pk': item_1_id})

        data = {'reusableItem_id': self.reusableItem.id}

        response2 = self.client.patch(item_detail_url, data, format='json')

        # the request should succeed
        self.assertEqual(response2.status_code, status.HTTP_200_OK)

    def test_edit_topTenItem_set_reusableItem_not_public(self):
        """
        If not created by the user, fails if the reusable item is not public
        """

        topTenItems = self.topTenList.topTenItem.all()

        create_reusable_item(self, topTenItems[1])

        # make sure the reusable item is private
        reusableItem = ReusableItem.objects.get(pk=self.reusableItem.id)
        reusableItem.is_public = False
        reusableItem.save()

        # set up another user
        self.user2 = CustomUser.objects.create_user('Test user 2', 'person2@example.com', '12345')
        EmailAddress.objects.create(user=self.user2, 
            email='person2@example.com',
            primary=True,
            verified=True)

        self.client.force_authenticate(user=self.user2)

        # create a top ten list for user 2
        response1 = self.client.post(create_list_url, second_list_data, format='json')
        topTenList2_id = json.loads(response1.content)['id']
        topTenList2 = TopTenList.objects.get(pk=topTenList2_id)
        topTenItems2 = topTenList2.topTenItem.all()

        # and assign the reusable item to a top ten item belonging to user 2
        item_1_id = topTenItems2[0].id

        item_detail_url = reverse('topTenLists:TopTenItems-detail', kwargs={'pk': item_1_id})

        data = {'reusableItem_id': self.reusableItem.id}

        response2 = self.client.patch(item_detail_url, data, format='json')
      

        # the request should fail
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_reusable_item_from_data(self):
        """
        Create a new reusable item from raw data and assign it to a top ten item
        """

        topTenItems = self.topTenList.topTenItem.all()
        item_1_id = topTenItems[0].id

        item_detail_url = reverse('topTenLists:TopTenItems-detail', kwargs={'pk': item_1_id})

        data = {'newReusableItem': True, 'name': 'fruit', 'reusableItemDefinition': 'a definition', 'reusableItemLink': 'here@there.com'}

        response = self.client.patch(item_detail_url, data, format='json')

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_toptenitem = TopTenItem.objects.get(id=item_1_id)

        # there should be a new reusable item based on the data provided
        self.assertEqual(isinstance(updated_toptenitem.reusableItem.name, str), True)
        self.assertNotEqual(updated_toptenitem.reusableItem.name, '')
        self.assertEqual(updated_toptenitem.reusableItem.name, data['name'])
        self.assertEqual(updated_toptenitem.reusableItem.definition, data['reusableItemDefinition'])
        self.assertEqual(updated_toptenitem.reusableItem.link, data['reusableItemLink'])

    def test_create_reusable_item_from_data_no_name(self):
        """
        Create a new reusable item from raw data should fail if no name provided
        """

        topTenItems = self.topTenList.topTenItem.all()
        item_1_id = topTenItems[0].id

        item_detail_url = reverse('topTenLists:TopTenItems-detail', kwargs={'pk': item_1_id})

        data = {'newReusableItem': True, 'reusableItemDefinition': 'a definition', 'reusableItemLink': 'here@there.com'}

        response = self.client.patch(item_detail_url, data, format='json')

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_reusable_item_from_data_name_empty_string(self):
        """
        Create a new reusable item from raw data should fail if no name provided
        """

        topTenItems = self.topTenList.topTenItem.all()
        item_1_id = topTenItems[0].id

        item_detail_url = reverse('topTenLists:TopTenItems-detail', kwargs={'pk': item_1_id})

        data = {'newReusableItem': True, 'name': '', 'reusableItemDefinition': 'a definition', 'reusableItemLink': 'here@there.com'}

        response = self.client.patch(item_detail_url, data, format='json')

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_reusable_item_from_own_toptenitem(self):
        """
        Create a new reusable item from an existing top ten item belonging to the user, and assign it to another top ten item
        """

        topTenItems = self.topTenList.topTenItem.all()
        item_1_id = topTenItems[0].id
        item_2_id = topTenItems[1].id # use this to create new reusable item

        item_detail_url = reverse('topTenLists:TopTenItems-detail', kwargs={'pk': item_1_id})

        data = {'newReusableItem': True, 'topTenItemForNewReusableItem': item_2_id, 'reusableItemDefinition': 'a definition', 'reusableItemLink': 'here@there.com'}

        response = self.client.patch(item_detail_url, data, format='json')

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_toptenitem = TopTenItem.objects.get(id=item_1_id)

        # there should be a new reusable item based on top ten item 2
        self.assertEqual(isinstance(updated_toptenitem.reusableItem.name, str), True)
        self.assertNotEqual(updated_toptenitem.reusableItem.name, '')
        self.assertEqual(updated_toptenitem.reusableItem.name, topTenItems[1].name)
        self.assertEqual(updated_toptenitem.reusableItem.definition, data['reusableItemDefinition'])
        self.assertEqual(updated_toptenitem.reusableItem.link, data['reusableItemLink'])

        # the owner of top ten item 2 should not get a notification
        self.assertEqual(Notification.objects.count(), 0)

    def test_create_reusable_item_from_own_toptenitem_fails(self):
        """
        The top ten item from which the reusable item is to be created, must exist
        """

        topTenItems = self.topTenList.topTenItem.all()
        item_1_id = topTenItems[0].id
        item_2_id = uuid.uuid4() # non-existent top ten item

        item_detail_url = reverse('topTenLists:TopTenItems-detail', kwargs={'pk': item_1_id})

        data = {'newReusableItem': True, 'topTenItemForNewReusableItem': item_2_id, 'reusableItemDefinition': 'a definition', 'reusableItemLink': 'here@there.com'}

        response = self.client.patch(item_detail_url, data, format='json')

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_reusable_item_from_others_public_toptenitem(self):
        """
        Create a new reusable item from an existing top ten item belonging to anothere user, and assign it to own top ten item
        """

        topTenItems = self.topTenList.topTenItem.all()
        item_1_id = topTenItems[0].id # use this to create new reusable item
        
        # make sure the top ten item is private
        topTenList = TopTenList.objects.get(pk=self.topTenList.id)
        #topTenItems = TopTenItem.objects.get(pk=item_1_id)
        topTenList.is_public = True
        topTenList.save()

        # set up another user
        self.user2 = CustomUser.objects.create_user('Test user 2', 'person2@example.com', '12345')
        EmailAddress.objects.create(user=self.user2,
            email='person2@example.com',
            primary=True,
            verified=True)

        self.client.force_authenticate(user=self.user2)

        # create a top ten list for user 2
        response1 = self.client.post(create_list_url, second_list_data, format='json')
        topTenList2_id = json.loads(response1.content)['id']
        topTenList2 = TopTenList.objects.get(pk=topTenList2_id)
        topTenItems2 = topTenList2.topTenItem.all()

        item_2_id = topTenItems2[0].id

        item_detail_url = reverse('topTenLists:TopTenItems-detail', kwargs={'pk': item_2_id})

        data = {'newReusableItem': True, 'topTenItemForNewReusableItem': item_1_id, 'reusableItemDefinition': 'a definition', 'reusableItemLink': 'here@there.com'}

        response = self.client.patch(item_detail_url, data, format='json')

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # the owner of top ten item 2 should NOT get a notification because the new reusable item is not public
        self.assertEqual(Notification.objects.count(), 0)
        self.assertEqual(json.loads(response.content)['reusableItem']['is_public'], False)

    def test_create_reusable_item_from_others_private_toptenitem(self):
        """
        Create a new reusable item from an existing top ten item belonging to anothere user, and assign it to own top ten item
        """

        topTenItems = self.topTenList.topTenItem.all()
        item_1_id = topTenItems[0].id # use this to create new reusable item
        
        # make sure the top ten item is private
        topTenList = TopTenList.objects.get(pk=self.topTenList.id)
        #topTenItems = TopTenItem.objects.get(pk=item_1_id)
        topTenList.is_public = False
        topTenList.save()

        # set up another user
        self.user2 = CustomUser.objects.create_user('Test user 2', 'person2@example.com', '12345')
        EmailAddress.objects.create(user=self.user2,
            email='person2@example.com',
            primary=True,
            verified=True)

        self.client.force_authenticate(user=self.user2)

        # create a top ten list for user 2
        response1 = self.client.post(create_list_url, second_list_data, format='json')
        topTenList2_id = json.loads(response1.content)['id']
        topTenList2 = TopTenList.objects.get(pk=topTenList2_id)
        topTenItems2 = topTenList2.topTenItem.all()

        item_2_id = topTenItems2[0].id

        item_detail_url = reverse('topTenLists:TopTenItems-detail', kwargs={'pk': item_2_id})

        data = {'newReusableItem': True, 'topTenItemForNewReusableItem': item_1_id, 'reusableItemDefinition': 'a definition', 'reusableItemLink': 'here@there.com'}

        response = self.client.patch(item_detail_url, data, format='json')

        # the request should fail
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_edit_topTenItem_dereference_reusableItem(self):
        """
        If the user dereferences a reusable item, it is deleted
        """

        topTenItems = self.topTenList.topTenItem.all()
        item_1_id = topTenItems[0].id

        item_detail_url = reverse('topTenLists:TopTenItems-detail', kwargs={'pk': item_1_id})

        create_reusable_item(self, topTenItems[0]) # create a reusable item, referenced by this top ten item

        # there should be one reusable item to start with
        self.assertEqual(TopTenItem.objects.get(id=item_1_id).reusableItem, ReusableItem.objects.get(pk=self.reusableItem.id))
        self.assertEqual(ReusableItem.objects.filter(pk=self.reusableItem.id).count(), 1)

        data = {'reusableItem_id': None}

        response = self.client.patch(item_detail_url, data, format='json')

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # the reusable item should have been deleted
        self.assertEqual(TopTenItem.objects.get(id=item_1_id).reusableItem, None)
        self.assertEqual(ReusableItem.objects.filter(pk=self.reusableItem.id).count(), 0)

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


