#!/usr/bin/env bash

# load secret settings as environment variables
# note . ./ below. This makes environment variables available in shell
. .env

# build the frontend
npm run build --prefix frontend
rm -rf ./assets
mv ./frontend/build ./assets


# collect static files to production location
yes yes | ./manage.py collectstatic --settings=djangoproject.settings.development

# record python dependencies
pip freeze > requirements.txt

# make and apply database migrations
./migrations.sh
