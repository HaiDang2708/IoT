const EventEmitter = require('events');
const mysqlSensorService = require('../services/mysqlSensorService');
const mysqlDeviceService = require('../services/mysqlDeviceService');

const deviceAckEmitter = new EventEmitter();
deviceAckEmitter.setMaxListeners(50);

let isEsp32OnlineBE = false;

function getIsEsp32Online() {
  return isEsp32OnlineBE;
}

// Timer theo dõi Heartbeat của ESP32 (quá 8 giây không nhận tin tức sẽ coi như OFFLINE)
let espHeartbeatTimer = null;

function resetEspHeartbeatTimer() {
  isEsp32OnlineBE = true;
  if (espHeartbeatTimer) clearTimeout(espHeartbeatTimer);
  espHeartbeatTimer = setTimeout(async () => {
    console.log('[Heartbeat Timeout] Không nhận được tín hiệu cảm biến từ ESP32 trong 8 giây. Coi như ESP32 đã OFFLINE.');
    isEsp32OnlineBE = false;
    await mysqlDeviceService.handleEsp32Offline();
  }, 8000);
}

// Chờ phản hồi ACK trạng thái từ ESP32 qua topic Device_respond
function waitForDeviceAck(deviceCode, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const code = (deviceCode || '').toLowerCase();
    const eventName = `ack:${code}`;

    let timer = null;

    const onAck = ({ isON }) => {
      if (timer) clearTimeout(timer);
      deviceAckEmitter.removeListener(eventName, onAck);
      resolve({ received: true, isON });
    };

    timer = setTimeout(() => {
      deviceAckEmitter.removeListener(eventName, onAck);
      resolve({ received: false });
    }, timeoutMs);

    deviceAckEmitter.on(eventName, onAck);
  });
}

// Bộ xử lý trung tâm điều phối toàn bộ tin nhắn MQTT nhận được từ broker
async function handleMqttMessage(topic, payload) {
  const msg = payload.toString().trim();

  try {
    // 1. Topic SENSOR: "Sensor"
    if (topic === 'Sensor') {
      resetEspHeartbeatTimer();
      let data = {};
      try {
        data = JSON.parse(msg);
      } catch (e) {
        return;
      }

      const tempVal = data.temperature !== undefined ? parseFloat(data.temperature) : null;
      const humVal = data.humidity !== undefined ? parseFloat(data.humidity) : null;
      const luxVal = data.light !== undefined ? parseFloat(data.light) : null;

      if (tempVal !== null && !isNaN(tempVal)) {
        mysqlSensorService.lastSensorReading.temp = tempVal;
        mysqlSensorService.lastSensorReading.isUpdated = true;
      }

      if (humVal !== null && !isNaN(humVal)) {
        mysqlSensorService.lastSensorReading.hum = humVal;
        mysqlSensorService.lastSensorReading.isUpdated = true;
      }

      if (luxVal !== null && !isNaN(luxVal)) {
        mysqlSensorService.lastSensorReading.lux = luxVal;
        mysqlSensorService.lastSensorReading.isUpdated = true;
      }
    }

    // 2. Topic DEVICE_RESPOND: "Device_respond"
    else if (topic === 'Device_respond') {
      resetEspHeartbeatTimer();

      let data = {};
      try {
        data = JSON.parse(msg);
      } catch (e) {
        return;
      }

      // Xử lý định dạng: {"LED1":"ON", "LED2":"OFF", "LED3":"ON"}
      const devKeys = { led1: data.LED1, led2: data.LED2, led3: data.LED3 };
      for (const [code, val] of Object.entries(devKeys)) {
        if (val !== undefined) {
          const isON = (val === 'ON' || val === true || val === 1);
          await mysqlDeviceService.syncDevicePhysicalState(code, isON);
          await mysqlDeviceService.resolvePendingDeviceLogs(code, 'SUCCESS');
          deviceAckEmitter.emit(`ack:${code}`, { isON });
        }
      }
    }
  } catch (err) {
    console.error('[Error] Lỗi đọc và cập nhật thông tin tin nhắn MQTT:', err.message);
  }
}

module.exports = {
  handleMqttMessage,
  getIsEsp32Online,
  waitForDeviceAck
};
