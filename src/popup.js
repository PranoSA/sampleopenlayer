var container = document.getElementById('popup');

var dragging = false;
var offsetX, offsetY;

const startDraggingPopup = function (event) {
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
};

const handleDraggingPopup = function (event) {
  if (dragging) {
    // Calculate the new position
    var x = event.clientX - offsetX;
    var y = event.clientY - offsetY;

    // Update the position of the popup
    container.style.left = x - 650 + 'px';
    container.style.top = y - 40 + 'px';
  }
};

const stopDraggingPopup = function () {
  // Stop dragging
  dragging = false;
  container.style.cursor = 'grab';
};

export { startDraggingPopup, handleDraggingPopup, stopDraggingPopup };
