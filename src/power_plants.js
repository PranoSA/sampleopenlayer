import * as ol from 'ol';

import { clusterStyleFunction } from './ol_styles';
import VectorSource from 'ol/source/Vector';
import heatMapLayer from 'ol/layer/Heatmap';
import { Cluster } from 'ol/source';
import GeoJSON from 'ol/format/GeoJSON';

import VectorLayer from 'ol/layer/Vector';

let vectorSource = new VectorSource({
  url: 'http://localhost:3000/api/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ne:Power_Plants&outputFormat=application/json',
  format: new GeoJSON(),
});

let powerPlantHeatMapLayer = new heatMapLayer({
  source: vectorSource,
  blur: 15,
  radius: 5,
  weight: function (feature) {
    return feature.get('Total_MW');
  },
});

var clusterSource = new Cluster({
  distance: 50,
  source: vectorSource,
});

var powerPlantClusterLayer = new VectorLayer({
  source: clusterSource,
  style: clusterStyleFunction,
});

export { powerPlantClusterLayer, powerPlantHeatMapLayer };
