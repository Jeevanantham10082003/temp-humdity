#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>

// ================== CONFIG ==================
const char* WIFI_SSID = "Jeeva";
const char* WIFI_PASS = "27012005";
// Local:  http://<PC_IP>:3000/api/push
// Vercel: https://<your-project>.vercel.app/api/push
const char* PUSH_URL = "http://192.168.1.100:3000/api/push"; // change to your endpoint

// Pins per request: DHT11 DATA -> D3 (GPIO0); LCD I2C SDA->D7 (GPIO13), SCL->D5 (GPIO14)
#define DHTPIN D3      // GPIO0 (D3)
#define DHTTYPE DHT11
const uint8_t SDA_PIN = D7; // D7
const uint8_t SCL_PIN = D6; // D5

// LCD addr typical 0x27 or 0x3F; adjust if needed
LiquidCrystal_I2C lcd(0x27, 16, 2);
DHT dht(DHTPIN, DHTTYPE);

unsigned long lastSendMs = 0;
const unsigned long SEND_INTERVAL_MS = 5000; // 5s

void setup() {
  Serial.begin(115200);
  delay(200);

  // I2C on custom pins
  Wire.begin(SDA_PIN, SCL_PIN);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("DHT11 Monitor");

  dht.begin();

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  lcd.setCursor(0, 1);
  lcd.print("WiFi...");
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println(" connected");
  lcd.clear();
}

void loop() {
  float h = dht.readHumidity();
  float t = dht.readTemperature(); // Celsius

  if (isnan(h) || isnan(t)) {
    lcd.setCursor(0, 0);
    lcd.print("Sensor error     ");
  } else {
    // Show on LCD
    char line1[17];
    char line2[17];
    snprintf(line1, sizeof(line1), "Temp: %5.1f C", t);
    snprintf(line2, sizeof(line2), "Hum:  %5.1f %%", h);
    lcd.setCursor(0, 0);
    lcd.print(line1);
    lcd.setCursor(0, 1);
    lcd.print(line2);
  }

  unsigned long now = millis();
  if (now - lastSendMs >= SEND_INTERVAL_MS) {
    lastSendMs = now;
    if (WiFi.status() == WL_CONNECTED && !isnan(h) && !isnan(t)) {
      sendReading(t, h);
    }
  }

  delay(500);
}

void sendReading(float temperature, float humidity) {
  WiFiClient client;
  HTTPClient http;

  if (!http.begin(client, PUSH_URL)) {
    Serial.println("HTTP begin failed");
    return;
  }
  http.addHeader("Content-Type", "application/json");

  String payload = String("{") +
                   "\"temperature\":" + String(temperature, 1) + "," +
                   "\"humidity\":" + String(humidity, 1) +
                   "}";

  int code = http.POST(payload);
  Serial.printf("POST %s -> %d\n", PUSH_URL, code);
  http.end();
}


