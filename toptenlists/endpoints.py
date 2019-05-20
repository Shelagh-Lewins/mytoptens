from django.urls import include, path
from rest_framework import routers

from .api import TopTenListViewSet
from .api import TopTenListDetailViewSet
from .api import TopTenItemViewSet
from .api import SearchHomeView
from .api import SearchTopTenItemsView

router = routers.DefaultRouter()
router.register('toptenlist', TopTenListViewSet, base_name='TopTenLists') # 'TopTenLists' is used in reverse
router.register('toptenlistdetail', TopTenListDetailViewSet, base_name='TopTenListDetail')
router.register('toptenitem', TopTenItemViewSet, base_name='TopTenItems') # 'TopTenItems' is used in reverse
router.register('searchhome', SearchHomeView, base_name='searchhome')
router.register('searchtoptenitem', SearchTopTenItemsView, base_name='searchtoptenitem')

app_name = 'topTenLists' # namespace for reverse
urlpatterns = [
    path('', include(router.urls), name='thing'),
]
