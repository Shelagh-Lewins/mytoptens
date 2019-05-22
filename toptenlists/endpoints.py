from django.urls import include, path
from rest_framework import routers

from .api import TopTenListViewSet
from .api import TopTenListDetailViewSet
from .api import TopTenItemViewSet
from .api import SearchListsItemsView
from .api import ReusableItemViewSet
from .api import SearchReusableItemsView

router = routers.DefaultRouter()
router.register('toptenlist', TopTenListViewSet, base_name='TopTenLists') # 'TopTenLists' is used in reverse
router.register('toptenlistdetail', TopTenListDetailViewSet, base_name='TopTenListDetail')
router.register('toptenitem', TopTenItemViewSet, base_name='TopTenItems') # 'TopTenItems' is used in reverse
router.register('searchlistsitems', SearchListsItemsView, base_name='searchlistsitems')
router.register('reusableitem', ReusableItemViewSet, base_name='ReusableItems') # 'ReusableItems' is used in reverse
router.register('searchreusableitems', SearchReusableItemsView, base_name='searchreusableitems')

app_name = 'topTenLists' # namespace for reverse
urlpatterns = [
    path('', include(router.urls), name='thing'),
]
