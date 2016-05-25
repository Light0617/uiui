#!/bin/bash
cd $(cd "$(dirname "$0")" && pwd)

internal_docker_repo=${1}
container_name=${2}
tag=${3}

echo "internal_docker_repo = ${internal_docker_repo}"
echo "container_name = ${container_name}"
echo "tag = ${tag}"

image="${internal_docker_repo}/${container_name}:${tag}"

cd ../../
docker build -t ${image} .
docker push ${image}
docker rmi -f ${image}