#!/bin/bash

# allow the script to be found even if you're not running initiate.sh from the same directory
my_dir=`dirname $0`
ssh mytoptens@178.62.85.245 'bash -s' < $my_dir/serverscript.sh
