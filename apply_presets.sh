#!/bin/bash -e


if [ -z "$1" ]; then
  echo >&2 "please specify presets folder"
  exit 2
fi

if [ -z "$2" ]; then
  echo >&2 "please specify the URL of the transcoding-api"
  exit 2
fi


presets=$(echo $1)
endpoint=$(echo $2 | sed -e 's;/*$;;')

for f in $presets/*.json; do
  curl -X POST -d @${f} ${endpoint}/presets;
done
