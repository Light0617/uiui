#!/bin/bash

set -e

service-ping rainier 8080

/opt/tomcat7/bin/catalina.sh run