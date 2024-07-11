import { defaultStyle, hoverStyle, highlightStyle } from './ol_styles';
import { handleSelectionPopup, handleZoomChanges } from './transmissions';
import { clusterStyleFunction } from './power_plants';
import map from './map';
import { overlay } from './map';

let previousZoom = 15;

map.getView().on('change:resolution', handleZoomChanges);

let last_voltage = 0;
let last_distance = 0;

document.getElementById('min-voltage').addEventListener('input', function () {
  let voltageValue = this.value;
  document.getElementById('voltage-value').textContent = voltageValue;

  let record_voltage = 0;
  let record_distance = 0;
  // set a timeout to prevent too many requests
  setTimeout(() => {
    if (
      record_voltage == voltageValue &&
      record_distance == document.getElementById('min-distance').value
    ) {
      return;
    }
    record_voltage = voltageValue;
    record_distance = document.getElementById('min-distance').value;
    //updateMapLayers(voltageValue, document.getElementById('min-distance').value);
  }, 2000);
  //wait 2 seconds

  //updateMapLayers(voltageValue, document.getElementById('min-distance').value);
});

document.getElementById('min-distance').addEventListener('input', function () {
  let distanceValue = this.value;

  document.getElementById('distance-value').textContent = distanceValue;

  //update map layers
  //updateMapLayers(document.getElementById('min-voltage').value, distanceValue);
  // Assuming distance affects another layer or filter, implement accordingly
});

document
  .getElementById('update-map-btn')
  .addEventListener('click', function () {
    //prevent default

    const minVoltage = document.getElementById('min-voltage').value;
    const minDistance = document.getElementById('min-distance').value;
    console.log('Updating Map');
    updateMapLayers(minVoltage, minDistance);
  });

function updateMapLayers(voltage, distance) {
  // Update the source URL or parameters based on voltage and possibly distance
  // This example only shows voltage being used

  // initial filter

  //check if either distance or voltage has changed
  if (last_distance == distance && last_voltage == voltage) {
    return;
  }

  //add distance filter
  let filter = `VOLTAGE>${voltage} AND SHAPE__Len>${distance}`;

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
  //let newUrl = `http://localhost:3000/api/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ne:Electric_Power_Transmission_Lines_A&outputFormat=application/json&CQL_FILTER=VOLTAGE>${voltage}`;
  //tranmissionLineLayer.getSource().setUrl(wfsUrl);
  //actually reset layer

  //fetchFeatures(wfsUrl);

  //copy feature so it still exists

  //remove previous layer
  map.removeLayer(vectorTransmissionLayerOut);

  //add new layer
  var vectorTransmissionLayer = new ol.layer.Vector({
    source: new ol.source.Vector({
      format: new ol.format.GeoJSON(),
      url: wfsUrl,
    }),
  });

  // Update the layer
  vectorTransmissionLayerOut = vectorTransmissionLayer;

  // Add styling to layer
  vectorTransmissionLayer.setStyle(defaultStyle);

  map.addLayer(vectorTransmissionLayer);

  vectorTransmissionLayer.getSource().addFeature(selectedFeature);

  // add styling to selected feature
  selectedFeature.setStyle(highlightStyle);

  // For distance, you would need to adjust accordingly, possibly affecting another layer or filter
}

var highlightStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: '#ff0000',
    width: 5, // Highlighted line width
  }),
});
var selectedFeature = null;

map.on('singleclick', handleSelectionPopup);

var dragging = false;
var offsetX, offsetY;

// Assuming 'overlay' is your popup overlay and 'container' is the HTML element of the popup
var container = document.getElementById('popup'); // Adjust the ID to match your popup's container

container.addEventListener('mousedown', function (event) {
  // Start dragging
  if (container.contains(event.target)) {
    dragging = true;
    var rect = container.getBoundingClientRect();
    //Get location of the left and top of the container
    offsetX = event.clientX - parseFloat(rect.left); //- parseFloat(container.style.left);
    offsetY = event.clientY - parseFloat(rect.top); // parseFloat(container.style.top);
    container.style.cursor = 'grabbing';

    event.preventDefault();
  }
});

document.addEventListener('mousemove', function (event) {
  if (dragging) {
    // Calculate the new position
    var x = event.clientX - offsetX;
    var y = event.clientY - offsetY;

    // Update the position of the popup
    container.style.left = x - 650 + 'px';
    container.style.top = y - 40 + 'px';
  }
});

document.addEventListener('mouseup', function () {
  // Stop dragging
  dragging = false;
  container.style.cursor = 'grab';
});

// Prevent text selection while dragging
container.addEventListener('selectstart', function (event) {
  event.preventDefault();
});

map.on('singleclick', function (evt) {
  var infoPanel = document.getElementById('info');
  var featureFound = false;
  map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
    // Assuming your features have properties you want to display
    // Adjust this to match the actual properties of your features
    var properties = feature.getProperties();

    var infoContent = 'Power Plant Name: ' + properties.Plant_Name; // Example property
    infoPanel.innerHTML = infoContent;
    featureFound = true;
  });

  map.on('moveend', function () {
    var zoom = map.getView().getZoom();
    // Adjust clusterSource distance or clusterLayer style based on zoom
    // For example, disable clustering at high zoom levels
    var certainZoomLevel = 10;
    if (zoom > certainZoomLevel) {
      clusterSource.setDistance(0); // No clustering
    } else {
      clusterSource.setDistance(40); // Adjust distance as needed
    }
  });

  if (!featureFound) {
    infoPanel.innerHTML = 'Click on a point';
  }
});

map.on('pointermove', function (evt) {
  if (evt.dragging) {
    return; // If the map is being dragged, do nothing
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  const hit = map.hasFeatureAtPixel(pixel);
  map.getTargetElement().style.cursor = hit ? 'pointer' : ''; // Change cursor style if over a feature
});
let currentHoveredFeature = null;

map.on('pointermove', function (evt) {
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
    feature.setStyle(hoverStyle);
    currentHoveredFeature = feature;
    map.getTargetElement().style.cursor = 'pointer';
  } else {
    map.getTargetElement().style.cursor = '';
  }
});
