// Thư viện kết nối giao thức MQTT
const mqtt = require('mqtt');

// Địa chỉ kết nối đến MQTT Broker (Ưu tiên đọc từ biến môi trường .env)
const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://broker.emqx.io:1883';
console.log(`[MQTT] Dang ket noi den broker tai: ${brokerUrl}...`);

// Khởi tạo thực thể MQTT Client với các cấu hình kết nối lại tự động
const clientOptions = {
  clientId: process.env.MQTT_CLIENT_ID || 'dang_iot_backend_bridge_' + Math.random().toString(16).slice(2, 8),
  clean: true,
  reconnectPeriod: 4000 // Thử kết nối lại sau mỗi 4 giây nếu mất mạng
};

if (process.env.MQTT_USERNAME && process.env.MQTT_USERNAME.trim() !== '') {
  clientOptions.username = process.env.MQTT_USERNAME.trim();
}
if (process.env.MQTT_PASSWORD && process.env.MQTT_PASSWORD.trim() !== '') {
  clientOptions.password = process.env.MQTT_PASSWORD.trim();
}

const client = mqtt.connect(brokerUrl, clientOptions);

// Danh sách 4 Topic chuẩn chính thức trong hệ thống IoT
const coreTopics = {
  SENSOR: 'Sensor',
  DEVICE_CONTROL: 'Device_control',
  DEVICE_RESPOND: 'Device_respond',
  DEVICE_SETTING: 'Device_setting'
};

module.exports = {
  client,
  coreTopics
};
