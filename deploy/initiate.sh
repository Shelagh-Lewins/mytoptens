#!/bin/bash

SOURCE=$HOME"/Web tutorials/mytoptens/mytoptens"
DESTINATION="mytoptens@178.62.85.245:~/"
OPTIONS=( --protect-args -arv --filter=":- .gitignore")

# works
rsync -arv  --filter=":- .gitignore" "$SOURCE" $DESTINATION

# doesn't work
# rsync "${OPTIONS[@]}" $SOURCE "${DESTINATION_HOST}":"${DESTINATION}"

# works
# rsync -arv  --filter=":- .gitignore" ~/Web\ tutorials/mytoptens/mytoptens mytoptens@178.62.85.245:~/

# doesn't work


# allow the script to be found even if you're not running initiate.sh from the same directory
my_dir=`dirname $0`
#ssh mytoptens@178.62.85.245 'bash -s' < $my_dir/serverscript.sh
