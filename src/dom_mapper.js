import * as ol from 'ol';
import { powerPlantClusterLayer, powerPlantHeatMapLayer } from './power_plants';
import { transformExtent } from 'ol/proj';
import { Map } from 'ol';
import { fromLonLat } from 'ol/proj';

import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { XYZ } from 'ol/source';
import WMTS from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { get as getProjection } from 'ol/proj';
import { getTopLeft, getWidth } from 'ol/extent';

const tileSize = 256;

var container = document.getElementById('popup'); // Adjust the ID to match your popup's container

const projection = getProjection('EPSG:3857');
const projectionExtent = projection.getExtent();
const size = getWidth(projectionExtent) / tileSize;
const resolutions = new Array(14);
const matrixIds = new Array(14);
for (var z = 0; z < 14; ++z) {
  // generate resolutions and matrixIds arrays for this WMTS
  resolutions[z] = size / Math.pow(2, z);
  matrixIds[z] = z;
}

for (let z = 0; z < 14; ++z) {
  matrixIds[z] = `EPSG:900913:${z}`;
}

console.log('Resolutions');
console.log(resolutions);

console.log('M atrix Ids');
console.log(matrixIds);

console.log('Top Left');
console.log(getTopLeft(projectionExtent));

const wmtsLayer = new TileLayer({
  source: new WMTS({
    url: 'http://localhost:3000/api/geoserver/gwc/service/wmts',
    layer: 'ne:States_shapefile',
    format: 'image/png',
    matrixSet: 'EPSG:900913',
    projection: 'EPSG:900913',
    tileSize,
    style: 'default',
    tileGrid: new WMTSTileGrid({
      origin: getTopLeft(projectionExtent),
      resolutions: resolutions,
      matrixIds: matrixIds,
    }),
    wrapX: true,
    style: '',
  }),
});

// http://localhost:8080/geoserver/gwc/service/wmts?REQUEST=GetCapabilities

//

// Initialize the Map
var map = new Map({
  // The ID of the map container
  layers: [
    /* new ol.layer.Tile({
      source: new ol.source.OSM(), // OpenStreetMap as the source
    }),*/
    /*new TileLayer({
      source: new OSM(),
    }),*/

    //add a WMTS using ne:States_shapefile from geoserver
    /* new TileLayer({
      source: new XYZ({
        url: 'http://localhost:3000/api/geoserver/gwc/service/tms/1.0.0/ne:States_shapefile@EPSG%3A900913@png/{z}/{x}/{-y}.png',
      }),
    }),*/
    wmtsLayer,
    //powerPlantClusterLayer,
    powerPlantHeatMapLayer,

    //clusterLayer,
    //heatMapLayer,
    //tranmissionLineLayer,
  ],
  //ol.proj.fromLonLat([-98.5795, 39.8283], 'EPSG:3857'),
  view: new ol.View({
    center: fromLonLat([-98.5795, 39.8283]), // Starting position [lon, lat]
    zoom: 4, // Initial zoom level
    projection: 'EPSG:3857',
  }),
});

// Create an overlay to anchor the popup to the map.
var overlay = new ol.Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250,
  },
});
map.setTarget('map');
//Add the overlay to the map
map.addOverlay(overlay);

export { overlay, map };
