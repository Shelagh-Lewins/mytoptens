#!/usr/bin/env bash

npm run build --prefix frontend
rm -rf ./assets
mv ./frontend/build ./assets

. .env
yes yes | ./manage.py collectstatic --settings=djangoproject.settings.development

pip freeze > requirements.txt
