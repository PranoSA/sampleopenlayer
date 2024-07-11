var defaultStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: '#ff00ff',
    width: 4, // Default line width
  }),
});

const hoverStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: '#00ffff',
    width: 4, // Highlighted line width
  }),
});

var highlightStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: '#ff0000',
    width: 5, // Highlighted line width
  }),
});

//Cluster Style
var clusterStyle = new ol.style.Style({
  image: new ol.style.Circle({
    radius: 10,
    fill: new ol.style.Fill({
      color: '#ff00ff',
    }),
  }),
});

// size Cluster based on Total_MW property

function clusterStyleFunction(feature) {
  var features = feature.get('features');

  var totalMW = features.reduce(function (sum, feature) {
    return sum + (feature.get('Total_MW') || 0); // Sum up the Total_MW property, defaulting to 0 if undefined
  }, 0);
  //Adjust size based on zoom

  let zoom = map.getView().getZoom();
  console.log('Zoom: ' + zoom);
  var size = 10;

  if (zoom > 10) {
    size = Math.min(30, 10 + totalMW / 10); // Limit the size to 40 (or adjust as needed
  }
  if (zoom > 5 && zoom < 10) {
    size = Math.min(30, 10 + totalMW / 1000); // Limit the size to 40 (or adjust as needed
  }

  if (zoom < 5) {
    size = Math.min(20, 5 + totalMW / 10000); // Limit the size to 40 (or adjust as needed
  }

  console.log('Size: ' + size);

  // var size = Math.min(20, 0+ totalMW / 10); // Limit the size to 40 (or adjust as needed
  var style = new ol.style.Style({
    image: new ol.style.Circle({
      radius: size,
      stroke: new ol.style.Stroke({
        color: '#fff',
      }),
      fill: new ol.style.Fill({
        color: '#3399CC',
      }),
    }),
    text: new ol.style.Text({
      text:
        totalMW > 1000000
          ? Math.round(totalMW / 1000000).toString() + 'TW'
          : totalMW > 1000
          ? Math.round(totalMW / 1000).toString() + 'GW'
          : Math.round(totalMW).toString() + 'MW',
      fill: new ol.style.Fill({
        color: '#000',
      }),
    }),
  });
  return style;
}

export {
  defaultStyle,
  hoverStyle,
  highlightStyle,
  clusterStyle,
  clusterStyleFunction,
};
