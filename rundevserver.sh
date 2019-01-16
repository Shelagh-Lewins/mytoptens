#!/usr/bin/env bash

# load secret settings as environment variables
# note . ./ below. This makes environment variables available in shell
. .env

# run django server with development server
./manage.py runserver --settings=djangoproject.settings.development
