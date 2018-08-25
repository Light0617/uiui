# DOCKER-VERSION 1.2.0
FROM rdocker.mcp.com:6000/hid-base-centos-7.1

EXPOSE 8080

ENV http_proxy http://rproxy.mcp.com:3128
ENV https_proxy http://rproxy.mcp.com:3128

#Install tar
RUN yum install -y tar && \
    yum install -y wget

# Download Apache Tomcat 7
RUN cd /tmp;wget http://eng.panama.hcp.mcp.com/rest/tools/apache-tomcat-7.0.57.gz

# untar and move to proper location
RUN cd /tmp;tar xvf apache-tomcat-7.0.57.gz
RUN cd /tmp;mv apache-tomcat-7.0.57 /opt/tomcat7
RUN chmod -R 755 /opt/tomcat7

# Remove all files in webapps
RUN rm -rf /opt/tomcat7/webapps/*

# Remove default server.xml
RUN rm -f /opt/tomcat7/conf/server.xml

# Add custom server.xml
ADD server.xml /opt/tomcat7/conf/server.xml

# Insert ui War into correct location
ADD dist/*.war /opt/tomcat7/webapps/ROOT.war

COPY docker-files/start.bash /usr/local/bin/start.bash

CMD ["start.bash"]
