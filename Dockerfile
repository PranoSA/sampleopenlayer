#  Geoserver docker 
#  Version: 1.0

# FRom my geoserver base image
FROM pcadler/geoserver-build:geoserver-2.25.2
RUN apk add --no-cache curl wget
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
