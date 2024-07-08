

import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

const map = new Map({
  target: 'map', // The ID of the map container
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  view: new View({
    center: [0, 0], // Center of the map using OpenLayers' default projection
    zoom: 2
  })
});

//Apply the map to the div with the ID of "map"
map.setTarget('map');

