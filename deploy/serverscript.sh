#!/bin/bash

### Configuration ###
# temporary location of app update files
UPDATE_DIR=$HOME/"mytoptens"

# app location
APP_DIR="/var/www/mytoptens/"
PROJECT_DIR="mytoptens"
FRONTEND_DIR="frontend"

# copy app update files to where Passenger needs them
echo "copying new app files into /var/www/mytoptens..."
rsync -arv  --delete --filter=":- .gitignore" "$UPDATE_DIR" "$APP_DIR"/

### Activate Python virtual environment ###
cd $APP_DIR
source venv35/bin/activate

cd $PROJECT_DIR

### update Python requirements ###
pip install -r requirements.txt

### load secret environment variables required by manage.py
. .env

### make and run migrations ###
# note that at present, migrations are created on the dev machine and copied to the live server. The line below is there for reference in case we need to revert.
# ./manage.py makemigrations --settings=djangoproject.settings.production
./manage.py migrate --settings=djangoproject.settings.production

### update node packages ###
cd $FRONTEND_DIR
npm prune
npm install

### restart app ###
passenger-config restart-app $APP_DIR
