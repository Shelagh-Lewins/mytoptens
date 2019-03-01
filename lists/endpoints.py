from django.urls import include, path
from rest_framework import routers

from .api import ListViewSet
from .api import ListBySlugViewSet
from .api import ItemViewSet
from .api import SearchAPIView

router = routers.DefaultRouter()
router.register('list', ListViewSet, base_name='Lists')
router.register('listbyslug', ListBySlugViewSet, base_name='ListBySlug')
router.register('item', ItemViewSet, base_name='Items')
router.register('searchhome', SearchAPIView, base_name='searchhome')

urlpatterns = [
    path('', include(router.urls)),
]
