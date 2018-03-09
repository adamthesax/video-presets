#!/bin/bash -e

function join() {
  local IFS=","
  echo "$*"
}

function array_to_json() {
  items=()
  for item in $@; do
    items+=('"'$item'"')
  done

  joined=$(join ${items[@]})
  echo "[$joined]"
}

if [ -z "$1" ]; then
  echo >&2 "please specify presets folder"
  exit 2
fi

if [ -z "$2" ]; then
  echo >&2 "please specify the URL of the transcoding-api"
  exit 2
fi

if [ -z "$3" ]; then
  echo >&2 "please specify at least one provider"
  exit 2
fi

arr=("$@")
raw_providers="${arr[@]:2}"
json_providers=$(array_to_json ${raw_providers[@]})

presets=$(echo $1)
endpoint=$(echo $2 | sed -e 's;/*$;;')

for f in $presets/*.json; do
  cat $f | jq -r '.providers = '$json_providers | curl -XPOST -d @- ${endpoint}/presets
done
