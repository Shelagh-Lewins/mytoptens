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

# remove old app update files from the server
# this forces a complete refresh of all files instead of relying on rsync to detect changes
echo "deleting old update files from server..."
ssh $DESTINATION rm -f -r mytoptens

# copy new app update files onto the server
echo "copying new update files onto server..."
rsync -arv  --filter=":- .gitignore" "$SOURCE" "$DESTINATION"":~/"

# run the deployment script on the server
echo "deploying app on server..."
ssh  $DESTINATION 'bash -s' < $my_dir/serverscript.sh
