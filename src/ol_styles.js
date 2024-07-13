import * as ol from 'ol';
import { map } from './dom_mapper';
import { Style, Stroke, Circle, Fill, Text } from 'ol/style';

var defaultTransmissionLineStyle = new Style({
  stroke: new Stroke({
    color: '#ff00ff',
    width: 4, // Default line width
  }),
});

const hoverTransmissionLineStyle = new Style({
  stroke: new Stroke({
    color: '#00ffff',
    width: 4, // Highlighted line width
  }),
});

var highlightTransmissionLineStyle = new Style({
  stroke: new Stroke({
    color: '#ff0000',
    width: 5, // Highlighted line width
  }),
});

var clusterPowerPlantStyle = new Style({
  image: new Circle({
    radius: 10,
    fill: new Fill({
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

  // var size = Math.min(20, 0+ totalMW / 10); // Limit the size to 40 (or adjust as needed
  var style = new Style({
    image: new Circle({
      radius: size,
      stroke: new Stroke({
        color: '#fff',
      }),
      fill: new Fill({
        color: '#3399CC',
      }),
    }),
    text: new Text({
      text:
        totalMW > 1000000
          ? Math.round(totalMW / 1000000).toString() + 'TW'
          : totalMW > 1000
          ? Math.round(totalMW / 1000).toString() + 'GW'
          : Math.round(totalMW).toString() + 'MW',
      fill: new Fill({
        color: '#000',
      }),
    }),
  });
  return style;
}

export {
  defaultTransmissionLineStyle,
  hoverTransmissionLineStyle,
  highlightTransmissionLineStyle,
  clusterPowerPlantStyle,
  clusterStyleFunction,
};
