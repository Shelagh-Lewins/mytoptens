from rest_framework import viewsets, permissions
from .models import List, Item
from .serializers import ListSerializer, ItemSerializer
from django.db.models import Q


class ListViewSet(viewsets.ModelViewSet):
    """
    ViewSet for lists. Before allowing any operation, the user's status is checked.

    Anybody can view a public list.
    A logged-in user can create lists.
    A logged-in user can view, edit and delete the lists they created.
    """
    permission_classes = [permissions.AllowAny, ]
    model = List
    serializer_class = ListSerializer

    def get_queryset(self):
        # restrict any method that can alter a record
        restricted_methods = ['POST', 'PUT', 'PATCH', 'DELETE']
        if self.request.method in restricted_methods:
            # if you are not logged in you cannot modify any list
            if not self.request.user.is_authenticated:
              return List.objects.none()

            # you can only modify your own lists
            # only a logged-in user can create a list and view the returned data
            return List.objects.filter(created_by=self.request.user)

        # GET method (view list) is available to owner and for public lists
        if self.request.method == 'GET':
          if not self.request.user.is_authenticated:
            return List.objects.filter(is_public__exact=True)

          return List.objects.filter(Q(created_by=self.request.user) | Q(is_public__exact=True))

        # explicitly refuse any non-handled methods
        return List.objects.none()

    def pre_save(self, obj):
        obj.created_by = self.request.user


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    permission_classes = [permissions.AllowAny, ]
    serializer_class = ItemSerializer
