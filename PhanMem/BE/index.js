require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { client, coreTopics } = require('./config/mqtt');
const { handleMqttMessage } = require('./handlers/mqttHandler');
const mysqlSensorService = require('./services/mysqlSensorService');
const apiRouter = require('./routes/api');

// 1. Khởi chạy thực thi bộ đệm cảm biến lúc khởi động
async function initSystem() {
  try {
    await mysqlSensorService.initializeSensorCache();
    console.log('✅ [System] Khởi tạo bộ đệm CSDL (MySQL) thành công.');
  } catch (err) {
    console.error('❌ [System Error] Gặp lỗi khi khởi tạo hệ thống:', err.message);
  }
}
initSystem();

// 2. Cài đặt các sự kiện cho MQTT Client
client.on('connect', () => {
  console.log('☁️  [MQTT Broker] Đã kết nối thành công tới broker (broker.emqx.io:1883).');
  
  const topics = [
    coreTopics.SENSOR,
    coreTopics.DEVICE_RESPOND
  ];
  
  client.subscribe(topics, (err) => {
    if (err) console.error('❌ [MQTT] Subscription failed:', err.message);
    else console.log(`📡 [MQTT] Đã đăng ký lắng nghe các topic: ${topics.join(', ')}`);
  });
});

client.on('message', handleMqttMessage);

client.on('error', (err) => {
  console.error('❌ [MQTT Error]:', err.message);
});

// 3. Khởi tạo Express API Server phục vụ cho Frontend
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
==================================================
🚀 SMART HOME BACKEND SERVER READY
🌐 REST API Server : http://localhost:${PORT}/api
🗄️ MySQL Database  : Connected (dang_iot)
☁️ MQTT Broker     : broker.emqx.io:1883
==================================================
  `);
});

// 4. Khởi chạy chu kỳ ghi log cảm biến (mặc định 3 giây)
mysqlSensorService.startLoggingInterval(3);
