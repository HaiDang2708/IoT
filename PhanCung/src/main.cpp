#include <Wire.h>
#include <BH1750.h>
#include <DHT.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* ssid        = "YOUR_WIFI_SSID";     
const char* password    = "YOUR_WIFI_PASSWORD";
const char* mqtt_server = "broker.emqx.io";

// ===== 4 TOPIC MQTT =====
const char* topic_sensor  = "Sensor";
const char* topic_control = "Device_control";
const char* topic_respond = "Device_respond";
const char* topic_setting = "Device_setting";

// ===== CẤU HÌNH CHÂN GPIO =====
#define SDA_PIN     10
#define SCL_PIN     9
#define DHT_PIN     8
#define DHT_TYPE    DHT11

#define LED_1       11
#define LED_2       12
#define LED_3       7
#define PIN_LED_ALERT 6

BH1750 lightMeter;
DHT dht(DHT_PIN, DHT_TYPE);

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastRead = 0;
unsigned long lastBlink = 0;
unsigned long lastReconnectAttempt = 0;
bool alertLedState = false;

// Ngưỡng ánh sáng cảnh báo X
float thresholdLux = 300.0;
bool isAlertActive = false;

void publishDeviceRespond() {
  if (client.connected()) {
    JsonDocument doc;
    doc["LED1"] = (digitalRead(LED_1) == HIGH) ? "ON" : "OFF";
    doc["LED2"] = (digitalRead(LED_2) == HIGH) ? "ON" : "OFF";
    doc["LED3"] = (digitalRead(LED_3) == HIGH) ? "ON" : "OFF";

    char buffer[64];
    serializeJson(doc, buffer, sizeof(buffer));
    client.publish(topic_respond, buffer, false);
  }
}

// Hàm kiểm tra trạng thái an toàn, chống crash khi nhận sai kiểu dữ liệu
bool parseDeviceState(JsonVariant val) {
  if (val.is<bool>()) return val.as<bool>();
  if (val.is<int>()) return val.as<int>() == 1;
  if (val.is<const char*>()) {
    const char* s = val.as<const char*>();
    return (s != nullptr && (strcasecmp(s, "ON") == 0 || strcmp(s, "1") == 0));
  }
  return false;
}

// ===== NHẬN LỆNH ĐIỀU KHIỂN & CÀI ĐẶT NGƯỠNG =====
void callback(char* topic, byte* payload, unsigned int length) {
  JsonDocument doc;
  if (deserializeJson(doc, payload, length)) return;
  if (strcmp(topic, topic_setting) == 0) {
    if (!doc["threshold_lux"].isNull()) {
      thresholdLux = doc["threshold_lux"].as<float>();
      Serial.printf("[Setting] Da cap nhat nguong anh sang X: %.1f lx\n", thresholdLux);
    }
    return;
  }

  // 2. Nhận điều khiển LED
  if (strcmp(topic, topic_control) != 0) return;

  bool changed = false;

  // Điều khiển LED 1
  if (!doc["LED1"].isNull()) {
    digitalWrite(LED_1, parseDeviceState(doc["LED1"]) ? HIGH : LOW);
    changed = true;
  }

  // Điều khiển LED 2
  if (!doc["LED2"].isNull()) {
    digitalWrite(LED_2, parseDeviceState(doc["LED2"]) ? HIGH : LOW);
    changed = true;
  }

  // Điều khiển LED 3
  if (!doc["LED3"].isNull()) {
    digitalWrite(LED_3, parseDeviceState(doc["LED3"]) ? HIGH : LOW);
    changed = true;
  }

  if (changed) {
    publishDeviceRespond();
  }
}

// ===== KẾT NỐI LẠI MQTT =====
void reconnect() {
  unsigned long now = millis();
  if (now - lastReconnectAttempt >= 5000) {
    lastReconnectAttempt = now;
    String clientId = "ESP32_HaiDang_" + String((uint32_t)ESP.getEfuseMac(), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println(" Connected!");
      client.subscribe(topic_control);
      client.subscribe(topic_setting);
      publishDeviceRespond();
    } else {
      Serial.print(" Failed, rc=");
      Serial.print(client.state());
      Serial.println(" Retry in 5s...");
    }
  }
}

// ===== SETUP =====
void setup() {
  Serial.begin(115200);

  pinMode(LED_1, OUTPUT);
  pinMode(LED_2, OUTPUT);
  pinMode(LED_3, OUTPUT);
  pinMode(PIN_LED_ALERT, OUTPUT);

  digitalWrite(LED_1, LOW);
  digitalWrite(LED_2, LOW);
  digitalWrite(LED_3, LOW);
  digitalWrite(PIN_LED_ALERT, LOW);

  Wire.begin(SDA_PIN, SCL_PIN);
  lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE);
  dht.begin();

  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.setTxPower(WIFI_POWER_8_5dBm);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected! IP: ");
  Serial.println(WiFi.localIP());

  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

// ===== LOOP =====
void loop() {
  if (!client.connected()) {
    reconnect();
  } else {
    client.loop();
  }

  // Nháy LED cảnh báo khi vượt ngưỡng X
  if (isAlertActive) {
    if (millis() - lastBlink >= 400) {
      lastBlink = millis();
      alertLedState = !alertLedState;
      digitalWrite(PIN_LED_ALERT, alertLedState ? HIGH : LOW);
    }
  } else {
    digitalWrite(PIN_LED_ALERT, LOW);
    alertLedState = false;
  }

  if (millis() - lastRead >= 3000) {
    lastRead = millis();

    float temp = dht.readTemperature();
    float humid = dht.readHumidity();
    float lux = lightMeter.readLightLevel();

    if (!isnan(temp) && !isnan(humid) && !isnan(lux) && lux >= 0) {
      Serial.printf("[Sensor] Temp: %.1f *C | Hum: %.1f %% | Lux: %.1f lx (Nguong: %.1f lx)\n", temp, humid, lux, thresholdLux);

      // Kích hoạt trạng thái cảnh báo nếu Ánh Sáng > X
      isAlertActive = (lux > thresholdLux);

      // Gửi dữ liệu lên topic Sensor
      JsonDocument doc;
      doc["temperature"] = serialized(String(temp, 1));
      doc["humidity"] = serialized(String(humid, 1));
      doc["light"] = serialized(String(lux, 1));

      char sensorBuffer[96];
      serializeJson(doc, sensorBuffer, sizeof(sensorBuffer));
      client.publish(topic_sensor, sensorBuffer);
    }
  }
}
