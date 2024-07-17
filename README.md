# Structure

## geoserver_config

geoserver_config has scripts export_config.sh, which downloads the necessary layer and datastore configuration from the running
geoserver (can also be used if you want to adjust these layers), and stores them in geoserver_configs folder

download_data.sh downloads the shapefiles necessary for the datastores and layers, and stores them in the data directory for geoserver.

import_config.sh takes the XML configuration in geoserver_config and reuploads them to a running geoserver instance at localhost:8080.

## dist

dist is the static outputs from webpack, I included this so webpack and a proper npm version isn't necessary

## server

server code to proxy requests to geoserver (get around CORS) starting with /api and serving the static files from /dist.

## src

source code to build the static web assets files using webpack.

# Docker Setup

This project is 2 different processes designed to run locally.

You will need docker installed, and open ports 3000 and 8080.

### docker run -p 8080:8080 pcadler/geoserver-deploy:master

### docker run --network=host pcadler/transmission-express:master

now visit

http://localhost:3000

# Linux Setup

### Have Java 11 or 17 installed

### Have npm installed, and run
### npm install

### Geoserver
Install Geoserver ( The Platform Independent Binary, that uses Java) at default location /usr/share/geoserver, leave default data_dir as is (/usr/share/geoserver/data_dir).

Change Directory into geoserver_configs,

### cd geoserver_config

and run
### ./download_data.sh

to download the necessary shapefiles ( The US States Map, Transmission Lines Map, and Power Plants Map)

Now run

### ./import_config.sh

This will build the datastores and the layers on top of them that the client will request from.

Change Directory back to project root
cd ..

If you want to build the static assets, run

### npx webpack --config webpack.config.js

Now, start the process using

### server/index.js
