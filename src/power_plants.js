import * as ol from 'ol';

import { clusterStyleFunction } from './ol_styles';
import VectorSource from 'ol/source/Vector';
import heatMapLayer from 'ol/layer/Heatmap';
import { Cluster } from 'ol/source';
import GeoJSON from 'ol/format/GeoJSON';
import { transformExtent } from 'ol/proj';
import { containsCoordinate } from 'ol/extent';
import { map } from './dom_mapper';

import VectorLayer from 'ol/layer/Vector';

let vectorSource = new VectorSource({
  url: 'http://localhost:3000/api/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ne:Power_Plants&outputFormat=application/json',
  format: new GeoJSON(),
});

let total_weight_power_plant = 1;

function setTotalWeightPowerPlant(weight) {
  total_weight_power_plant = weight;
}

function getAreaOfMap() {
  let extent = map.getView().calculateExtent();
  let area = Math.abs(extent[0] - extent[2]) * Math.abs(extent[1] - extent[3]);
  return area;
}

let powerPlantHeatMapLayer = new heatMapLayer({
  source: vectorSource,
  blur: 5,
  radius: 5,
  /*weight: function (feature) {
    return feature.get('Total_MW');
  },*/
  weight: function (feature) {
    // ratio of how big the radius is to entire map
    let map_x_pixels = map.getSize()[0];
    let map_y_pixels = map.getSize()[1];
    const fudgeFactor = (5 * 5 * 3.14159) / map_x_pixels / map_y_pixels;

    const new_weight =
      feature.get('Total_MW') / (total_weight_power_plant * fudgeFactor);
    //return feature.get('Total_MW') / total_weight_power_plant;
    return new_weight;
  },
});

vectorSource.on('featuresloadend', function () {
  let totalMW = 0;

  // get current view extent
  let extent = map.getView().calculateExtent();
  //convert to EPSG:4326
  let extent_4326 = transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
  //calculate total MW inside the extent

  vectorSource.forEachFeature(function (feature) {
    //check if the feature is inside the extent

    // remember, the feature is a point
    // so we need to get the coordinates of the point
    // and check if it is inside the extent
    let point = feature.getGeometry().getCoordinates();

    let point4326 = toLonLat(point);
    if (containsCoordinate(extent_4326, point)) {
      totalMW += feature.get('Total_MW');
    }
    totalMW += feature.get('Total_MW');
  });
  total_weight_power_plant = totalMW;

  powerPlantClusterLayer.set('weight', function (feature) {
    //maybe, weigh it against the area of the view??
    // more area -> higher??
    return feature.get('Total_MW') / totalMW;
  });
});

//add a listener for zoom change on map

var clusterSource = new Cluster({
  distance: 50,
  source: vectorSource,
});

var powerPlantClusterLayer = new VectorLayer({
  source: clusterSource,
  style: clusterStyleFunction,
});

export {
  powerPlantClusterLayer,
  powerPlantHeatMapLayer,
  setTotalWeightPowerPlant,
};
