from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = ['127.0.0.1', 'localhost', 'mytoptens.com', 'www.mytoptens.com']

REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    'anon': '100/day',
    'user': '10/minute'
}

DEFAULT_FROM_EMAIL = 'My Top Tens <noreply@mytoptens.com>'
