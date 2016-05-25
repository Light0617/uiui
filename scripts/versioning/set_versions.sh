#!/bin/bash
cd $(cd "$(dirname "$0")" && pwd)

versionPath=../../version.txt
versionLatestPath=../../versionLatest.txt
buildPropertiesPath=../../build.properties

source "${buildPropertiesPath}"

echo "Setting end to: $1"
echo "latest version: ${version}.latest"


touch ${versionPath} || true
echo "${version}.$1" > ${versionPath}

touch ${versionLatestPath} || true
echo "${version}.latest" > ${versionLatestPath}

echo "Product version (version.txt): $(cat ${versionPath})"
