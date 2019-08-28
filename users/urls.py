# users/urls.py
from django.urls import include, path

from . import api

urlpatterns = [
    path('', api.UserListView.as_view(), name='UsersPath'),
]