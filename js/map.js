// ============================================
// map.js — Google Maps live GPS tracking
// Shows Car-1 dot moving in real time
// ============================================

let map = null;
let car1Marker = null;
let destinationMarker = null;
let mapReady = false;

// Called automatically by Google Maps script
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 30.0444, lng: 31.2357 }, // Default: Cairo
    zoom: 15,
    styles: mapDarkStyle(),
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true
  });

  // Car-1 marker — blue dot
  car1Marker = new google.maps.Marker({
    map,
    title: 'Car-1',
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#2563EB',
      fillOpacity: 1,
      strokeColor: '#BFDBFE',
      strokeWeight: 2
    }
  });

  mapReady = true;
}

// Update Car-1 position on map
function updateCarPosition(lat, lng) {
  if (!mapReady) return;

  const pos = { lat: parseFloat(lat), lng: parseFloat(lng) };

  car1Marker.setPosition(pos);
  map.panTo(pos);

  // Update coords display
  document.getElementById('gps-coords').textContent =
    `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

// Show destination pin on map
function setDestinationOnMap(lat, lng, label) {
  if (!mapReady) return;

  if (destinationMarker) destinationMarker.setMap(null);

  destinationMarker = new google.maps.Marker({
    map,
    position: { lat, lng },
    title: label,
    icon: {
      path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
      scale: 6,
      fillColor: '#16A34A',
      fillOpacity: 1,
      strokeColor: '#BBF7D0',
      strokeWeight: 1.5
    }
  });
}

// Flash marker red on accident
function flashAccidentMarker() {
  if (!mapReady || !car1Marker) return;

  let isRed = false;
  const interval = setInterval(() => {
    isRed = !isRed;
    car1Marker.setIcon({
      path: google.maps.SymbolPath.CIRCLE,
      scale: 12,
      fillColor: isRed ? '#DC2626' : '#FF6B6B',
      fillOpacity: 1,
      strokeColor: '#FCA5A5',
      strokeWeight: 2
    });
  }, 400);

  // Stop flashing after 10 seconds
  setTimeout(() => clearInterval(interval), 10000);
}

// Dark map style matching app theme
function mapDarkStyle() {
  return [
    { elementType: 'geometry', stylers: [{ color: '#111827' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0A0F1E' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1C2539' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1E2D45' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1E3A5F' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0A1628' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] }
  ];
}
