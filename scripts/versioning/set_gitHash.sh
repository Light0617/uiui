#!/bin/bash
cd $(cd "$(dirname "$0")" && pwd)

gitHashPath=../../gitHash.txt

touch ${gitHashPath} || true
echo $(git rev-parse HEAD) > ${gitHashPath}

echo "Git Hash: $(cat ${gitHashPath})"
