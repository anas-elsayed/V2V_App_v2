// ============================================
// esp.js — Send commands to ESP32 via WiFi
// ESP32 runs a tiny HTTP server
// App sends GET requests to control the cars
// ============================================

let espIP = '192.168.1.100'; // Default — user can change in app

// Update IP from input field
function updateESPIP() {
  const input = document.getElementById('esp-ip');
  if (input && input.value) espIP = input.value.trim();
}

// Send a command to ESP32
// Commands: START, STOP
async function sendCommand(command) {
  updateESPIP();
  const url = `http://${espIP}/${command}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'no-cors',    // ESP32 does not send CORS headers
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    console.log(`Command sent: ${command}`);
    return true;
  } catch (err) {
    console.error(`Failed to reach ESP32: ${err.message}`);
    addLogEntry('warning', `Could not reach Car-1 at ${espIP} — check WiFi`);
    return false;
  }
}

// Poll ESP32 for GPS data every 3 seconds
let gpsInterval = null;

function startGPSPolling() {
  if (gpsInterval) return; // Already polling

  gpsInterval = setInterval(async () => {
    updateESPIP();
    const url = `http://${espIP}/gps`;

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(3000)
      });
      const data = await response.json();

      // data expected: { lat: 30.123, lng: 31.456 }
      if (data.lat && data.lng) {
        updateCarPosition(data.lat, data.lng);

        // Save to Supabase
        logEvent('gps', `Car-1 at ${data.lat}, ${data.lng}`, data.lat, data.lng);
      }
    } catch (err) {
      // Silent fail — GPS polling is background task
    }
  }, 3000);
}

function stopGPSPolling() {
  if (gpsInterval) {
    clearInterval(gpsInterval);
    gpsInterval = null;
  }
}

// Poll ESP32 for alert status every 1 second
let alertInterval = null;

function startAlertPolling() {
  if (alertInterval) return;

  alertInterval = setInterval(async () => {
    updateESPIP();
    const url = `http://${espIP}/status`;

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(2000)
      });
      const data = await response.json();

      // data expected: { alert: 0/1/2, accident: true/false, obstacleID: 1/2/3 }
      if (data.alert === 1) showAlert(1, data.obstacleID);
      if (data.alert === 2) showAlert(2, data.obstacleID);
      if (data.accident)   showAccident(data.lat, data.lng);

    } catch (err) {
      // Silent fail
    }
  }, 1000);
}

function stopAlertPolling() {
  if (alertInterval) {
    clearInterval(alertInterval);
    alertInterval = null;
  }
}
