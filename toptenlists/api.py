from rest_framework import viewsets, permissions
from rest_framework.decorators import detail_route, list_route
from rest_framework import status
from rest_framework.response import Response
from rest_framework import filters
from rest_framework.exceptions import APIException
from allauth.account.models import EmailAddress 

from .models import TopTenList, TopTenItem, ReusableItem, Notification
from .serializers import TopTenListSerializer, TopTenItemSerializer, ReusableItemSerializer, NotificationSerializer
from django.db.models import Q

from rest_flex_fields import FlexFieldsModelViewSet
from rest_framework.pagination import LimitOffsetPagination

# search against multiple models
from drf_multiple_model.viewsets import FlatMultipleModelAPIViewSet
from drf_multiple_model.pagination import MultipleModelLimitOffsetPagination


class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Only the owner can view or edit
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # handle permissions based on method
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        # Note this is not checked for create, because the object doesn't exist.
        if request.method in permissions.SAFE_METHODS:
            return True

        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user

        if hasattr(obj, 'topTenList'):
            if hasattr(obj.topTenList, 'created_by'):
                return obj.topTenList.created_by == request.user

class HasVerifiedEmail(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user.is_authenticated:
            return False

        try:
            email_address = EmailAddress.objects.get(user_id=request.user.id)
            return email_address.verified

        except:
            return False


class TopTenListViewSet(FlexFieldsModelViewSet):
    """
    ViewSet for topTenLists.
    """
    permission_classes = [IsOwnerOrReadOnly, HasVerifiedEmail]
    model = TopTenList
    serializer_class = TopTenListSerializer
    permit_list_expands = ['topTenItem']
    pagination_class = LimitOffsetPagination

    search_fields = ['created_by_username']
    filter_backends = (filters.SearchFilter,)

    def get_queryset(self):
        # unauthenticated user can only view public topTenLists
        queryset = TopTenList.objects.filter(is_public=True)

        # authenticated user can view public topTenLists and topTenLists the user created
        # listset in query parameters can be additional filter
        if self.request.user.is_authenticated:
            listset = self.request.query_params.get('listset', None)

            if listset == 'my-topTenLists':
                queryset = TopTenList.objects.filter(created_by=self.request.user)

            elif listset == 'public-topTenLists':
                queryset = TopTenList.objects.filter(is_public=True)

            else:
                queryset = TopTenList.objects.filter(
                    Q(created_by=self.request.user) | 
                    Q(is_public=True)
                )

        # return top ten lists with a top ten item that references a particular reusable item
        reusableitem_id = self.request.query_params.get('reusableItem', None)

        if reusableitem_id is not None:
            queryset = queryset.filter(topTenItem__reusableItem_id=reusableitem_id)

        # return top ten lists created by user: URL parameter created_by
        created_by = self.request.query_params.get('created_by', None)

        if created_by is not None:
            queryset = queryset.filter(created_by=created_by)

        # filter on username constains string
        created_by_username = self.request.query_params.get('created_by_username', None)

        if created_by_username is not None:
            queryset = queryset.filter(created_by_username__icontains=created_by_username)

        # filter on name contains string
        name = self.request.query_params.get('name', None)

        if name is not None:
            queryset = queryset.filter(name__icontains=name)

        # return only topTenLists that have no parent topTenItem
        #toplevel = self.request.query_params.get('toplevel')
        #if toplevel is not None:
            #queryset = queryset.filter(parent_topTenItem=None)

        return queryset.order_by('name')

    def pre_save(self, obj):
        obj.created_by = self.request.user

    def perform_update(self, serializer):
        # housekeeping if parent_topTenItem is changed
        parent_topTenItem_id = serializer.validated_data.get('parent_topTenItem_id', None)

        # check parent topTenItem exists
        if parent_topTenItem_id is not None:
            topTenItem = TopTenItem.objects.get(pk=parent_topTenItem_id)

            if not topTenItem: # if the topTenItem isn't found, don't save the new value
                raise APIException("Unable to set parent_topTenItem. No topTenItem found with id: " + parent_topTenItem_id.__str__())
                # print('case 1')
            # check the topTenItem belongs to the same user
            if topTenItem.topTenList.created_by != self.request.user:
                raise APIException("Unable to set parent_topTenItem. " + parent_topTenItem_id.__str__() + "does not belong to this user")
                # print('case 2')
            # don't allow the parent top ten list to be the same top ten list that contains the top ten item
            parent_topTenItem = TopTenItem.objects.get(pk=parent_topTenItem_id)

            # print('serializer.instance.id', serializer.instance.id)
            # print('parent_topTenItem.topTenList.id', parent_topTenItem.topTenList.id)

            if serializer.instance.id == parent_topTenItem.topTenList.id:
                raise APIException("Unable to set parent_topTenItem. " + parent_topTenItem.topTenList.id.__str__() + "is the list to which the Top Ten Item belongs")

            # set any TopTenLists with this parent_topTenItem to null parent_topTenItem
            # an topTenItem can only have one child topTenList
            TopTenList.objects.filter(parent_topTenItem_id=parent_topTenItem_id).update(parent_topTenItem_id=None)
 
        serializer.save()

class TopTenListDetailViewSet(viewsets.ModelViewSet):
    """
    Find a topTenList by id with full details
    Return the topTenList itself and associated child / parent topTenLists for navigation
    """
    permission_classes = [IsOwnerOrReadOnly, HasVerifiedEmail]
    model = TopTenList
    serializer_class = TopTenListSerializer

    def get_queryset(self):
        my_topTenList = TopTenList.objects.filter(id=self.request.query_params.get('id', None)).first()

        if my_topTenList is None:
            return

        # create an array containing the id of every topTenList to return
        # we always want the topTenList itself
        pk_topTenList = [my_topTenList.id]

        # then we want the parent topTenList, if any
        try:
            parent_topTenItem = TopTenItem.objects.filter(id=my_topTenList.parent_topTenItem.id).first()
            pk_topTenList.append(parent_topTenItem.topTenList.id)

        except AttributeError:
            pass # no parent topTenList is OK

        # and child topTenLists, if any
        topTenItem_ids = [o.id for o in my_topTenList.topTenItem.all()]

        try:
            child_topTenLists = TopTenList.objects.filter(parent_topTenItem__in=topTenItem_ids)

        except AttributeError:
            pass

        try:
            child_topTenList_ids = [o.id for o in child_topTenLists]
            pk_topTenList += child_topTenList_ids

        except AttributeError:
            pass # we don't mind no child topTenLists

        # can view public topTenLists and topTenLists the user created
        if self.request.user.is_authenticated:
            return TopTenList.objects.filter(pk__in=pk_topTenList).filter(
                Q(created_by=self.request.user) | 
                Q(is_public=True)
            )

        return TopTenList.objects.filter(pk__in=pk_topTenList).filter(is_public=True)


class TopTenItemViewSet(viewsets.ModelViewSet):
    """
    Although topTenItems are retrieved as part of a topTenList request, they are edited through this viewset
    """
    permission_classes = [IsOwnerOrReadOnly, HasVerifiedEmail]
    model = TopTenItem
    serializer_class = TopTenItemSerializer

    def get_queryset(self):
        # can view topTenItems belonging to public topTenLists and topTenLists the user created
        if self.request.user.is_authenticated:
            return TopTenItem.objects.filter(
                Q(topTenList__created_by=self.request.user) | 
                Q(topTenList__is_public=True)
            )

        return TopTenItem.objects.filter(topTenList__is_public=True)

    @detail_route(methods=['patch'])
    def moveup(self, request, pk=None):

        if self.request.user.is_authenticated:
            # find the topTenItem to move up
            topTenItem = TopTenItem.objects.get(pk=pk)       
            topTenItem_order = topTenItem.order
            parent_topTenList = topTenItem.topTenList_id # note 'topTenList_id' not 'topTenList'

            if topTenItem.order == 1:
                return Response({'message': 'TopTenItem is already at top of TopTenList'}, status=status.HTTP_403_FORBIDDEN)

            # change the topTenItem order up one
            topTenItem.order = topTenItem.order - 1

            # find the existing topTenItem above
            topTenItem_above = TopTenItem.objects.get(topTenList=parent_topTenList, order=topTenItem_order-1)
            # and change its order down one
            topTenItem_above.order = topTenItem_order

            topTenItem.save()
            topTenItem_above.save()

            # return the new topTenItems so the UI can update
            # update: this doesn't provide context, so request doesn't exist in the serializer and it can't get the user's vote on a referenced reusable item.
            # I can't make get_serializer work to provide context
            # so will not return the new items. Instead, the UI can figure out what should happen, it knows what was requested and that it succeeded.
            #topTenItems = [topTenItem, topTenItem_above]
            # serializer = TopTenItemSerializer(topTenItems, many=True)

            # return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(status=status.HTTP_200_OK)

        return Response(status=status.HTTP_401_UNAUTHORIZED)

    def perform_update(self, serializer):
        # do not allow order to be changed
        if serializer.validated_data.get('order', None) is not None:
            raise APIException("TopTenItem order may not be changed. Use moveup instead.")

        # find the topTenItem's reusableItem, if any
        current_reusable_item = self.get_object().reusableItem

        serializer.save()

        # if the user has just dereferenced a reusableItem
        # remove any votes for change requests on that reusableItem
        if current_reusable_item is not None:
            myTopTenItemsUsingReusableItem = TopTenItem.objects.filter(reusableItem=current_reusable_item,
                topTenList__created_by=self.request.user).select_related('topTenList')

            if myTopTenItemsUsingReusableItem.count() == 0:
                #print('no longer using reusableItem')
                #print(current_reusable_item.name)

                ReusableItemSerializer.remove_my_votes(current_reusable_item, self.request.user)
                ReusableItemSerializer.count_votes(current_reusable_item)
 

    def perform_create(self, serializer):
        # do not allow a topTenItem to be created by the API
        # topTenItems are created when a list is created
        raise APIException("TopTenItem may not be created via API")

    def perform_destroy(self, serializer):
        # do not allow a topTenItem to be deleted by the API
        # topTenItems are deleted when the list is deleted
        raise APIException("TopTenItem may not be deleted via API")


class LimitPagination(MultipleModelLimitOffsetPagination):
    """
    Set the number of results to be returned for each model
    """
    default_limit = 10

class SearchListsItemsView(FlatMultipleModelAPIViewSet): # pylint: disable=too-many-ancestors
    """
    Search for topTenLists and topTenItems by name
    By default returns all topTenLists the user can view and their items
    If url parameter includelists is false, then only topTenItems are returned
    If url parameter includeitems is false, then only topTenLists are returned
    If both are false you'll get no results
    """
    pagination_class = LimitPagination
    filter_backends = (filters.SearchFilter,)
    search_fields = ('name',)
    sorting_fields = ['name']

    def get_querylist(self):
        topTenList_query_set = {'queryset': TopTenList.objects.all(), 'serializer_class': TopTenListSerializer}
        topTenItem_query_set = {'queryset': TopTenItem.objects.all().exclude(name=''), 'serializer_class': TopTenItemSerializer}

        # only show topTenItems that do not have an associated reusableItem
        if self.request.query_params.get('excludereusableitems', None) == 'true':
            topTenItem_query_set['queryset'] = topTenItem_query_set['queryset'].filter(reusableItem__isnull=True)


        # authenticated user can view public topTenLists and topTenLists the user created
        # and topTenItems belonging to those topTenLists
        if self.request.user.is_authenticated:
            topTenList_query_set['queryset'] = topTenList_query_set['queryset'].filter(
                Q(created_by=self.request.user) |
                Q(is_public=True)
            )
            topTenItem_query_set['queryset'] = topTenItem_query_set['queryset'].filter(
                Q(topTenList__created_by=self.request.user) |
                Q(topTenList__is_public=True)
            )

        # unauthenticated user can view public topTenLists
        # and topTenItems belonging to those topTenLists
        else:
            topTenList_query_set['queryset'] = topTenList_query_set['queryset'].filter(is_public=True)
            topTenItem_query_set['queryset'] = topTenItem_query_set['queryset'].filter(topTenList__is_public=True)

        querylist = []

        if self.request.query_params.get('includetoptenlists', None) != 'false':
            querylist.append(topTenList_query_set)

        if self.request.query_params.get('includetoptenitems', None) != 'false':
            querylist.append(topTenItem_query_set)

        # show a warning if all querysets have been excluded
        # if includetoptenlists and includetoptenitems are both false in the url
        if len(querylist) == 0:
            print('warning: SearchListsItemsView has no queryset and will return no results')

        return querylist

class ReusableItemViewSet(FlexFieldsModelViewSet):
    """
    ViewSet for reusableItems.
    User can see public reusableItems and reusableItems that they created
    """

    # only users with verified email can request changes
    permission_classes = [HasVerifiedEmail]
    model = ReusableItem
    serializer_class = ReusableItemSerializer


    def pre_save(self, obj):
        print('API. ReusableItemViewSet, pre_save')
        print('obj', obj)
        print('self.request.user', self.request.user)
        obj.created_by = self.request.user

    def get_queryset(self):
        queryset = ReusableItem.objects.all()

        # return details of a single ReusableItem
        if 'id' in self.request.query_params:
            reusableItemId = self.request.query_params.get('id', None)

            queryset = queryset.filter(id=reusableItemId)

        if self.request.user.is_authenticated:
            return queryset.filter(
                Q(created_by=self.request.user) | 
                Q(is_public=True)
            )

        else:
            return queryset.filter(is_public=True)

    def perform_create(self, serializer):
        # do not allow a reusableItem to be created by the API
        # reusableItems are created from topTenItems
        raise APIException("ReusableItem may not be created via API")

    def perform_destroy(self, serializer):
        # do not allow a reusableItem to be deleted by the API
        # reusableItems are deleted when no longer referenced
        raise APIException("ReusableItem may not be deleted via API")

class SearchReusableItemsView(FlatMultipleModelAPIViewSet): # pylint: disable=too-many-ancestors
    """
    Search for ReusableItems by name
    """
    pagination_class = LimitPagination
    filter_backends = (filters.SearchFilter,)
    search_fields = ('name',)

    def get_querylist(self):
        reusableItem_query_set = {'queryset': ReusableItem.objects.all(), 'serializer_class': ReusableItemSerializer}

        #print('user')
        #print(self.request.user.__dict__)

        # authenticated user can view public ReusableItems and ReusableItems the user created
        if self.request.user.is_authenticated:
            reusableItem_query_set['queryset'] = reusableItem_query_set['queryset'].filter(
                Q(created_by=self.request.user) |
                Q(is_public=True)
            )

        # unauthenticated user can view public ReusableItems
        else:
            print('not authenticated')
            reusableItem_query_set['queryset'] = reusableItem_query_set['queryset'].filter(is_public=True)

        querylist = [reusableItem_query_set]
        #print('querylist from search')
        #print(querylist)

        return querylist

class NotificationViewSet(viewsets.ModelViewSet):
    """
    Although Notifications are retrieved as part of a user request, they are edited through this viewset
    """
    permission_classes = [IsOwner] 
    model = Notification
    serializer_class = NotificationSerializer
    permit_list_expands = ['reusableItem', 'topTenItem']

    def get_queryset(self):
        # can only view own notifications
        if self.request.user.is_authenticated:
            return Notification.objects.filter(created_by=self.request.user)

        return None

    def perform_create(self, serializer):
        # do not allow a notification to be created by the API
        # notifications are created by the server
        raise APIException("Notification may not be created via API")

    @list_route(methods=['delete'])
    def deleteall(self, request):
        """
        Delete all notifications belonging to this user
        """

        if self.request.user.is_authenticated:
            # find the user's notifications
            myNotifications = Notification.objects.filter(created_by=request.user)

            data = []

            for notification in myNotifications:
                data.append(notification.id)

            myNotifications.delete()

            return Response(data, status=status.HTTP_200_OK)

        return Response(status=status.HTTP_401_UNAUTHORIZED)

