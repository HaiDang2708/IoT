#include <Wire.h>
#include <BH1750.h>
#include <DHT.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* ssid        = "YOUR_WIFI_SSID";     
const char* password    = "YOUR_WIFI_PASSWORD";
const char* mqtt_server = "broker.emqx.io";

// ===== 3 TOPIC MQTT =====
const char* topic_sensor  = "Sensor";
const char* topic_control = "Device_control";
const char* topic_respond = "Device_respond";

// ===== CẤU HÌNH CHÂN GPIO =====
#define SDA_PIN     10
#define SCL_PIN     9
#define DHT_PIN     8
#define DHT_TYPE    DHT11

#define LED_1       11
#define LED_2       12
#define LED_3       7

BH1750 lightMeter;
DHT dht(DHT_PIN, DHT_TYPE);

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastRead = 0;

void publishDeviceRespond() {
  if (client.connected()) {
    JsonDocument doc;
    doc["LED1"] = (digitalRead(LED_1) == HIGH) ? "ON" : "OFF";
    doc["LED2"] = (digitalRead(LED_2) == HIGH) ? "ON" : "OFF";
    doc["LED3"] = (digitalRead(LED_3) == HIGH) ? "ON" : "OFF";

    char buffer[128];
    serializeJson(doc, buffer, sizeof(buffer));
    client.publish(topic_respond, buffer, false);
  }
}

// ===== NHẬN LỆNH ĐIỀU KHIỂN (Device_control) =====
void callback(char* topic, byte* payload, unsigned int length) {
  if (strcmp(topic, topic_control) != 0) return;

  JsonDocument doc;
  if (deserializeJson(doc, payload, length)) return;

  bool changed = false;

  // Điều khiển LED 1 (Manual ON / OFF)
  if (!doc["LED1"].isNull()) {
    const char* val = doc["LED1"];
    digitalWrite(LED_1, strcmp(val, "ON") == 0 ? HIGH : LOW);
    changed = true;
  }

  // Điều khiển LED 2 (Manual ON / OFF)
  if (!doc["LED2"].isNull()) {
    const char* val = doc["LED2"];
    digitalWrite(LED_2, strcmp(val, "ON") == 0 ? HIGH : LOW);
    changed = true;
  }

  // Điều khiển LED 3 (Manual ON / OFF)
  if (!doc["LED3"].isNull()) {
    const char* val = doc["LED3"];
    digitalWrite(LED_3, strcmp(val, "ON") == 0 ? HIGH : LOW);
    changed = true;
  }

  if (changed) {
    publishDeviceRespond();
  }
}

// ===== KẾT NỐI LẠI MQTT =====
void reconnect() {
  while (!client.connected()) {
    String clientId = "ESP32_HaiDang_" + String((uint32_t)ESP.getEfuseMac(), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println(" Connected!");
      client.subscribe(topic_control);
      publishDeviceRespond();
    } else {
      Serial.print(" Failed, rc=");
      Serial.print(client.state());
      Serial.println(" Retry in 5s...");
      delay(5000);
    }
  }
}

// ===== SETUP =====
void setup() {
  Serial.begin(115200);

  pinMode(LED_1, OUTPUT);
  pinMode(LED_2, OUTPUT);
  pinMode(LED_3, OUTPUT);

  digitalWrite(LED_1, LOW);
  digitalWrite(LED_2, LOW);
  digitalWrite(LED_3, LOW);

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
  }
  client.loop();

  if (millis() - lastRead >= 3000) {
    lastRead = millis();

    float temp = dht.readTemperature();
    float humid = dht.readHumidity();
    float lux = lightMeter.readLightLevel();

    if (!isnan(temp) && !isnan(humid) && !isnan(lux) && lux >= 0) {
      Serial.printf("[Sensor] Temp: %.1f *C | Hum: %.1f %% | Lux: %.1f lx\n", temp, humid, lux);

      // Gửi dữ liệu lên topic Sensor
      JsonDocument doc;
      doc["temperature"] = serialized(String(temp, 1));
      doc["humidity"] = serialized(String(humid, 1));
      doc["light"] = serialized(String(lux, 1));

      char sensorBuffer[128];
      serializeJson(doc, sensorBuffer, sizeof(sensorBuffer));
      client.publish(topic_sensor, sensorBuffer);
    }
  }
}
