"""
WSGI config for djangoproject project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/2.1/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

# used to import environment variables
from os.path import join, dirname
from dotenv import load_dotenv
 
# Create .env file path.
# dotenv_path = join(dirname(__file__), '.env')
dotenv_path = join(dirname(dirname(__file__)), '.env')
 
# Load file from the path.
load_dotenv(dotenv_path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djangoproject.settings.production')

application = get_wsgi_application()
