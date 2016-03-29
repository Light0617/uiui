#!/bin/bash
DOCKER_IMAGE=$1;
DOCKER_TAG=$2;

docker build -t ${DOCKER_IMAGE} .;
docker tag -f ${DOCKER_IMAGE} ${DOCKER_IMAGE}:${DOCKER_TAG};
docker push ${DOCKER_IMAGE}:${DOCKER_TAG};
docker rmi -f ${DOCKER_IMAGE}:${DOCKER_TAG};