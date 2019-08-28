# users/urls.py
from django.urls import include, path

from . import api
#app_name = 'users' # namespace for reverse
urlpatterns = [
    path('', api.UserListView.as_view(), name='UsersPath'),
]