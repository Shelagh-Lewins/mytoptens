#!/bin/bash

### Configuration ###
# temporary location of app update files
UPDATE_DIR=$HOME/

# app location
APP_DIR="/var/www/mytoptens/"
PROJECT_DIR="mytoptens"

# Switch to app directory as mytoptens user
cd $APP_DIR

### Activate Python virtual environment ###
source venv/bin/activate

cd $PROJECT_DIR

# unzip app update files to where Passenger needs them
echo "unzipping new app files into /var/www/mytoptens/mytoptens..."
tar -zxvf "$UPDATE_DIR"/mytoptens-app-update.tar.gz --overwrite
rm -rf "$UPDATE_DIR"/mytoptens-app-update.tar.gz

### update Python requirements ###
pip install -r requirements.txt

### Create/update database.cnf ###
echo "Creating database.cnf..."
cat > database.cnf << 'EOF'
[client]
database = mytoptens
user = mytoptens_user
password = niptacklefloodbag
host = localhost
port = 3306
default-character-set = utf8mb4
EOF

### load secret environment variables required by manage.py
. .env

### make and run migrations ###
echo "make and run migrations"
python manage.py migrate --settings=djangoproject.settings.production

### restart app ###
echo "Restarting Passenger app..."
mkdir -p tmp 2>/dev/null || true
touch tmp/restart.txt 2>/dev/null || echo "Could not create restart.txt, will restart on next request"
echo "App restart triggered"
