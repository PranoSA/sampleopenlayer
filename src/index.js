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
import {
  startDraggingPopup,
  handleDraggingPopup,
  stopDraggingPopup,
} from './popup';

map.getView().on('change:resolution', handleZoomChanges);
map.getView().on('change:center', function () {
  //enable button
  setButtonState(true);
});

//add event listener to the scroller to the text in scroller

/*

      <div id="map-controls">
        <label for="min-voltage">Min Voltage (kV):</label>
        <input
          type="range"
          id="min-voltage"
          min="0"
          max="1000"
          value="700"
          class="slider"
        />
        <span id="voltage-value">0</span> kV

        <label for="min-distance">Min Distance (km):</label>
        <input
          type="range"
          id="min-distance"
          min="0"
          max="1000"
          value="0"
          class="slider"
        />
        <span id="distance-value">0</span> km

        <button id="update-map-btn">Update Map</button>
      </div>
*/

// Add event listener to  changes in min-voltage and min-distance
// Update the map layers based on the new values

//do the same thing on page load?
let hasChanged = false;

const setButtonState = function (changed = false) {
  const button = document.getElementById('update-map-btn');
  if (changed) {
    button.classList.remove('disabled');
  } else {
    button.classList.add('disabled');
  }
};

// on load
document.addEventListener('DOMContentLoaded', function () {
  const minVoltage = document.getElementById('min-voltage').value;
  const minDistance = document.getElementById('min-distance').value;

  document.getElementById('voltage-value').innerHTML = minVoltage + 'kV';
  document.getElementById('distance-value').innerHTML = minDistance + 'km';
  updateMapLayers(minVoltage, minDistance);
  setButtonState(false);
});

document
  .getElementById('min-voltage')
  .addEventListener('input', function (event) {
    const minVoltage = event.target.value;
    document.getElementById('voltage-value').innerHTML = minVoltage + 'kV';
    setButtonState(true);
  });

document
  .getElementById('min-distance')
  .addEventListener('input', function (event) {
    const minDistance = event.target.value;
    document.getElementById('distance-value').innerHTML = minDistance + 'km';
    setButtonState(true);
  });

document
  .getElementById('update-map-btn')
  .addEventListener('click', function () {
    //prevent default

    const minVoltage = document.getElementById('min-voltage').value;
    const minDistance = document.getElementById('min-distance').value;

    updateMapLayers(minVoltage, minDistance);
    setButtonState(false);
  });

var selectedFeature = null;

map.on('singleclick', handleSelectionPopup);

var dragging = false;
var offsetX, offsetY;

// Assuming 'overlay' is your popup overlay and 'container' is the HTML element of the popup
var container = document.getElementById('popup'); // Adjust the ID to match your popup's container

container.addEventListener('mousedown', startDraggingPopup);

document.addEventListener('mousemove', handleDraggingPopup);

document.addEventListener('mouseup', stopDraggingPopup);

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

  //When is the moveend event triggered?
  // When the map is done moving
  // zooming in and out
  var previousZoom = 0;
  var previousCenter;

  map.on('moveend', function () {
    var zoom = map.getView().getZoom();

    //compare the previous center to the new center
    if (previousCenter !== map.getView().getCenter()) {
      setButtonState(true);
      previousCenter = map.getView().getCenter();
    }

    //enable button if the zoom changes, or if the map bounds change
    if (previousZoom !== zoom) {
      setButtonState(true);
      previousZoom = zoom;
    }

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
