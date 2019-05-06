#!/bin/bash

### Configuration ###
SOURCE=$HOME"/Web tutorials/mytoptens/mytoptens"
DESTINATION="mytoptens@178.62.85.245:~/"

# build app
echo "building app..."
./buildapp.sh

# remove any old app update files from the server
# force a complete refresh of all files instead of relying on rsync to detect changes
echo "deleting old update files from server..."
ssh mytoptens@178.62.85.245 rm -f -r mytoptens

# copy the new app update files onto the server
echo "copying new update files onto server..."
rsync -arv  --filter=":- .gitignore" "$SOURCE" "$DESTINATION"

# run the deployment script on the server
# allow the script to be found even if you're not running initiate.sh from the same directory
echo "deploying app on server..."
my_dir=`dirname $0`
ssh mytoptens@178.62.85.245 'bash -s' < $my_dir/serverscript.sh
