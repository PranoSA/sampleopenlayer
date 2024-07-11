import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

import { clusterLayer, heatMapLayer } from './power_plants';

// Initialize the Map
var map = new ol.Map({
  target: 'map', // The ID of the map container
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM(), // OpenStreetMap as the source
    }),
    clusterLayer,
    //heatMapLayer,
    tranmissionLineLayer,
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([-98.5795, 39.8283], 'EPSG:3857'), // Center of the map
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

//Apply the map to the div with the ID of "map"
map.setTarget('map');

//Add the overlay to the map
map.addOverlay(overlay);

export default map;

export { overlay, map };
