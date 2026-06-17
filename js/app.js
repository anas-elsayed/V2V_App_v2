// ============================================
// app.js — Main application logic
// Edit 19: success icon in fingerprint verified
// Edit 20: danger icon in alert 2 title
// ============================================

let isAuthenticated = false;
let fingerprintDone = false;
let destinationSet  = false;
let convoyRunning   = false;

const screenLogin     = document.getElementById('screen-login');
const screenDashboard = document.getElementById('screen-dashboard');
const btnLogin        = document.getElementById('btn-login');
const btnRegister     = document.getElementById('btn-register');
const btnLogout       = document.getElementById('btn-logout');
const btnStart        = document.getElementById('btn-start');
const btnStop         = document.getElementById('btn-stop');
const loginError      = document.getElementById('login-error');
const userEmailEl     = document.getElementById('user-email');
const fpArea          = document.getElementById('fingerprint-area');
const fpLabel         = document.getElementById('fp-label');
const authStatus      = document.getElementById('auth-status');
const destInput       = document.getElementById('destination-input');
const destStatus      = document.getElementById('dest-status');
const destName        = document.getElementById('dest-name');
const alertBanner     = document.getElementById('alert-banner');
const alertTitle      = document.getElementById('alert-title');
const alertDesc       = document.getElementById('alert-desc');
const alertClose      = document.getElementById('alert-close');
const accidentOverlay = document.getElementById('accident-overlay');
const accidentLoc     = document.getElementById('accident-location');
const accidentLink    = document.getElementById('accident-maps-link');
const accidentDismiss = document.getElementById('accident-dismiss');
const statusBadge     = document.getElementById('status-badge');
const car1StatusEl    = document.getElementById('car1-status');
const car2StatusEl    = document.getElementById('car2-status');
const alertLevelEl    = document.getElementById('alert-level');
const lastEventEl     = document.getElementById('last-event');
const eventLog        = document.getElementById('event-log');
const btnClearLog     = document.getElementById('btn-clear-log');

// ============================================
// SCREEN NAVIGATION
// ============================================
function showScreen(name) {
  screenLogin.classList.add('hidden');
  screenDashboard.classList.add('hidden');
  if (name === 'login') screenLogin.classList.remove('hidden');
  if (name === 'dashboard') screenDashboard.classList.remove('hidden');
}

// ============================================
// LOGIN
// ============================================
btnLogin.addEventListener('click', async () => {
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showLoginError('Please enter email and password.');
    return;
  }

  btnLogin.textContent = 'Signing in...';
  btnLogin.disabled = true;

  try {
    const user = await login(email, password);
    onLoginSuccess(user);
  } catch (err) {
    showLoginError(err.message || 'Login failed. Check your credentials.');
    btnLogin.textContent = 'Sign in';
    btnLogin.disabled = false;
  }
});

// ============================================
// REGISTER
// ============================================
btnRegister.addEventListener('click', async () => {
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showLoginError('Please enter email and password to create account.');
    return;
  }

  btnRegister.textContent = 'Creating account...';
  btnRegister.disabled = true;

  try {
    await register(email, password);
    loginError.classList.remove('hidden');
    loginError.style.background   = '#0A2A0A';
    loginError.style.borderColor  = '#16A34A';
    loginError.style.color        = '#86EFAC';
    loginError.textContent        = 'Account created — you can now sign in.';
  } catch (err) {
    showLoginError(err.message || 'Registration failed.');
  } finally {
    btnRegister.textContent = 'Create account';
    btnRegister.disabled = false;
  }
});

function showLoginError(msg) {
  loginError.textContent = msg;
  loginError.style.background  = '';
  loginError.style.borderColor = '';
  loginError.style.color       = '';
  loginError.classList.remove('hidden');
}

function onLoginSuccess(user) {
  isAuthenticated = true;
  userEmailEl.textContent = user.email;
  showScreen('dashboard');
  addLogEntry('success', `Signed in as ${user.email}`);
}

// ============================================
// LOGOUT
// ============================================
btnLogout.addEventListener('click', async () => {
  if (convoyRunning) await sendCommand('STOP');
  stopGPSPolling();
  stopAlertPolling();
  await logout();
  isAuthenticated = false;
  fingerprintDone = false;
  destinationSet  = false;
  convoyRunning   = false;
  btnStart.disabled = true;
  showScreen('login');
});

// ============================================
// FINGERPRINT — Edit 19: success icon
// ============================================
fpArea.addEventListener('click', () => {
  if (fingerprintDone) return;

  fpArea.classList.add('scanning');
  fpLabel.textContent = 'Scanning...';

  setTimeout(() => {
    fpArea.classList.remove('scanning');
    fpArea.classList.add('verified');

    // Edit 19 — success icon in label
    fpLabel.innerHTML =
      '<img src="icons/success.png" class="success-icon" alt=""> Verified';

    authStatus.classList.remove('hidden');
    fingerprintDone = true;
    addLogEntry('success', 'Driver identity verified via fingerprint');
    checkStartReady();
  }, 2000);
});

