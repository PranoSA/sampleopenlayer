import * as ol from 'ol';
// I think -> I can Keep Global Variables Here
import {
  defaultTransmissionLineStyle,
  hoverTransmissionLineStyle,
  highlightTransmissionLineStyle,
  clusterPowerPlantStyle,
  clusterStyleFunction,
} from './ol_styles';
import { transformExtent } from 'ol/proj';

import { map, overlay } from './dom_mapper';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';

//Ignore Zoom Requests Once User Changes Default Filters
let filtered = false;

let tranmissionLineLayer = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'http://localhost:3000/api/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ne:Electric_Power_Transmission_Lines_A&outputFormat=application/json&CQL_FILTER=VOLTAGE>700',
  }),
});

if (map == null) {
  console.log('Map Failed To Load');
}

map.addLayer(tranmissionLineLayer);

tranmissionLineLayer.setStyle(defaultTransmissionLineStyle);

let selectedFeature = null;
let vectorTransmissionLayerOut = tranmissionLineLayer;
let last_voltage = 0;
let last_distance = 0;

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
        console.log(properties);
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
        feature.setStyle(highlightTransmissionLineStyle);
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

let previousZoom = 15;

function handleZoomChanges() {
  if (filtered) return;

  let filter = 'INCLUDE'; // OGC's way of saying "no filter

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
  /*var transformedExtent = ol.proj.transformExtent(
    extent,
    projection,
    wfsProjection
  );*/
  var transformedExtent = transformExtent(extent, projection, wfsProjection);

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

  /* var vectorTransmissionLayer = new ol.layer.Vector({
    source: new ol.source.Vector({
      format: new ol.format.GeoJSON(),
      url: wfsUrl,
    }),
  });*/
  var vectorTransmissionLayer = new VectorLayer({
    source: new VectorSource({
      format: new GeoJSON(),
      url: wfsUrl,
    }),
  });

  //set style
  vectorTransmissionLayer.setStyle(defaultTransmissionLineStyle);

  vectorTransmissionLayerOut = vectorTransmissionLayer;

  //add selected feature to the map
  if (selectedFeature) {
    vectorTransmissionLayer.getSource().addFeature(selectedFeature);

    // add styling to selected feature
    selectedFeature.setStyle(highlightTransmissionLineStyle);
  }

  map.addLayer(vectorTransmissionLayer);

  //restore selected feature vector

  //find the feature with the selectedFeatureID
  if (selectedFeatureID) {
    var selectedFeature = vectorTransmissionLayer
      .getSource()
      .getFeatureById(selectedFeatureID);
    if (selectedFeature) {
      selectedFeature.setStyle(highlightTransmissionLineStyle);
    }
  }

  //apply layer style
  tranmissionLineLayer.setStyle(defaultTransmissionLineStyle);

  //apply the styling to the selected feature
  if (selectedFeature) {
    selectedFeature.setStyle(highlightTransmissionLineStyle);
  }
}

function updateMapLayers(voltage, distance) {
  // Update the source URL or parameters based on voltage and possibly distance
  // This example only shows voltage being used

  // initial filter
  filtered = true;

  //check if either distance or voltage has changed
  if (last_distance == distance && last_voltage == voltage) {
    return;
  }

  //add distance filter
  let filter = `VOLTAGE>${voltage} AND SHAPE__Len>${distance}`;

  var extent = map.getView().calculateExtent(map.getSize());
  var projection = map.getView().getProjection();
  var wfsProjection = 'EPSG:3857'; // The projection used by your WFS service

  var transformedExtent = transformExtent(extent, projection, wfsProjection);
  // Construct the BBOX filter string
  var bboxFilter = `BBOX(the_geom,${transformedExtent.join(',')})`;

  // Combine your existing filter with the BBOX filter
  var combinedFilter = `${filter} AND ${bboxFilter}`;

  var wfsUrl = `http://localhost:3000/api/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ne:Electric_Power_Transmission_Lines_A&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(
    combinedFilter
  )}`;

  //remove previous layer
  map.removeLayer(vectorTransmissionLayerOut);

  //add new layer
  var vectorTransmissionLayer = new VectorLayer({
    source: new VectorSource({
      format: new GeoJSON(),
      url: wfsUrl,
    }),
  });

  // Update the layer
  vectorTransmissionLayerOut = vectorTransmissionLayer;

  // Add styling to layer
  vectorTransmissionLayer.setStyle(defaultTransmissionLineStyle);

  map.addLayer(vectorTransmissionLayer);

  if (!selectedFeature) return;

  vectorTransmissionLayer.getSource().addFeature(selectedFeature);

  // add styling to selected feature
  selectedFeature.setStyle(highlightTransmissionLineStyle);

  // For distance, you would need to adjust accordingly, possibly affecting another layer or filter
}

function hoverTranssmionHandler(evt) {
  if (evt.dragging) {
    return;
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  const feature = map.forEachFeatureAtPixel(pixel, function (feature) {
    return feature;
  });

  // Reset style of previously hovered feature and not the same as highlighted feature
  if (
    currentHoveredFeature &&
    feature !== currentHoveredFeature &&
    currentHoveredFeature !== selectedFeature
  ) {
    // Assuming you have a defaultStyle or you can simply set to null to use the layer's default
    currentHoveredFeature.setStyle(null);
    currentHoveredFeature = null;
  }

  // Apply hover style to the new hovered feature
  if (feature && !currentHoveredFeature) {
    feature.setStyle(hoverTransmissionLineStyle);
    currentHoveredFeature = feature;
    map.getTargetElement().style.cursor = 'pointer';
  } else {
    map.getTargetElement().style.cursor = '';
  }
}

export {
  handleSelectionPopup,
  handleZoomChanges,
  updateMapLayers,
  hoverTranssmionHandler,
};
