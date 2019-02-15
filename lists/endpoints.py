#from django.conf.urls import include, url
from django.urls import include, path, re_path
from rest_framework import routers

from .api import ListViewSet
from .api import ListBySlugViewSet
from .api import ItemViewSet

router = routers.DefaultRouter()
router.register('list', ListViewSet, base_name='Lists')
router.register('listbyslug', ListBySlugViewSet, base_name='ListBySlug')
router.register('item', ItemViewSet, base_name='Items')

urlpatterns = [
    path('', include(router.urls)),
]
