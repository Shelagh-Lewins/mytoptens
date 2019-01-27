from rest_framework import viewsets, permissions
from .models import List, Item
from .serializers import ListSerializer, ItemSerializer
from django.db.models import Q


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # handle permissions based on method
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user

        if hasattr(obj, 'list'):
            if hasattr(obj.list, 'created_by'):
                return obj.list.created_by == request.user


class ListIsOwnerOrReadOnly(permissions.BasePermission):
    """Note typos in Stackoverflow post
    def get_queryset(self):
        if self.request.user.is_authenticated

    needs colon after is_authenticated

    permission_classes = [IsOwnerOrReadyOnly]
    should be ReadOnly not ReadyOnly

    why list__is_public__exact in first line of queryset, but list__is_public in second?

    https://stackoverflow.com/questions/9963200/in-django-filter-statement-whats-the-difference-between-exact-and-equal-sign
    """
    def has_object_permission(self, request, view, obj):
        # handle permissions based on method
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Instance's parent list must have an attribute named `created_by`.
        return obj.list.created_by == request.user


class ListViewSet(viewsets.ModelViewSet):
    """
    ViewSet for lists.
    """

    permission_classes = [IsOwnerOrReadOnly]
    model = List
    serializer_class = ListSerializer

    def get_queryset(self):
        # can view public lists and lists the user created
        if self.request.user.is_authenticated:
            return List.objects.filter(
                Q(created_by=self.request.user) | 
                Q(is_public=True)
            )

        return List.objects.filter(is_public=True)

    def pre_save(self, obj):
        obj.created_by = self.request.user


class ListBySlugViewSet(viewsets.ModelViewSet):
    """
    Find a list by slug.
    """
    permission_classes = [IsOwnerOrReadOnly]
    model = List
    serializer_class = ListSerializer

    def get_queryset(self):
        # can view public lists and lists the user created
        if self.request.user.is_authenticated:
            return List.objects.filter(slug=self.request.query_params.get('slug', None)).filter(
                Q(created_by=self.request.user) | 
                Q(is_public=True)
            )

        return List.objects.filter(slug=self.request.query_params.get('slug', None)).filter(is_public=True)


class ItemViewSet(viewsets.ModelViewSet):
    permission_classes = [IsOwnerOrReadOnly]
    model = Item
    serializer_class = ItemSerializer

    def get_queryset(self):
        # can view items belonging to public lists and lists the usesr created
        if self.request.user.is_authenticated:
            return Item.objects.filter(
                Q(list__created_by=self.request.user) | 
                Q(list__is_public__exact=True)
            )

        return Item.objects.filter(list__is_public=True)

