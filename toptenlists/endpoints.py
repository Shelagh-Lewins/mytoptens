from django.urls import include, path
from rest_framework import routers

from .api import TopTenListViewSet
from .api import TopTenListDetailViewSet
from .api import TopTenItemViewSet
from .api import SearchListsItemsView
from .api import ReusableItemViewSet
from .api import SearchReusableItemsView
from .api import NotificationViewSet

router = routers.DefaultRouter()
router.register('toptenlist', TopTenListViewSet, basename='TopTenLists') # 'TopTenLists' is used in reverse
router.register('toptenlistdetail', TopTenListDetailViewSet, basename='TopTenListDetail')
router.register('toptenitem', TopTenItemViewSet, basename='TopTenItems') # 'TopTenItems' is used in reverse
router.register('searchlistsitems', SearchListsItemsView, basename='searchlistsitems')
router.register('reusableitem', ReusableItemViewSet, basename='ReusableItems') # 'ReusableItems' is used in reverse
router.register('searchreusableitems', SearchReusableItemsView, basename='searchreusableitems')
router.register('notification', NotificationViewSet, basename='Notifications') # 'Notifications' is used in reverse

app_name = 'topTenLists' # namespace for reverse
urlpatterns = [
    path('', include(router.urls), name='thing'),
]
