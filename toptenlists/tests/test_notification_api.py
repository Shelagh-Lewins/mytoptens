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

notification_url = reverse('topTenLists:Notifications-list')

"""
TODO
test cannot see, edit or delete another user's notification

test cannot create notification
test can edit unread and nothing else
test can delete notification

test notification is created when it should be (maybe in reusable item tests)
for at least 3 users

"""

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

def create_notification(self, user_ref):
  notificationData = {
    'context': 'reusableItem',
    'event': 'changeRequestCreated',
    'created_by': getattr(self, user_ref),
    #'reusableItem': newReusableItem
  }

  Notification.objects.create(**notificationData)

class NotificationAPITest(APITestCase):
    @classmethod
    def setUpTestData(cls):
        for index in range(1, 3): # user_1 to user_3
            create_user(cls, index)

    #def setUp(self):
        #print('setup')

    def test_view_notifications_api_not_logged_in(self):
        """
        Cannot see notification if the user is not logged in
        """

        create_notification(self, 'user_1')

        response = self.client.get(notification_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_view_notifications_api_other_user(self):
      """
      Cannot see notification if the user does not own the notification
      """

      create_notification(self, 'user_1')

      self.client.force_authenticate(user=self.user_2)

      response = self.client.get(notification_url)

      self.assertEqual(response.status_code, status.HTTP_200_OK)
      self.assertEqual(len(response.data), 0)

    def test_view_notifications_api_own(self):
      """
      Can see notification if the user owns the notification
      """

      create_notification(self, 'user_1')

      self.client.force_authenticate(user=self.user_1)

      response = self.client.get(notification_url)

      self.assertEqual(response.status_code, status.HTTP_200_OK)
      self.assertEqual(len(response.data), 1)

  # TODO test:
  # delete
  # edit - only 'unread'