#!/bin/bash
set -e

# use to reference other scripts in the same directory as this one
my_dir=`dirname $0`

# load environment variables: SERVER
. $my_dir/.env

### Configuration ###
SOURCE=$HOME"/Web tutorials/mytoptens/mytoptens"

echo $DESTINATION
# build app
echo "building app..."
./buildapp.sh

echo "compressing app update..."
touch mytoptens-app-update.tar.gz
tar --exclude mytoptens-app-update.tar.gz --exclude deployapp.sh --exclude startapp.sh --exclude test_server.sh --exclude deploy --exclude .git --exclude .gitignore --exclude frontend/node_modules -zcf mytoptens-app-update.tar.gz ./ 

# copy zipped app update onto the app user's folder on the server
echo "copying zipped app update onto server..."
scp mytoptens-app-update.tar.gz "$DESTINATION":~/

# run the deployment script on the server
echo "running serverscript.sh on server to deploy app..."
ssh  $DESTINATION 'bash -s' < $my_dir/serverscript.sh
