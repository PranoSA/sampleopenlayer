import * as ol from 'ol';
import {
  defaultTransmissionLineStyle,
  highlightTransmissionLineStyle,
  hoverTransmissionLineStyle,
} from './ol_styles';
import {
  handleSelectionPopup,
  handleZoomChanges,
  updateMapLayers,
  hoverTranssmionHandler,
} from './transmissions';
import { clusterStyleFunction } from './ol_styles';
import { overlay, map } from './dom_mapper';
import { powerPlantClusterLayer } from './power_plants';
import './index.css';

map.getView().on('change:resolution', handleZoomChanges);

document
  .getElementById('update-map-btn')
  .addEventListener('click', function () {
    //prevent default

    const minVoltage = document.getElementById('min-voltage').value;
    const minDistance = document.getElementById('min-distance').value;

    // Change text display to show the current filters for element voltage-value
    document.getElementById('voltage-value').innerHTML = minVoltage + 'kV';
    document.getElementById('distance-value').innerHTML = minDistance + 'km';
    updateMapLayers(minVoltage, minDistance);
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
      powerPlantClusterLayer.setDistance(0); // No clustering
    } else {
      powerPlantClusterLayer.setDistance(40); // Adjust distance as needed
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

map.on('pointermove', hoverTranssmionHandler);