// ============================================
// DESTINATION
// ============================================
let destinationLat = null;
let destinationLng = null;

const btnUseLocation = document.getElementById('btn-use-location');
const destCoords     = document.getElementById('dest-coords');

destInput.addEventListener('change', () => {
  const val = destInput.value.trim();
  if (!val) return;

  destinationSet = true;
  destName.textContent = val;
  destStatus.classList.remove('hidden');

  if (typeof google !== 'undefined' && mapReady) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: val }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const loc = results[0].geometry.location;
        destinationLat = loc.lat();
        destinationLng = loc.lng();
        setDestinationOnMap(destinationLat, destinationLng, val);
        map.panTo(loc);
        destCoords.textContent = `${destinationLat.toFixed(6)}, ${destinationLng.toFixed(6)}`;
        destCoords.classList.remove('hidden');
      }
    });
  }

  addLogEntry('info', `Destination set: ${val}`);
  checkStartReady();
});

// ---- USE MY CURRENT LOCATION BUTTON ----
// Uses the browser's Geolocation API — same idea as
// tapping the locate-me button in Google Maps
btnUseLocation.addEventListener('click', () => {
  if (!navigator.geolocation) {
    addLogEntry('warning', 'Geolocation is not supported on this browser');
    return;
  }

  btnUseLocation.disabled = true;
  btnUseLocation.textContent = 'Locating...';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      destinationLat  = lat;
      destinationLng  = lng;
      destinationSet  = true;

      const label = `Current location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
      destInput.value = label;
      destName.textContent = label;
      destStatus.classList.remove('hidden');

      destCoords.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      destCoords.classList.remove('hidden');

      if (typeof google !== 'undefined' && mapReady) {
        setDestinationOnMap(lat, lng, label);
        map.panTo({ lat, lng });
        map.setZoom(17);
      }

      addLogEntry('success', `Destination set to current location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      checkStartReady();

      // Generate 10 Maps link variations pointing to this exact spot,
      // pick one randomly, and send it to Car-1 to use for the
      // accident WhatsApp message later.
      const accidentLink = generateAccidentLink(lat, lng);
      sendLocationToCar1(lat, lng, accidentLink);

      btnUseLocation.disabled = false;
      btnUseLocation.innerHTML = '<img src="icons/destination.png" class="btn-location-icon" alt="locate"> Use my location';
    },
    (error) => {
      addLogEntry('warning', `Could not get location: ${error.message}`);
      btnUseLocation.disabled = false;
      btnUseLocation.innerHTML = '<img src="icons/destination.png" class="btn-location-icon" alt="locate"> Use my location';
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
});

function checkStartReady() {
  btnStart.disabled = !(fingerprintDone && destinationSet);
}

// ============================================
// GENERATE 10 GOOGLE MAPS LINK VARIATIONS
// All point to the exact same coordinates, but
// formatted slightly differently so each looks
// like a distinct, real GPS reading during the
// demo. One is picked randomly each time.
// ============================================
function generateAccidentLink(lat, lng) {
  const latStr = lat.toFixed(6);
  const lngStr = lng.toFixed(6);

  const variations = [
    `https://maps.google.com/?q=${latStr},${lngStr}`,
    `https://www.google.com/maps?q=${latStr},${lngStr}`,
    `https://maps.google.com/maps?q=${latStr},${lngStr}&z=17`,
    `https://www.google.com/maps/search/?api=1&query=${latStr},${lngStr}`,
    `https://maps.google.com/?q=${latStr},${lngStr}&z=18`,
    `https://www.google.com/maps/place/${latStr},${lngStr}`,
    `https://maps.google.com/maps?q=loc:${latStr},${lngStr}`,
    `https://www.google.com/maps?q=${latStr},${lngStr}&hl=en`,
    `https://maps.google.com/?q=${latStr},${lngStr}&z=16`,
    `https://www.google.com/maps/@${latStr},${lngStr},17z`
  ];

  const randomIndex = Math.floor(Math.random() * variations.length);
  return variations[randomIndex];
}

// ============================================
// SEND LOCATION + RANDOM LINK TO CAR-1
// Car-1 stores this and uses it later if the
// accident button is pressed during the demo.
// ============================================
async function sendLocationToCar1(lat, lng, link) {
  updateESPIP();
  const url = `http://${espIP}/setLocation?lat=${lat}&lng=${lng}&link=${encodeURIComponent(link)}`;

  try {
    await fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000)
    });
    addLogEntry('info', `Sent location to Car-1: ${link}`);
  } catch (err) {
    addLogEntry('warning', `Could not send location to Car-1 — check WiFi/IP`);
  }
}

// ============================================
// START CONVOY
// ============================================
btnStart.addEventListener('click', async () => {
  convoyRunning = true;
  btnStart.classList.add('hidden');
  btnStop.classList.remove('hidden');
  setStatusBadge('running');
  setVehicleStatus('car1', 'running', 'Moving');
  setVehicleStatus('car2', 'running', 'Moving');
  addLogEntry('success', 'Convoy started — both vehicles moving');

  const ok = await sendCommand('START');
  if (!ok) addLogEntry('warning', 'ESP32 not reachable — check WiFi');

  startGPSPolling();
  startAlertPolling();
});

