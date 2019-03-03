#!/usr/bin/env bash

# load secret settings as environment variables
# note . ./ below. This makes environment variables available in shell
. .env

# run django with development settings
./manage.py test --settings=djangoproject.settings.development
