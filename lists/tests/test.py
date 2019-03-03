from django.test import TestCase
from users.models import CustomUser
from lists.models import List


class ListModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up non-modified objects used by all test methods
        CustomUser.objects.create(email='person@example.com', username='Test user')

    def setUp(self):
        # set up objects that may be modified by the test
        testuser = CustomUser.objects.first()
        List.objects.create(name='Test list', description='A description', created_by=testuser, created_by_username=testuser.username)


    """
    Test that the List model has the expected fields
    """
    def test_name_label(self):
        testlist = List.objects.first()
        field_label = testlist._meta.get_field('name').verbose_name
        self.assertEqual(field_label, 'name')

    def test_description_label(self):
        testlist = List.objects.first()
        field_label = testlist._meta.get_field('description').verbose_name
        self.assertEqual(field_label, 'description')

    """
    Test that the list is created with the expected values
    """

    def test_name(self):
        testlist = List.objects.first()
        field_value = testlist.name
        self.assertEqual(field_value, 'Test list')

    def test_description(self):
        testlist = List.objects.first()
        field_value = testlist.description
        self.assertEqual(field_value, 'A description')