// ============================================
// STOP CONVOY
// ============================================
btnStop.addEventListener('click', async () => {
  convoyRunning = false;
  btnStop.classList.add('hidden');
  btnStart.classList.remove('hidden');
  setStatusBadge('idle');
  setVehicleStatus('car1', 'idle', 'Stopped');
  setVehicleStatus('car2', 'idle', 'Stopped');
  stopGPSPolling();
  stopAlertPolling();
  await sendCommand('STOP');
  addLogEntry('info', 'Convoy stopped by driver');
});

// ============================================
// SHOW ALERT — Edit 20: danger icon in alert 2
// ============================================
function showAlert(level, obstacleID) {
  const obstacleNames = { 1: 'Road Bump', 2: 'Person', 3: 'Vehicle' };
  const name = obstacleNames[obstacleID] || 'Obstacle';

  alertBanner.classList.remove('hidden', 'danger-alert');

  if (level === 1) {
    alertTitle.textContent = '⚠️ Alert 1 — Obstacle Detected';
    alertDesc.textContent  = `${name} detected ahead. Car-1 slowing down. Driver: take action.`;
    alertLevelEl.textContent = 'Alert 1';
    alertLevelEl.className   = 'status-value alert';
    setVehicleStatus('car1', 'alert', 'Slowing');
    addLogEntry('warning', `Alert 1: ${name} detected — Car-1 slowing, Car-2 buzzer ON`);
  }

  if (level === 2) {
    alertBanner.classList.add('danger-alert');

    // Edit 20 — danger icon in alert 2 title
    alertTitle.innerHTML =
      '<img src="icons/danger.png" class="danger-small" alt=""> Alert 2 — Auto Response Triggered';

    alertDesc.textContent    = `Car-2 automatically slowing down. ${name} confirmed ahead.`;
    alertLevelEl.textContent = 'Alert 2';
    alertLevelEl.className   = 'status-value danger';
    setVehicleStatus('car2', 'alert', 'Auto-slow');
    addLogEntry('danger', 'Alert 2: Car-2 auto response — motors reduced, buzzer ON');
    setStatusBadge('alert');
  }

  lastEventEl.textContent = new Date().toLocaleTimeString();
}

// ============================================
// ACCIDENT OVERLAY
// ============================================
function showAccident(lat, lng, mapLink) {
  accidentOverlay.classList.remove('hidden');
  const coords = `${lat ?? 'Unknown'}, ${lng ?? 'Unknown'}`;
  accidentLoc.textContent = `GPS: ${coords}`;

  // Use the link Car-1 reports back (the one randomly picked
  // when location was set) if available, otherwise build one
  const link = mapLink || (lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : '#');
  accidentLink.href = link;

  if (lat && lng) flashAccidentMarker();

  setStatusBadge('danger');
  setVehicleStatus('car1', 'danger', 'Accident');
  addLogEntry('danger', `ACCIDENT: Car-1 stopped at ${coords}`);
  logEvent('accident', `Car-1 accident at ${coords} — ${link}`, lat, lng);
}

accidentDismiss.addEventListener('click', () => {
  accidentOverlay.classList.add('hidden');
});

alertClose.addEventListener('click', () => {
  alertBanner.classList.add('hidden');
});

// ============================================
// STATUS HELPERS
// ============================================
function setStatusBadge(state) {
  statusBadge.className = `status-badge ${state}`;
  const labels = { idle: 'IDLE', running: 'RUNNING', alert: 'ALERT', danger: 'DANGER' };
  statusBadge.textContent = labels[state] ?? state.toUpperCase();
}

function setVehicleStatus(car, state, label) {
  const el = document.getElementById(`${car}-status`);
  if (!el) return;
  el.textContent = label;
  el.className   = `status-value ${state}`;
}

// ============================================
// EVENT LOG
// ============================================
function addLogEntry(type, message) {
  const empty = eventLog.querySelector('.log-empty');
  if (empty) empty.remove();

  const time = new Date().toLocaleTimeString();
  const item = document.createElement('div');
  item.className = `log-item ${type}`;
  item.innerHTML = `
    <span class="log-time">${time}</span>
    <span class="log-msg">${message}</span>
  `;
  eventLog.insertBefore(item, eventLog.firstChild);
  while (eventLog.children.length > 50) eventLog.removeChild(eventLog.lastChild);
}

btnClearLog.addEventListener('click', () => {
  eventLog.innerHTML = '<div class="log-empty">Log cleared.</div>';
});

// ============================================
// CHECK SESSION ON LOAD
// ============================================
window.addEventListener('load', async () => {
  try {
    const user = await getUser();
    if (user) onLoginSuccess(user);
    else showScreen('login');
  } catch {
    showScreen('login');
  }
});
