// ============================================
// map.js — Google Maps live GPS tracking
// Uses AdvancedMarkerElement (non-deprecated)
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

  // Car-1 marker — blue dot
  const car1Dot = document.createElement('div');
  car1Dot.style.cssText = `
    width: 18px; height: 18px;
    background: #2563EB;
    border: 3px solid #BFDBFE;
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(37,99,235,0.6);
  `;

  car1Marker = new AdvancedMarkerElement({
    map,
    position: { lat: 30.0444, lng: 31.2357 },
    title: 'Car-1',
    content: car1Dot
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
  let isRed = false;
  const dot = car1Marker.content;
  const interval = setInterval(() => {
    isRed = !isRed;
    dot.style.background = isRed ? '#DC2626' : '#FF6B6B';
    dot.style.boxShadow = `0 0 12px rgba(220,38,38,0.8)`;
  }, 400);
  setTimeout(() => clearInterval(interval), 10000);
}
