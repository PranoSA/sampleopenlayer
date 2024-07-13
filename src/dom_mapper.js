import * as ol from 'ol';
import { powerPlantClusterLayer, powerPlantHeatMapLayer } from './power_plants';
import { transformExtent } from 'ol/proj';
import { Map } from 'ol';
import { fromLonLat } from 'ol/proj';

import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

var container = document.getElementById('popup'); // Adjust the ID to match your popup's container

// Initialize the Map
var map = new Map({
  // The ID of the map container
  layers: [
    /* new ol.layer.Tile({
      source: new ol.source.OSM(), // OpenStreetMap as the source
    }),*/
    new TileLayer({
      source: new OSM(),
    }),
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
