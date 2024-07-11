let vectorSource = new ol.source.Vector({
  url: 'http://localhost:3000/api/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ne:Power_Plants&outputFormat=application/json',
  format: new ol.format.GeoJSON(),
});

let heatMapLayer = new ol.layer.Heatmap({
  source: vectorSource,
  blur: 15,
  radius: 5,
});

var clusterSource = new ol.source.Cluster({
  distance: 50,
  source: vectorSource,
});

var clusterLayer = new ol.layer.Vector({
  source: clusterSource,
  style: clusterStyleFunction,
});

export { heatMapLayer, clusterSource, vectorSource };
