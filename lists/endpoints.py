from django.urls import include, path
from rest_framework import routers

from .api import ListViewSet
from .api import ListDetailViewSet
from .api import ItemViewSet
from .api import SearchAPIView

router = routers.DefaultRouter()
router.register('list', ListViewSet, base_name='Lists') # 'Lists' is used in reverse
router.register('listdetail', ListDetailViewSet, base_name='ListDetail')
router.register('item', ItemViewSet, base_name='Items')
router.register('searchhome', SearchAPIView, base_name='searchhome')

app_name = 'lists' # namespace for reverse
urlpatterns = [
    path('', include(router.urls), name='thing'),
]
