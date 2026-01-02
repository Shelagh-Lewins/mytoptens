#!/usr/bin/env bash

# Activate virtual environment
source venv/bin/activate

# load secret settings as environment variables
# note . ./ below. This makes environment variables available in shell
. .env

python manage.py shell
