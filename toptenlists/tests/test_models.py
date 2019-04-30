from django.test import TestCase
from users.models import CustomUser
from toptenlists.models import TopTenList

class TopTenListModelTest(TestCase):
    """
    This is a bare bones test
    TopTenList and TopTenItem models are fully tested by test_api.py
    This tests that a new list has the right fields and items
    """
    @classmethod
    def setUpTestData(cls):
        # Set up non-modified objects used by all test methods
        cls.user = CustomUser.objects.create_user('Test user', 'person@example.com', '12345')

    def setUp(self):
        # set up objects that may be modified by the test
        self.topTenList = TopTenList.objects.create(name='Test topTenList', description='A description', created_by=self.user, created_by_username=self.user.username)


    """
    Test that the TopTenList model has the expected fields
    """
    def test_name_label(self):
        field_label = self.topTenList._meta.get_field('name').verbose_name
        self.assertEqual(field_label, 'name')

    def test_description_label(self):
        field_label = self.topTenList._meta.get_field('description').verbose_name
        self.assertEqual(field_label, 'description')
