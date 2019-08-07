#!/bin/bash
# make sure you always put $f in double quotes to avoid any nasty surprises i.e. "$f"
for f in $*
do
  echo "A migrar $f ..."
  node migra-classe-2.js "$f" 
done

