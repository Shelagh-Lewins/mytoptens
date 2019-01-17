#!/usr/bin/env bash

# load secret settings as environment variables
# note . ./ below. This makes environment variables available in shell
. .env

# run django with development settings
./manage.py makemigrations --settings=djangoproject.settings.development

./manage.py migrate --settings=djangoproject.settings.development