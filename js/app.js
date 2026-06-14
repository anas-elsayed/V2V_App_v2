// ============================================
// app.js — Main application logic
// Handles all UI interactions and state
// ============================================

// ---- STATE ----
let isAuthenticated = false;
let fingerprintDone = false;
let destinationSet  = false;
let convoyRunning   = false;

// ---- DOM ELEMENTS ----
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

  if (name === 'login') {
    screenLogin.classList.remove('hidden');
  } else if (name === 'dashboard') {
    screenDashboard.classList.remove('hidden');
  }
}

// ============================================
// LOGIN / REGISTER
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
    showLoginError('Account created — you can now sign in.');
    loginError.style.background = '#0A2A0A';
    loginError.style.borderColor = '#16A34A';
    loginError.style.color = '#86EFAC';
  } catch (err) {
    showLoginError(err.message || 'Registration failed.');
  } finally {
    btnRegister.textContent = 'Create account';
    btnRegister.disabled = false;
  }
});

function showLoginError(msg) {
  loginError.textContent = msg;
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
  isAuthenticated  = false;
  fingerprintDone  = false;
  destinationSet   = false;
  convoyRunning    = false;
  btnStart.disabled = true;
  showScreen('login');
});

// ============================================
// FINGERPRINT SIMULATION
// ============================================
fpArea.addEventListener('click', () => {
  if (fingerprintDone) return;

  // Scanning animation
  fpArea.classList.add('scanning');
  fpLabel.textContent = 'Scanning...';

  setTimeout(() => {
    fpArea.classList.remove('scanning');
    fpArea.classList.add('verified');
    fpLabel.textContent = '✓ Verified';
    authStatus.classList.remove('hidden');
    fingerprintDone = true;

    addLogEntry('success', 'Driver identity verified via fingerprint');
    checkStartReady();
  }, 2000); // 2 second scan simulation
});

// ============================================
// DESTINATION INPUT
// ============================================
destInput.addEventListener('change', () => {
  const val = destInput.value.trim();
  if (!val) return;

  destinationSet = true;
  destName.textContent = val;
  destStatus.classList.remove('hidden');

  // If Google Maps is ready — geocode the address and show pin
  if (typeof google !== 'undefined' && mapReady) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: val }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const loc = results[0].geometry.location;
        setDestinationOnMap(loc.lat(), loc.lng(), val);
        map.panTo(loc);
      }
    });
  }

  addLogEntry('info', `Destination set: ${val}`);
  checkStartReady();
});

// ============================================
// CHECK IF START BUTTON SHOULD BE ENABLED
// Both fingerprint and destination must be done
// ============================================
function checkStartReady() {
  btnStart.disabled = !(fingerprintDone && destinationSet);
}

// ============================================
// START CONVOY
// ============================================
btnStart.addEventListener('click', async () => {
  convoyRunning = true;

  // Update UI
  btnStart.classList.add('hidden');
  btnStop.classList.remove('hidden');
  setStatusBadge('running');
  setVehicleStatus('car1', 'running', 'Moving');
  setVehicleStatus('car2', 'running', 'Moving');

  addLogEntry('success', 'Convoy started — both vehicles moving');

  // Send start command to ESP32
  const ok = await sendCommand('START');
  if (!ok) {
    addLogEntry('warning', 'ESP32 not reachable — cars may have started manually');
  }

  // Start polling GPS and alerts
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
// SHOW ALERT BANNER
// level 1 = warning, level 2 = danger
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
    alertTitle.textContent = '🚨 Alert 2 — Auto Response Triggered';
    alertDesc.textContent  = `Car-2 automatically slowing down. ${name} confirmed ahead.`;
    alertLevelEl.textContent = 'Alert 2';
    alertLevelEl.className   = 'status-value danger';
    setVehicleStatus('car2', 'alert', 'Auto-slow');
    addLogEntry('danger', `Alert 2: Car-2 auto response — motors reduced, buzzer ON`);
    setStatusBadge('alert');
  }

  lastEventEl.textContent = new Date().toLocaleTimeString();
}

// ============================================
// SHOW ACCIDENT OVERLAY
// ============================================
function showAccident(lat, lng) {
  accidentOverlay.classList.remove('hidden');

  const coords = `${lat ?? 'Unknown'}, ${lng ?? 'Unknown'}`;
  accidentLoc.textContent = `GPS: ${coords}`;

  if (lat && lng) {
    accidentLink.href = `https://maps.google.com/?q=${lat},${lng}`;
    flashAccidentMarker();
  }

  setStatusBadge('danger');
  setVehicleStatus('car1', 'danger', 'Accident');
  addLogEntry('danger', `ACCIDENT: Car-1 stopped at ${coords}`);
  logEvent('accident', `Car-1 accident at ${coords}`, lat, lng);
}

accidentDismiss.addEventListener('click', () => {
  accidentOverlay.classList.add('hidden');
});

// ============================================
// CLOSE ALERT BANNER
// ============================================
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
  // Remove empty placeholder
  const empty = eventLog.querySelector('.log-empty');
  if (empty) empty.remove();

  const time = new Date().toLocaleTimeString();
  const item = document.createElement('div');
  item.className = `log-item ${type}`;
  item.innerHTML = `
    <span class="log-time">${time}</span>
    <span class="log-msg">${message}</span>
  `;

  // Newest on top
  eventLog.insertBefore(item, eventLog.firstChild);

  // Keep max 50 entries
  while (eventLog.children.length > 50) {
    eventLog.removeChild(eventLog.lastChild);
  }
}

btnClearLog.addEventListener('click', () => {
  eventLog.innerHTML = '<div class="log-empty">Log cleared.</div>';
});

// ============================================
// CHECK EXISTING SESSION ON PAGE LOAD
// If user is already logged in — go to dashboard
// ============================================
window.addEventListener('load', async () => {
  try {
    const user = await getUser();
    if (user) {
      onLoginSuccess(user);
    } else {
      showScreen('login');
    }
  } catch {
    showScreen('login');
  }
});
