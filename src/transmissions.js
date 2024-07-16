import * as ol from 'ol';
// I think -> I can Keep Global Variables Here
import {
  defaultTransmissionLineStyle,
  hoverTransmissionLineStyle,
  highlightTransmissionLineStyle,
  clusterPowerPlantStyle,
  clusterStyleFunction,
  RectangleStyle,
} from './ol_styles';
import { toLonLat, transformExtent } from 'ol/proj';
import { Feature } from 'ol';
import { Vector } from 'ol/source';

import { map, overlay } from './dom_mapper';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Polygon } from 'ol/geom';
import { fromExtent as PolygonFromExtent } from 'ol/geom/Polygon';
import { getDistance } from 'ol/sphere';
import { containsCoordinate } from 'ol/extent';

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
startLoadingCycleOnLayer(tranmissionLineLayer);
//DrawRectangle(map.getView().calculateExtent(map.getSize()));

AddListener(tranmissionLineLayer);

tranmissionLineLayer.setStyle(defaultTransmissionLineStyle);

let selectedFeature = null;
let vectorTransmissionLayerOut = tranmissionLineLayer;
let last_voltage = 0;
let last_distance = 0;

//popup related information
var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');

function startLoadingCycleOnLayer(transmissionLineLayerLoading) {
  var loadingFeatures = 0;
  transmissionLineLayerLoading.getSource().on('featuresloadstart', function () {
    loadingFeatures++;
    document.getElementById('loadingIndicator').style.display = 'block';
  });

  transmissionLineLayerLoading.getSource().on('featuresloadend', function () {
    loadingFeatures--;
    if (loadingFeatures === 0) {
      document.getElementById('loadingIndicator').style.display = 'none';
    }
  });
}

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

  //enable button

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

  DrawRectangle(extent);
  map.addLayer(vectorTransmissionLayer);
  AddListener(vectorTransmissionLayer);
  // add the loading cycle
  startLoadingCycleOnLayer(vectorTransmissionLayer);

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

var previousRectangle = null;

function DrawRectangle(extent) {
  var rectangle = PolygonFromExtent(extent);

  if (previousRectangle) {
    map.removeLayer(previousRectangle);
  }

  var feature = new Feature(rectangle);
  var vectorSource = new Vector({
    features: [feature], // Add our feature
  });

  var vectorLayer = new VectorLayer({
    source: vectorSource,
    // Optional: Style the rectangle
    style: RectangleStyle,
  });

  previousRectangle = vectorLayer;

  // Step 4: Add the Layer to the Map
  map.addLayer(vectorLayer);
  startLoadingCycleOnLayer(vectorLayer);
  return;
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

  DrawRectangle(extent);
  map.addLayer(vectorTransmissionLayer);
  startLoadingCycleOnLayer(vectorTransmissionLayer);

  AddListener(vectorTransmissionLayer);

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

function AddListener(newTransmissionLayer) {
  const source = newTransmissionLayer.getSource();
  source.on('change', function (e) {
    if (source.getState() === 'ready') {
      var features = source.getFeatures();

      var distance_html = document.getElementById('distance-transmission-line');
      var number_html = document.getElementById('number-transmission-line');
      var size_html = document.getElementById('size-transmission-line');
      var vertex_html = document.getElementById('vertex-transmission-line');

      // Get the total size of the features
      var features = this.getFeatures();
      var geojsonFormat = new GeoJSON();
      var geojsonStr = geojsonFormat.writeFeatures(features);
      var sizeInBytes = new TextEncoder().encode(geojsonStr).length;
      var sizeInKb = sizeInBytes / 1024;
      //console.log(`Total data size: ${sizeInKb.toFixed(2)} kB`);

      //Total Data Size Loaded : 0kb
      if (sizeInKb > 1024) {
        size_html.innerHTML = `Total Data Size Loaded : ${(
          sizeInKb / 1024
        ).toFixed(3)} MB`;
      } else {
        size_html.innerHTML = `Total Data Size Loaded : ${sizeInKb.toFixed(
          0
        )} kB`;
      }

      var features = this.getFeatures();
      var totalVertices = features.reduce((acc, feature) => {
        var geometry = feature.getGeometry();
        var vertices = geometry.getCoordinates();
        // For simple geometries, vertices is an array of coordinates
        // For complex geometries (e.g., polygons), it's an array of arrays, etc.
        // Adjust the logic here based on your specific geometry types
        return acc + vertices[0].length; // Adjust this logic for complex geometries
      }, 0);
      //<h4 id="vertex-transmission-line"># of Vertices: 0</h4>
      vertex_html.innerHTML = `# of Vertices: ${totalVertices}`;

      var totalNumberLines = features.length;
      number_html.innerHTML = `# of Transmission Lines: ${totalNumberLines}`;
      //console.log(`Total number of vertices: ${totalVertices}`);
      //

      //get total length of the transmission lines from properties.SHAPE__Len
      var totalLength = features.reduce((acc, feature) => {
        var properties = feature.getProperties();
        return acc + properties.SHAPE__Len / 1000;
      }, 0);
      //console.log(`Total length of transmission lines: ${totalLength}`);
      //<h4 id="distance-transmission-line" Total Length: 0 km</h4>
      distance_html.innerHTML = `Total Lengther: ${Math.round(totalLength)} km`;

      // get extent of the view
      var extent_view = map.getView().calculateExtent(map.getSize());

      let extent_4326 = transformExtent(extent_view, 'EPSG:3857', 'EPSG:4326');

      // calculate distance based on vertices inside of the extent
      var distance = features.reduce((acc, feature) => {
        var geometry = feature.getGeometry();
        var vertices = geometry.getCoordinates()[0];

        //check if entire feature is inside of the extent

        //if the entire line is inside the extent (no vertices outside of the extent)
        // you can use .Shape__Len like earlier
        // if you want to calculate the distance along the line

        //calculate distance along line
        var distance_feature = vertices.reduce((acc, vertex, index) => {
          // check if vertex is outside extent, return +0 if it is, just ac
          if (index === 0) {
            return acc;
          }

          //convert to espg:4326
          let vertex_4326 = toLonLat(vertex);

          let prev_vertex_4326 = toLonLat(vertices[index - 1]);

          //convert extent to 4326

          if (!containsCoordinate(extent_4326, vertex_4326)) {
            return acc;
          }

          const add_distance = getDistance(vertex_4326, prev_vertex_4326);
          //return acc + getDistance(vertex, vertices[index - 1]);
          return acc + add_distance / 1000;
        }, 0);

        // For simple geometries, vertices is an array of coordinates
        // For complex geometries (e.g., polygons), it's an array of arrays, etc.
        // Adjust the logic here based on your specific geometry types
        return acc + distance_feature; // Adjust this logic for complex geometries
      }, 0);
      totalLength = distance;

      distance_html.innerHTML = `Total Length: ${Math.round(totalLength)} km`;
    }
  });
}
