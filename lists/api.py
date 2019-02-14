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

        if hasattr(obj, 'created_by_id'):
            return obj.created_by_id == request.user

        if hasattr(obj, 'list'):
            if hasattr(obj.list, 'created_by_id'):
                return obj.list.created_by_id == request.user

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
        # can view public lists and lists the user created
        if self.request.user.is_authenticated:
            return List.objects.filter(
                Q(created_by_id=self.request.user) | 
                Q(is_public=True)
            )

        return List.objects.filter(is_public=True)

    def pre_save(self, obj):
        obj.created_by_id = self.request.user


class ListBySlugViewSet(viewsets.ModelViewSet):
    """
    Find a list by slug.
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
                Q(created_by_id=self.request.user) | 
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
                Q(list__created_by_id=self.request.user) | 
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
