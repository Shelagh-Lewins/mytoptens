from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = ['127.0.0.1', 'localhost', 'mytoptens.com', 'www.mytoptens.com', 'mytoptens.shelaghlewins.com', '165.232.106.236']

REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    'anon': '500/day',
    'user': '45/minute'
}

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

DEFAULT_FROM_EMAIL = 'My Top Tens <noreply@mytoptens.com>'
