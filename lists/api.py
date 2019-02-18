from rest_framework import viewsets, permissions
from rest_framework.decorators import detail_route
from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import APIException

from .models import List, Item
from .serializers import ListSerializer, ItemSerializer
from django.db.models import Q

from rest_flex_fields import FlexFieldsModelViewSet

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

        if hasattr(obj, 'list'):
            if hasattr(obj.list, 'created_by'):
                return obj.list.created_by == request.user

class HasVerifiedEmail(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user.is_authenticated:
            return False

        if request.user.email_verified:
            return True

        return False


# class ListViewSet(viewsets.ModelViewSet):
class ListViewSet(FlexFieldsModelViewSet):
    """
    ViewSet for lists.
    """
    permission_classes = [IsOwnerOrReadOnly, HasVerifiedEmail]
    model = List
    serializer_class = ListSerializer
    permit_list_expands = ['item']

    def get_queryset(self):
        # unauthenticated user can only view public lists
        queryset = List.objects.filter(is_public=True)

        # authenticated user can view public lists and lists the user created
        if self.request.user.is_authenticated:
            queryset = List.objects.filter(
                Q(created_by=self.request.user) | 
                Q(is_public=True)
            )

        # allow filter by URL parameter created_by
        created_by = self.request.query_params.get('created_by', None)

        if created_by is not None:
            queryset = queryset.filter(created_by=created_by)

        return queryset

    def pre_save(self, obj):
        obj.created_by = self.request.user

    def perform_update(self, serializer):
        # housekeeping if parent_item is changed
        parent_item_id = serializer.validated_data.get('parent_item_id', None)

        # check parent item exists
        if parent_item_id is not None:
            item = Item.objects.get(pk=parent_item_id)

            if not item: # if the item isn't found, don't save the new value
                raise APIException("Unable to set parent_item. No item found with id: " + parent_item_id)

            # set any Lists with this parent_item to null parent_item
            # an item can only have one child list
            print(List.objects.filter(parent_item_id=parent_item_id))
            List.objects.filter(parent_item_id=parent_item_id).update(parent_item_id=None)
 
        serializer.save()


class ListBySlugViewSet(viewsets.ModelViewSet):
    """
    Find a list by slug.
    Return the list itself and associated child / parent lists for navigation
    """
    permission_classes = [IsOwnerOrReadOnly, HasVerifiedEmail]
    model = List
    serializer_class = ListSerializer

    def get_queryset(self):
        my_list = List.objects.filter(slug=self.request.query_params.get('slug', None)).first()

        # we want the list itself
        pk_list = [my_list.id]

        # then we want the parent list, if any
        try:
            parent_item = Item.objects.filter(id=my_list.parent_item.id).first()
            pk_list.append(parent_item.list.id)

        except AttributeError:
            pass # we don't mind no parent list

        # and child lists, if any
        item_ids = [o.id for o in my_list.item.all()]

        try:
            child_lists = List.objects.filter(parent_item__in=item_ids)

        except AttributeError:
            pass

        try:
            child_list_ids = [o.id for o in child_lists]
            pk_list += child_list_ids

        except AttributeError:
            pass # we don't mind no child lists

        # can view public lists and lists the user created
        if self.request.user.is_authenticated:
            return List.objects.filter(pk__in=pk_list).filter(
                Q(created_by=self.request.user) | 
                Q(is_public=True)
            )

        return List.objects.filter(pk__in=pk_list).filter(is_public=True)


class ItemViewSet(viewsets.ModelViewSet):
    permission_classes = [IsOwnerOrReadOnly, HasVerifiedEmail]
    model = Item
    serializer_class = ItemSerializer

    def get_queryset(self):
        # can view items belonging to public lists and lists the user created
        if self.request.user.is_authenticated:
            return Item.objects.filter(
                Q(list__created_by=self.request.user) | 
                Q(list__is_public=True)
            )

        return Item.objects.filter(list__is_public=True)

    @detail_route(methods=['patch'])
    def moveup(self, request, pk=None):

        if self.request.user.is_authenticated:
            # find the item to move up
            item = Item.objects.get(pk=pk)       
            item_order = item.order
            parent_list = item.list_id # note 'list_id' not 'list'

            if item.order == 1:
                return Response({'message': 'Item is already at top of list'}, status=status.HTTP_403_FORBIDDEN)

            # change the item order up one
            item.order = item.order - 1

            # find the existing item above
            item_above = Item.objects.get(list=parent_list, order=item_order-1)
            # and change its order down one
            item_above.order = item_order

            item.save()
            item_above.save()

            # return the new items so the UI can update
            items = [item, item_above]

            serializer = ItemSerializer(items, many=True)

            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(status=status.HTTP_401_UNAUTHORIZED)

    def perform_update(self, serializer):
        # do not allow order to be changed
        if serializer.validated_data.get('order', None) is not None:
            raise APIException("Item order may not be changed. Use moveup instead.")
 
        serializer.save()
