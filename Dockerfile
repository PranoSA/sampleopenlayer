#  Geoserver docker 
#  Version: 1.0


# Java 17 base image 
FROM openjdk:17-jdk-alpine

#Install curl and wget
RUN apk add --no-cache curl wget

# How to get geoserver download link
COPY geoserver-2.25.2-bin.zip /
RUN apk add --no-cache unzip
RUN unzip geoserver-2.25.2-bin.zip -d /usr/share/geoserver
RUN rm geoserver-2.25.2-bin.zip
RUN echo "export GEOSERVER_HOME=/usr/share/geoserver" >> ~/.profile
RUN . ~/.profile
RUN chmod +x /usr/share/geoserver/bin/startup.sh
RUN mkdir geoserver_config
RUN rm /usr/share/geoserver/webapps/geoserver/WEB-INF/lib/marlin-0.9.3.jar

ARG CACHEBUSTER=unknown
COPY geoserver_config/ /geoserver_config
RUN ls -lid geoserver_config

WORKDIR /geoserver_config 
RUN chmod +x download_data.sh
RUN  sh download_data.sh 


# THIS NEEDS TO BE UP AND RUNNING FIRST 
COPY geoserver_startup.sh . 
RUN chmod +x geoserver_startup.sh

ENV GEOSERVER_DATA_DIR="/usr/share/geoserver/data_dir"
ENV GEOSERVER_HOME="/usr/share/geoserver"


#RUN  sh export_config.sh
#CMD ["/usr/share/geoserver/bin/startup.sh"]
ENTRYPOINT [ "sh" , "geoserver_startup.sh" ]
#CMD [ "sh", "geoserver_startup.sh" ]

# COPY FROM geoserver_config to /geoserver_config
# Then run import_configs.sh from that directory
