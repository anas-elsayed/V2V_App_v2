// ============================================
// map.js — Google Maps live GPS tracking
// Uses AdvancedMarkerElement (non-deprecated)
// Edit 21: car1 icon on map marker
// ============================================

let map = null;
let car1Marker = null;
let destinationMarker = null;
let mapReady = false;

async function initMap() {
  const { Map } = await google.maps.importLibrary('maps');
  const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');

  map = new Map(document.getElementById('map'), {
    center: { lat: 30.0444, lng: 31.2357 },
    zoom: 15,
    mapId: 'v2v_map',
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true
  });

  // Edit 21 — Car-1 marker using car1.png icon
  const car1El = document.createElement('img');
  car1El.src = 'icons/car1.png';
  car1El.style.cssText = 'width:40px; height:40px;';

  car1Marker = new AdvancedMarkerElement({
    map,
    position: { lat: 30.0444, lng: 31.2357 },
    title: 'Car-1',
    content: car1El
  });

  mapReady = true;
}

function updateCarPosition(lat, lng) {
  if (!mapReady || !car1Marker) return;
  const pos = { lat: parseFloat(lat), lng: parseFloat(lng) };
  car1Marker.position = pos;
  map.panTo(pos);
  document.getElementById('gps-coords').textContent =
    `${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}`;
}

async function setDestinationOnMap(lat, lng, label) {
  if (!mapReady) return;
  const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');

  if (destinationMarker) destinationMarker.map = null;

  const pin = document.createElement('div');
  pin.style.cssText = `
    width: 14px; height: 14px;
    background: #16A34A;
    border: 2px solid #BBF7D0;
    border-radius: 50%;
  `;

  destinationMarker = new AdvancedMarkerElement({
    map,
    position: { lat, lng },
    title: label,
    content: pin
  });
}

function flashAccidentMarker() {
  if (!mapReady || !car1Marker) return;
  const el = car1Marker.content;
  let visible = true;
  const interval = setInterval(() => {
    visible = !visible;
    el.style.opacity = visible ? '1' : '0.2';
  }, 400);
  setTimeout(() => {
    clearInterval(interval);
    el.style.opacity = '1';
  }, 10000);
}
