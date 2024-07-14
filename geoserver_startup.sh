#!/bin/sh

# SET THE GEOSERVER DATA DIRECTORY
# This is the directory where GeoServer stores its configuration and data

export GEOSERVER_DATA_DIR="/usr/share/geoserver/data_dir"

# SET GEOSERVER HOME DIRECTORY
# This is the directory where GeoServer is installed

export GEOSERVER_HOME="/usr/share/geoserver"

# Start GeoServer in the background
/usr/share/geoserver/bin/startup.sh &

# Wait for GeoServer to be fully up and running
# This is a simplistic check; you might need a more robust check depending on your setup
while ! nc -z localhost 8080; do
    sleep 1 # wait for 1 second before check again
done

# Now that GeoServer is running, execute the script
sh import_config.sh

# Keep the container running by waiting on the GeoServer process
wait
