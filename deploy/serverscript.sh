#!/bin/bash

### Configuration ###
APP_DIR=/var/www/mytoptens/
PROJECT_DIR=mytoptens
FRONTEND_DIR=frontend

### Activate Python virtual environment ###
cd $APP_DIR
source venv35/bin/activate

### get new code from GitHub ###
cd $PROJECT_DIR
git fetch origin
git reset --hard origin/master

### update Python requirements ###
pip install -r requirements.txt

### load secret environment variables required by manage.py
. .env

### make and run migrations ###
# ./manage.py makemigrations --settings=djangoproject.settings.production
./manage.py migrate --settings=djangoproject.settings.production

### update node packages ###
cd $FRONTEND_DIR
npm prune
npm install

### restart app ###
passenger-config restart-app $APP_DIR
