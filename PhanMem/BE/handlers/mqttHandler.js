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
  // Tương thích nếu caller truyền 3 tham số (deviceCode, targetState, timeoutMs)
  const actualTimeout = typeof timeoutMs === 'number' ? timeoutMs : 3000;
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
    }, actualTimeout);

    deviceAckEmitter.on(eventName, onAck);
  });
}

// Bộ xử lý trung tâm điều phối toàn bộ tin nhắn MQTT nhận được từ broker
async function handleMqttMessage(topic, payload) {
  const msg = payload.toString().trim();

  try {
    // 1. Topic SENSOR: "Sensor" hoặc "dang_iot_b23dcat036/sensor"
    if (topic === 'Sensor' || topic === 'dang_iot_b23dcat036/sensor') {
      resetEspHeartbeatTimer();
      let data = {};
      try {
        data = JSON.parse(msg);
      } catch (e) {
        return;
      }

      const tempVal = data.temperature !== undefined ? parseFloat(data.temperature) : data.temp !== undefined ? parseFloat(data.temp) : null;
      const humVal = data.humidity !== undefined ? parseFloat(data.humidity) : data.hum !== undefined ? parseFloat(data.hum) : null;
      const luxVal = data.light !== undefined ? parseFloat(data.light) : data.lux !== undefined ? parseFloat(data.lux) : null;

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

    // 2. Topic DEVICE_RESPOND: "Device_respond" hoặc "dang_iot_b23dcat036/device_respond"
    else if (topic === 'Device_respond' || topic === 'dang_iot_b23dcat036/device_respond') {
      resetEspHeartbeatTimer();

      let data = {};
      try {
        data = JSON.parse(msg);
      } catch (e) {
        return;
      }

      if (data.esp_status === 'OFFLINE') {
        await mysqlDeviceService.handleEsp32Offline();
        return;
      }

      // Xử lý định dạng: {"LED1":"ON", "LED2":"OFF", "LED3":"ON"}
      const devMappings = [
        { code: 'led1', keys: ['LED1', 'led1', 'LED_1'] },
        { code: 'led2', keys: ['LED2', 'led2', 'LED_2'] },
        { code: 'led3', keys: ['LED3', 'led3', 'LED_3'] }
      ];

      for (const item of devMappings) {
        let devVal = undefined;
        for (const k of item.keys) {
          if (data[k] !== undefined) {
            devVal = data[k];
            break;
          }
        }

        if (devVal !== undefined) {
          const isON = (typeof devVal === 'object') 
            ? (devVal.state === 'ON' || devVal.state === true || devVal.state === 1)
            : (devVal === 'ON' || devVal === true || devVal === 1);

          await mysqlDeviceService.syncDevicePhysicalState(item.code, isON);
          await mysqlDeviceService.resolvePendingDeviceLogs(item.code, 'SUCCESS');
          deviceAckEmitter.emit(`ack:${item.code.toLowerCase()}`, { isON });
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
