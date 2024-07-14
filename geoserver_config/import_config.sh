#!/bin/bash

# This process will apply the Data Source followed by the Layer configuration for each
# Transportation, Power Plants, and Shapes

SOURCE_URL="http://localhost:8080/geoserver"
AUTH="admin:geoserver"
WORKSPACE="ne"
OUT_DIR="geoserver_configs"
TARGET_URL="http://localhost:8080/geoserver"

# TRANSMISSION LINE CONFIG
DATASOURCE_NAME_TRANSMISSION="Transmission_Lines"
LAYER_NAME_TRANSMISSION="Electric_Power_Transmission_Lines_A"

# Apply Data Source
curl -u $AUTH -X POST -H "Content-Type: application/xml" -d @$OUT_DIR/$DATASOURCE_NAME_TRANSMISSION.xml "$TARGET_URL/rest/workspaces/$WORKSPACE/datastores"

# Apply Layer
curl -u $AUTH -X POST -H "Content-Type: application/xml" -d @$OUT_DIR/$LAYER_NAME_TRANSMISSION.xml "$TARGET_URL/rest/workspaces/$WORKSPACE/datastores/$DATASOURCE_NAME_TRANSMISSION/featuretypes" -v

DATASOURCE_NAME_POWER_PLANT="Power_Plant_Information"
LAYER_NAME_POWER_PLANT="Power_Plants"

# Apply Data Source
curl -u $AUTH -X POST -H "Content-Type: application/xml" -d @$OUT_DIR/$DATASOURCE_NAME_POWER_PLANT.xml "$TARGET_URL/rest/workspaces/$WORKSPACE/datastores"

# Apply Layer
curl -u $AUTH -X POST -H "Content-Type: application/xml" -d @$OUT_DIR/$LAYER_NAME_POWER_PLANT.xml "$TARGET_URL/rest/workspaces/$WORKSPACE/datastores/$DATASOURCE_NAME_POWER_PLANT/featuretypes" -v

DATASOURCE_NAME_STATE_MAP=United_States_Map
LAYER_NAME_STATE_MAP=States_shapefile

# Apply Data Source
curl -u $AUTH -X POST -H "Content-Type: application/xml" -d @$OUT_DIR/$DATASOURCE_NAME_STATE_MAP.xml "$TARGET_URL/rest/workspaces/$WORKSPACE/datastores"

# Apply Layer
curl -u $AUTH -X POST -H "Content-Type: application/xml" -d @$OUT_DIR/$LAYER_NAME_STATE_MAP.xml "$TARGET_URL/rest/workspaces/$WORKSPACE/datastores/$DATASOURCE_NAME_STATE_MAP/featuretypes" -v
