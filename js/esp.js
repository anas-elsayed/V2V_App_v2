// ============================================
// esp.js — Send commands to ESP32 via WiFi
// ============================================

let espIP = '192.168.1.100';

function updateESPIP() {
  const input = document.getElementById('esp-ip');
  if (input && input.value) espIP = input.value.trim();
}

async function sendCommand(command) {
  updateESPIP();
  const url = `http://${espIP}/${command}`;
  try {
    await fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000)
    });
    console.log(`Command sent: ${command}`);
    return true;
  } catch (err) {
    console.error(`Failed to reach ESP32: ${err.message}`);
    addLogEntry('warning', `Could not reach Car-1 at ${espIP} — check WiFi`);
    return false;
  }
}

let gpsInterval = null;

function startGPSPolling() {
  if (gpsInterval) return;
  gpsInterval = setInterval(async () => {
    updateESPIP();
    try {
      const response = await fetch(`http://${espIP}/gps`, {
        signal: AbortSignal.timeout(3000)
      });
      const data = await response.json();
      if (data.lat && data.lng) {
        updateCarPosition(data.lat, data.lng);
        logEvent('gps', `Car-1 at ${data.lat}, ${data.lng}`, data.lat, data.lng);
      }
    } catch (err) { /* silent */ }
  }, 3000);
}

function stopGPSPolling() {
  if (gpsInterval) { clearInterval(gpsInterval); gpsInterval = null; }
}

let alertInterval = null;

function startAlertPolling() {
  if (alertInterval) return;
  alertInterval = setInterval(async () => {
    updateESPIP();
    try {
      const response = await fetch(`http://${espIP}/status`, {
        signal: AbortSignal.timeout(2000)
      });
      const data = await response.json();
      if (data.alert === 1) showAlert(1, data.obstacleID);
      if (data.alert === 2) showAlert(2, data.obstacleID);
      if (data.accident)   showAccident(data.lat, data.lng, data.mapLink);
    } catch (err) { /* silent */ }
  }, 1000);
}

function stopAlertPolling() {
  if (alertInterval) { clearInterval(alertInterval); alertInterval = null; }
}
