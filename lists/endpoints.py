from django.conf.urls import include, url
from rest_framework import routers

from .api import ListViewSet
from .api import ListBySlugViewSet
from .api import ItemViewSet

router = routers.DefaultRouter()
router.register('lists', ListViewSet, base_name='Lists')
router.register('list', ListBySlugViewSet, base_name='ListBySlug')
router.register('items', ItemViewSet, base_name='Items')

urlpatterns = [
    url("^", include(router.urls)),
]
