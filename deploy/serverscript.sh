#!/bin/bash

### Configuration ###
# temporary location of app update files
UPDATE_DIR=$HOME/

# app location
APP_DIR="/var/www/mytoptens/"
PROJECT_DIR="mytoptens"
FRONTEND_DIR="frontend"

cd $APP_DIR

# unzip app update files to where Passenger needs them
echo "unzipping new app files into /var/www/mytoptens..."
tar -zxvf "$UPDATE_DIR"/mytoptens-app-update.tar.gz
rm -rf "$UPDATE_DIR"/mytoptens-app-update.tar.gz

### Activate Python virtual environment ###
source venv38/bin/activate

cd $PROJECT_DIR

### update Python requirements ###
pip3 install -r requirements.txt

### load secret environment variables required by manage.py
. .env

### make and run migrations ###
# note that at present, migrations are created on the dev machine and copied to the live server. The line below is there for reference in case we need to revert.
# ./manage.py makemigrations --settings=djangoproject.settings.production
echo "make and run migrations"
./manage.py migrate --settings=djangoproject.settings.production

echo "update node packages"
### update node packages ###
cd $FRONTEND_DIR
npm prune
npm install

### restart app ###
passenger-config restart-app $APP_DIR
