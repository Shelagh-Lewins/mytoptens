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

        if hasattr(obj, 'toptenlist'):
            if hasattr(obj.toptenlist, 'created_by'):
                return obj.toptenlist.created_by == request.user

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
    ViewSet for toptenlists.
    """
    permission_classes = [IsOwnerOrReadOnly, HasVerifiedEmail]
    model = TopTenList
    serializer_class = TopTenListSerializer
    permit_list_expands = ['toptenitem']
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        # unauthenticated user can only view public toptenlists
        queryset = TopTenList.objects.filter(is_public=True)

        # authenticated user can view public toptenlists and toptenlists the user created
        # listset in query parameters can be additional filter
        if self.request.user.is_authenticated:
            listset = self.request.query_params.get('listset', None)

            if listset == 'my-toptenlists':
                queryset = TopTenList.objects.filter(created_by=self.request.user)

            elif listset == 'public-toptenlists':
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

        # return only toptenlists that have no parent toptenitem
        toplevel = self.request.query_params.get('toplevel')
        if toplevel is not None:
            queryset = queryset.filter(parent_toptenitem=None)

        return queryset.order_by('name')

    def pre_save(self, obj):
        obj.created_by = self.request.user

    def perform_update(self, serializer):
        # housekeeping if parent_toptenitem is changed
        parent_toptenitem_id = serializer.validated_data.get('parent_toptenitem_id', None)

        # check parent toptenitem exists
        if parent_toptenitem_id is not None:
            toptenitem = TopTenItem.objects.get(pk=parent_toptenitem_id)

            if not toptenitem: # if the toptenitem isn't found, don't save the new value
                raise APIException("Unable to set parent_toptenitem. No toptenitem found with id: " + parent_toptenitem_id)

            # set any TopTenLists with this parent_toptenitem to null parent_toptenitem
            # an toptenitem can only have one child toptenlist
            TopTenList.objects.filter(parent_toptenitem_id=parent_toptenitem_id).update(parent_toptenitem_id=None)
 
        serializer.save()


class TopTenListDetailViewSet(viewsets.ModelViewSet):
    """
    Find a toptenlist by id with full details
    Return the toptenlist itself and associated child / parent toptenlists for navigation
    """
    permission_classes = [IsOwnerOrReadOnly, HasVerifiedEmail]
    model = TopTenList
    serializer_class = TopTenListSerializer

    def get_queryset(self):
        my_toptenlist = TopTenList.objects.filter(id=self.request.query_params.get('id', None)).first()

        if my_toptenlist is None:
            return

        # create an array containing the id of every toptenlist to return
        # we always want the toptenlist itself
        pk_toptenlist = [my_toptenlist.id]

        # then we want the parent toptenlist, if any
        try:
            parent_toptenitem = TopTenItem.objects.filter(id=my_toptenlist.parent_toptenitem.id).first()
            pk_toptenlist.append(parent_toptenitem.toptenlist.id)

        except AttributeError:
            pass # no parent toptenlist is OK

        # and child toptenlists, if any
        toptenitem_ids = [o.id for o in my_toptenlist.toptenitem.all()]

        try:
            child_toptenlists = TopTenList.objects.filter(parent_toptenitem__in=toptenitem_ids)

        except AttributeError:
            pass

        try:
            child_toptenlist_ids = [o.id for o in child_toptenlists]
            pk_toptenlist += child_toptenlist_ids

        except AttributeError:
            pass # we don't mind no child toptenlists

        # can view public toptenlists and toptenlists the user created
        if self.request.user.is_authenticated:
            return TopTenList.objects.filter(pk__in=pk_toptenlist).filter(
                Q(created_by=self.request.user) | 
                Q(is_public=True)
            )

        return TopTenList.objects.filter(pk__in=pk_toptenlist).filter(is_public=True)


class TopTenItemViewSet(viewsets.ModelViewSet):
    """
    Although toptenitems are retrieved as part of a toptenlist request, they are edited through this viewset
    """
    permission_classes = [IsOwnerOrReadOnly, HasVerifiedEmail]
    model = TopTenItem
    serializer_class = TopTenItemSerializer

    def get_queryset(self):
        # can view toptenitems belonging to public toptenlists and toptenlists the user created
        if self.request.user.is_authenticated:
            return TopTenItem.objects.filter(
                Q(toptenlist__created_by=self.request.user) | 
                Q(toptenlist__is_public=True)
            )

        return TopTenItem.objects.filter(toptenlist__is_public=True)

    @detail_route(methods=['patch'])
    def moveup(self, request, pk=None):

        if self.request.user.is_authenticated:
            # find the toptenitem to move up
            toptenitem = TopTenItem.objects.get(pk=pk)       
            toptenitem_order = toptenitem.order
            parent_toptenlist = toptenitem.toptenlist_id # note 'toptenlist_id' not 'toptenlist'

            if toptenitem.order == 1:
                return Response({'message': 'TopTenItem is already at top of TopTenList'}, status=status.HTTP_403_FORBIDDEN)

            # change the toptenitem order up one
            toptenitem.order = toptenitem.order - 1

            # find the existing toptenitem above
            toptenitem_above = TopTenItem.objects.get(toptenlist=parent_toptenlist, order=toptenitem_order-1)
            # and change its order down one
            toptenitem_above.order = toptenitem_order

            toptenitem.save()
            toptenitem_above.save()

            # return the new toptenitems so the UI can update
            toptenitems = [toptenitem, toptenitem_above]

            serializer = TopTenItemSerializer(toptenitems, many=True)

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
    Search for toptenlists and toptenitems by name
    """
    pagination_class = LimitPagination
    filter_backends = (filters.SearchFilter,)
    search_fields = ('name',)

    def get_querylist(self):
        toptenlist_query_set = {'queryset': TopTenList.objects.all(), 'serializer_class': TopTenListSerializer}
        toptenitem_query_set = {'queryset': TopTenItem.objects.all().exclude(name=''), 'serializer_class': TopTenItemSerializer}

        # authenticated user can view public toptenlists and toptenlists the user created
        # and toptenitems belonging to those toptenlists
        if self.request.user.is_authenticated:
            toptenlist_query_set['queryset'] = toptenlist_query_set['queryset'].filter(
                Q(created_by=self.request.user) |
                Q(is_public=True)
            )
            toptenitem_query_set['queryset'] = toptenitem_query_set['queryset'].filter(
                Q(toptenlist__created_by=self.request.user) |
                Q(toptenlist__is_public=True)
            )

        # unauthenticated user can view public toptenlists
        # and toptenitems belonging to those toptenlists
        else:
            toptenlist_query_set['queryset'] = toptenlist_query_set['queryset'].filter(is_public=True)
            toptenitem_query_set['queryset'] = toptenitem_query_set['queryset'].filter(toptenlist__is_public=True)

        querylist = [
            toptenlist_query_set,
            toptenitem_query_set,
        ]

        return querylist
