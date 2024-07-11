// I think -> I can Keep Global Variables Here
import { highlightStyle } from './ol_styles';

import { map, overlay } from './map';

//Ignore Zoom Requests Once User Changes Default Filters
let filtered = false;

let tranmissionLineLayer = new ol.layer.Vector({
  // ne:Electric_Power_Transmission_Lines_A
  // geoserver localhost:3000/api
  source: new ol.source.Vector({
    url: 'http://localhost:3000/api/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ne:Electric_Power_Transmission_Lines_A&outputFormat=application/json&CQL_FILTER=VOLTAGE>700',
    format: new ol.format.GeoJSON(),
  }),
});

map.AddLayer(tranmissionLineLayer);

tranmissionLineLayer.setStyle(defaultStyle);

let selectedFeature = null;
let vectorTransmissionLayerOut = tranmissionLineLayer;

//popup related information
var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');

// Close the popup when the close button is clicked
closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};

const handleSelectionPopup = function (event) {
  if (selectedFeature) {
    selectedFeature.setStyle(null);
  }
  // Use the map's forEachFeatureAtPixel method to check for features at the click location
  map.forEachFeatureAtPixel(
    event.pixel,
    function (feature, layer) {
      // Check if the layer is the transmissionLineLayer
      if (layer === vectorTransmissionLayerOut) {
        // Construct content for the popup based on the feature's properties
        var properties = feature.getProperties();
        var info = `Name: ${properties.OWNER}<br>
                  Length: ${Math.round(properties.SHAPE__Len / 1000)} km <br> 
                  Voltage: ${properties.VOLTAGE}<br>
                  Substation 1: ${properties.SUB_1}<br>
                  Substation 2: ${properties.SUB_2}`;
        content.innerHTML = info;

        // Show the popup
        var coordinate = event.coordinate;
        overlay.setPosition(coordinate);

        if (selectedFeature) {
          selectedFeature.setStyle(null);
        }

        selectedFeature = feature;

        // Highlight the feature
        feature.setStyle(highlightStyle);
        selectedFeature = feature;

        // Optionally, return the feature if you only want the first feature found
        return feature;
      }
    },
    {
      // Specify the layer(s) to include in the search
      layerFilter: function (candidateLayer) {
        return candidateLayer === vectorTransmissionLayerOut;
      },
    }
  );
};

function handleZoomChanges() {
  if (filtered) return;

  var zoom = map.getView().getZoom();

  if (zoom < 8 && previousZoom > 8) {
    filter = 'VOLTAGE>700';
  } else if (
    zoom >= 8 &&
    zoom < 12 &&
    (previousZoom < 8 || previousZoom >= 12)
  ) {
    filter = 'VOLTAGE>200';
  } else if (zoom >= 12 && previousZoom < 12) {
    filter = 'INCLUDE'; // OGC's way of saying "no filter"
  }
  // case it hasn't changed at all
  else {
    return;
  }

  previousZoom = zoom;

  var extent = map.getView().calculateExtent(map.getSize());
  var projection = map.getView().getProjection();
  var wfsProjection = 'EPSG:3857'; // The projection used by your WFS service
  var transformedExtent = ol.proj.transformExtent(
    extent,
    projection,
    wfsProjection
  );

  // Construct the BBOX filter string
  var bboxFilter = `BBOX(the_geom,${transformedExtent.join(',')})`;

  // Combine your existing filter with the BBOX filter
  var combinedFilter = `${filter} AND ${bboxFilter}`;

  var wfsUrl = `http://localhost:3000/api/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ne:Electric_Power_Transmission_Lines_A&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(
    combinedFilter
  )}`;

  console.log('wfsUrl' + ' ' + wfsUrl);

  //store the current selectedFeature
  var selectedFeatureID = selectedFeature ? selectedFeature.getId() : null;

  map.removeLayer(vectorTransmissionLayerOut);

  var vectorTransmissionLayer = new ol.layer.Vector({
    source: new ol.source.Vector({
      format: new ol.format.GeoJSON(),
      url: wfsUrl,
    }),
  });

  vectorTransmissionLayerOut = vectorTransmissionLayer;

  //add selected feature to the map
  if (selectedFeature) {
    vectorTransmissionLayer.getSource().addFeature(selectedFeature);
  }

  // add styling to selected feature
  selectedFeature.setStyle(highlightStyle);

  map.addLayer(vectorTransmissionLayer);

  //restore selected feature vector

  //find the feature with the selectedFeatureID
  if (selectedFeatureID) {
    var selectedFeature = vectorTransmissionLayer
      .getSource()
      .getFeatureById(selectedFeatureID);
    if (selectedFeature) {
      selectedFeature.setStyle(highlightStyle);
    }
  }

  //apply layer style
  tranmissionLineLayer.setStyle(defaultStyle);

  //apply the styling to the selected feature
  if (selectedFeature) {
    selectedFeature.setStyle(highlightStyle);
  }
}

export { handleSelectionPopup, handleZoomChanges };
