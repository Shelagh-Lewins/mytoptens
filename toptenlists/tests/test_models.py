from django.test import TestCase
from users.models import CustomUser
from toptenlists.models import TopTenList

# TODO
# test items
# test custom user


class TopTenListModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up non-modified objects used by all test methods
        cls.user = CustomUser.objects.create(email='person@example.com', username='Test user')

    def setUp(self):
        # set up objects that may be modified by the test
        self.toptenlist = TopTenList.objects.create(name='Test toptenlist', description='A description', created_by=self.user, created_by_username=self.user.username)

    # TODO test the rest of the model


    """
    Test that the TopTenList model has the expected fields
    """
    def test_name_label(self):
        field_label = self.toptenlist._meta.get_field('name').verbose_name
        self.assertEqual(field_label, 'name')

    def test_description_label(self):
        field_label = self.toptenlist._meta.get_field('description').verbose_name
        self.assertEqual(field_label, 'description')
