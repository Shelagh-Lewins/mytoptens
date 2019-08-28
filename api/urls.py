# api/urls.py
from django.urls import include, path, re_path
from django.contrib.auth import views
from django.views.generic.base import RedirectView
from .forms import SetPasswordFormCustom
from .serializers import PasswordResetViewCustom
from allauth.account.views import confirm_email

from users.api import EmailConfirmation


#full_string_regex = "(?P<key>[\s\d\w().+-_',:&]+)/$."
#app_name = 'myTopTens' # namespace for reverse

urlpatterns = [
    #url(r"^rest-auth/registration/account-confirm-email/(?P<key>[\s\d\w().+-_',:&]+)/$", confirm_email,
        #name="account_confirm_email"), # works. from https://github.com/Tivix/django-rest-auth/issues/290
    re_path(r'^rest-auth/registration/account-confirm-email/(?P<key>[-:\w]+)/$', confirm_email,
     name='account_confirm_email'),
    # seems to work but regex can apparently fail. However fails with the github recommended regex, invalid syntax
        # https://stackoverflow.com/questions/48390749/reverse-for-account-email-verification-sent-not-found-account-email-verifica
    path('rest-auth/password/reset/', PasswordResetViewCustom.as_view()), # must come before rest-auth includes or custom view is not used
    path('rest-auth/', include('rest_auth.urls')),
    path('rest-auth/registration/', include('rest_auth.registration.urls')),
    path('users/', include('users.urls'), name='UsersURLS'),
    path('reset/<uidb64>/<token>/',
    	views.PasswordResetConfirmView.as_view(template_name='account/password_reset_confirm.html', form_class=SetPasswordFormCustom),
    	name='password_reset_confirm'),
    path('reset/done/', views.PasswordResetCompleteView.as_view(template_name='account/password_reset_complete.html'),
    	name='password_reset_complete'),

    path('content/', include('toptenlists.endpoints')),
    # content is a path for toptenlists, toptenitems etc found in the toptenlists app


    path('sendconfirmationemail/', EmailConfirmation.as_view(), name='send-email-confirmation')
]


