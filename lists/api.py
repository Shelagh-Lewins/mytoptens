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

        # Instance must have an attribute named `created_by`.
        return obj.created_by == request.user


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
    # permission_classes = [permissions.AllowAny, ]
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
        # restrict any method that can alter a record
        #restricted_methods = ['POST', 'PUT', 'PATCH', 'DELETE']
        #if self.request.method in restricted_methods:
            # if you are not logged in you cannot modify any list
            #if not self.request.user.is_authenticated:
              #return List.objects.none()

            # you can only modify your own lists
            # only a logged-in user can create a list and view the returned data
            #return List.objects.filter(created_by=self.request.user)

        # GET method (view list) is available to owner and for public lists
        #if self.request.method == 'GET':
          #if not self.request.user.is_authenticated:
            #return List.objects.filter(is_public__exact=True)

          #return List.objects.filter(Q(created_by=self.request.user) | Q(is_public__exact=True))

        # explicitly refuse any non-handled methods
        #return List.objects.none()

    def pre_save(self, obj):
        obj.created_by = self.request.user


class ListBySlugViewSet(viewsets.ModelViewSet):
    """
    Find a list by slug. The list is only returned if the user is authorized to see it.

    Only get, head are permitted.
    """
    #permission_classes = [IsOwnerOrReadOnly]
    permission_classes = [permissions.AllowAny, ]
    model = List
    serializer_class = ListSerializer
    #http_method_names = ['get', 'head']
    def get_queryset(self):
        # can view public lists and lists the user created
        if self.request.user.is_authenticated:
            return List.objects.filter(slug=self.request.query_params.get('slug', None)).filter(
                Q(created_by=self.request.user) | 
                Q(is_public=True)
            )

        return List.objects.filter(slug=self.request.query_params.get('slug', None)).filter(is_public=True)

    #def get_queryset(self):
        #if not self.request.user.is_authenticated:
            #return List.objects.filter(slug__exact=self.request.query_params.get('slug', None)).filter(is_public__exact=True)

        #return List.objects.filter(slug__exact=self.request.query_params.get('slug', None)).filter(Q(created_by=self.request.user) | Q(is_public__exact=True))

class ItemViewSet(viewsets.ModelViewSet):
    permission_classes = [ListIsOwnerOrReadOnly]
    model = Item
    serializer_class = ItemSerializer

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Item.objects.filter(
                Q(list__created_by=self.request.user) | 
                Q(list__is_public__exact=True)
            )

        return Item.objects.filter(list__is_public=True)


    #permission_classes = [permissions.AllowAny, ]
    #model = Item
    #serializer_class = ItemSerializer

    #def get_queryset(self):
        # restrict any method that can alter a record
        #restricted_methods = ['POST', 'PUT', 'PATCH', 'DELETE']
        #if self.request.method in restricted_methods:
            # if you are not logged in you cannot modify any list
            #if not self.request.user.is_authenticated:
              #return Item.objects.none()

            # you can only modify your own lists
            # only a logged-in user can create a list and view the returned data
            # return Item.objects.filter(created_by=self.request.user)
            #return Item.objects.all()

        # GET method (view item) is available to owner and for items in public lists
        #if self.request.method == 'GET':
          #if not self.request.user.is_authenticated:
            #return Item.objects.filter(is_public__exact=True)
            #return Item.objects.all()

          #return Item.objects.filter(Q(created_by=self.request.user) | Q(is_public__exact=True))

        # explicitly refuse any non-handled methods
        #return Item.objects.none()

