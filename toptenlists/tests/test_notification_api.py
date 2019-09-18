"""
Tests for ReusableItems api
"""

import json

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import CustomUser
from allauth.account.models import EmailAddress 
from toptenlists.models import TopTenList, TopTenItem, ReusableItem, Notification

# disable throttling for testing
from toptenlists.api import TopTenListViewSet, TopTenItemViewSet, TopTenListDetailViewSet, ReusableItemViewSet, NotificationViewSet

TopTenListViewSet.throttle_classes = ()
TopTenItemViewSet.throttle_classes = ()
TopTenListDetailViewSet.throttle_classes = ()
ReusableItemViewSet.throttle_classes = ()
NotificationViewSet.throttle_classes = ()

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

# 'topTenLists' is the app_name set in endpoints.py and is common to top ten lists, top ten items and reusable items because they are all defined in the same app
# 'Notifications' is the base_name set for the Notifications route in endpoints.py
# '-list' is a standard api command to list a model.

notification_list_url = reverse('topTenLists:Notifications-list')

def create_user(self, index):
    user_ref = 'user_' + str(index) # refer to user by self.user_1 etc
    username = 'Test user ' + str(index)
    email_address = 'person_' + str(index) + '@example.com'
    password = str(index) + str(index) + str(index) + str(index) + str(index)

    setattr(self, user_ref, CustomUser.objects.create_user(username, email_address, email_address))
    EmailAddress.objects.create(user=getattr(self, user_ref), 
            email=email_address,
            primary=True,
            verified=True)

def get_notification_data(self, user_ref):
    return {
        'context': 'reusableItem',
        'event': 'changeRequestCreated',
        'created_by_id': getattr(self, user_ref).id
    }

def create_notification(self, user_ref):
    return Notification.objects.create(**get_notification_data(self, user_ref))

class CreateNotificationAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        for index in range(1, 3): # user_1 to user_3
            create_user(cls, index)

    def test_create_notification(self):
        """
        Notifications cannot be created via the api
        """

        # user not logged in
        response1 = self.client.post(notification_list_url, get_notification_data(self, 'user_1'), format='json')

        self.assertEqual(response1.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(Notification.objects.count(), 0)

        # user is logged in
        self.client.force_authenticate(user=self.user_1)

        response2 = self.client.post(notification_list_url, get_notification_data(self, 'user_1'), format='json')

        self.assertEqual(response2.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(Notification.objects.count(), 0)

class ViewNotificationAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        for index in range(1, 3): # user_1 to user_3
            create_user(cls, index)

    def test_view_notifications_api_not_logged_in(self):
        """
        Cannot see notification if the user is not logged in
        """

        create_notification(self, 'user_1')
        self.assertEqual(Notification.objects.count(), 1)

        response = self.client.get(notification_list_url, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_view_notifications_api_other_user(self):
        """
        Cannot see notification that belongs to another user
        """

        create_notification(self, 'user_1')
        self.assertEqual(Notification.objects.count(), 1)

        self.client.force_authenticate(user=self.user_2)

        response = self.client.get(notification_list_url, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_view_notifications_api_own(self):
        """
        Can see notification if the user owns the notification
        """

        expected_data = get_notification_data(self, 'user_1')

        create_notification(self, 'user_1')

        # check the notification was created correctly
        self.assertEqual(Notification.objects.count(), 1)
        notification = Notification.objects.first()
        self.assertEqual(notification.created_by, getattr(self, 'user_1'))
        self.assertEqual(notification.context, expected_data['context'])
        self.assertEqual(notification.event, expected_data['event'])
        self.assertEqual(notification.unread, True)

        self.client.force_authenticate(user=self.user_1)

        response = self.client.get(notification_list_url, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        # check the api returned the correct values
        response_notification = json.loads(response.content)[0]

        self.assertEqual(response_notification['created_by'], str(getattr(self, 'user_1').id))
        self.assertEqual(response_notification['context'], expected_data['context'])
        self.assertEqual(response_notification['event'], expected_data['event'])
        self.assertEqual(response_notification['unread'], True)

class DeleteNotificationAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        for index in range(1, 3): # user_1 to user_3
            create_user(cls, index)

    def setUp(self):
        self.notification = create_notification(self, 'user_1')
        self.url = reverse('topTenLists:Notifications-detail', kwargs={'pk': self.notification.id})

    def test_delete_notification_by_owner(self):
        """
        Delete notification should succeed if notification is owned by the user
        """

        self.assertEqual(Notification.objects.count(), 1)

        self.client.force_authenticate(user=self.user_1)

        response = self.client.delete(self.url)

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Notification.objects.count(), 0)

    def test_delete_notification_not_logged_in(self):
        """
        Delete notification should fail if user isn't logged in
        """

        self.assertEqual(Notification.objects.count(), 1)

        response = self.client.delete(self.url)

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(Notification.objects.count(), 1)
        print('notification 2', Notification.objects.first())

    def test_delete_notification_by_not_owner(self):
        """
        Delete notification should succeed if notification is not owned by the user
        """

        self.assertEqual(Notification.objects.count(), 1)

        self.client.force_authenticate(user=self.user_2)

        response = self.client.delete(self.url)

        # the request should succeed
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(Notification.objects.count(), 1)

class EditNotificationAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        for index in range(1, 3): # user_1 to user_3
            create_user(cls, index)

    def setUp(self):
        self.notification = create_notification(self, 'user_1')
        self.url = reverse('topTenLists:Notifications-detail', kwargs={'pk': self.notification.id})

    def test_edit_notification_by_owner(self):
        self.assertEqual(Notification.objects.count(), 1)

"""
TODO
test cannot edit another user's notification

test can edit unread and nothing else

test notification is created when it should be (maybe in reusable item tests)
for at least 3 users

"""