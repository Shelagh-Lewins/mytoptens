from rest_framework import viewsets, permissions
from rest_framework.decorators import detail_route
from rest_framework import status
from rest_framework.response import Response
from rest_framework import filters
from rest_framework.exceptions import APIException

from .models import TopTenList, TopTenItem
from .serializers import TopTenListSerializer, TopTenItemSerializer
from django.db.models import Q

from rest_flex_fields import FlexFieldsModelViewSet
from rest_framework.pagination import LimitOffsetPagination

# search against multiple models
from drf_multiple_model.viewsets import FlatMultipleModelAPIViewSet
from drf_multiple_model.pagination import MultipleModelLimitOffsetPagination


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

        if request.user.email_verified:
            return True

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

        # allow filter by URL parameter created_by
        created_by = self.request.query_params.get('created_by', None)

        if created_by is not None:
            queryset = queryset.filter(created_by=created_by)

        # return only topTenLists that have no parent topTenItem
        toplevel = self.request.query_params.get('toplevel')
        if toplevel is not None:
            queryset = queryset.filter(parent_topTenItem=None)

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
                raise APIException("Unable to set parent_topTenItem. No topTenItem found with id: " + parent_topTenItem_id)

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
            topTenItems = [topTenItem, topTenItem_above]

            serializer = TopTenItemSerializer(topTenItems, many=True)

            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(status=status.HTTP_401_UNAUTHORIZED)

    def perform_update(self, serializer):
        # do not allow order to be changed
        if serializer.validated_data.get('order', None) is not None:
            raise APIException("TopTenItem order may not be changed. Use moveup instead.")
 
        serializer.save()


class LimitPagination(MultipleModelLimitOffsetPagination):
    """
    Set the number of results to be returned for each model
    """
    default_limit = 10

class SearchAPIView(FlatMultipleModelAPIViewSet): # pylint: disable=too-many-ancestors
    """
    Search for topTenLists and topTenItems by name
    """
    pagination_class = LimitPagination
    filter_backends = (filters.SearchFilter,)
    search_fields = ('name',)

    def get_querylist(self):
        topTenList_query_set = {'queryset': TopTenList.objects.all(), 'serializer_class': TopTenListSerializer}
        topTenItem_query_set = {'queryset': TopTenItem.objects.all().exclude(name=''), 'serializer_class': TopTenItemSerializer}

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

        querylist = [
            topTenList_query_set,
            topTenItem_query_set,
        ]

        return querylist