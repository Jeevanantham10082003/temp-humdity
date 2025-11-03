## ESP8266 DHT11 Monitor (Vercel + Local)

### Features
- Clean, responsive UI (mobile/desktop)
- Live polling and mini chart (Chart.js)
- Simple API: `POST /api/push` and `GET /api/latest`
- Works on Vercel and locally

### Run locally
```bash
node server.js
# open http://localhost:3000
```

ESP8266 should `POST` JSON to `http://<your_pc_ip>:3000/api/push`:
```json
{ "temperature": 26.4, "humidity": 58.3 }
```

### Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Clone or download this repository
3. Open terminal in the project directory
4. Login to Vercel (if not already):
   ```bash
   vercel login
   ```
5. Deploy to preview:
   ```bash
   vercel
   ```
6. Deploy to production:
   ```bash
   vercel --prod
   ```
7. Your project will be live at `https://<project-name>.vercel.app`

Note: For first-time deployment, Vercel CLI will ask:
- Set up and deploy? → Yes
- Which scope? → Select your account
- Link to existing project? → No
- Project name? → Enter name or accept default
- Directory? → ./ (current directory)
- Override settings? → No

On free plans, serverless memory is ephemeral; this app shows the latest pushed reading only.

### ESP8266 wiring (as requested)
- DHT11 DATA → ESP8266 `D3` (GPIO0)
- LCD I2C `SDA` → ESP8266 `D7` (GPIO13)
- LCD I2C `SCL` → ESP8266 `D5` (GPIO14)

### Arduino sketch
See `esp8266_dht11_lcd.ino` for Wi-Fi, DHT11 read, LCD I2C, and HTTP push.

## ESP8266 + DHT11 Monitor (Web UI)

Neat and clean responsive dashboard to monitor DHT11 sensor values from an ESP8266. Built with plain HTML, CSS, and JavaScript. Deploy-ready for Vercel.

### Wiring (as requested)
- DHT11 data → ESP8266 `D3` (the DHT board might label the pin `D0` on itself)
- LCD I2C: `SDA → D7`, `SCL → D5` on ESP8266

### Expected ESP8266 endpoint
The UI polls a configurable endpoint (default path `/sensor`) on your ESP8266 which should return JSON like:

```json
{ "temperature": 26.3, "humidity": 51.2, "heatIndex": 27.4, "timestamp": 1699999999999 }
```

Flexible keys are supported as fallbacks: `temperature|temp|t`, `humidity|hum|h`, `heatIndex|hi`, and `timestamp|time`.

### Local usage
1. Open `index.html` in a browser.
2. Click Settings, set your device base URL (e.g. `http://192.168.1.80`) and path (`/sensor`).
3. Save. The dashboard will poll every 5s by default.

### Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. From this folder, run: `vercel` and follow prompts (or `vercel --prod` for production).
3. The site is static; `vercel.json` disables caching so you always see fresh data.

If your ESP8266 is on a private LAN and the site is public on Vercel, the browser can only reach the ESP if you are on the same network or if you expose the device on the internet via port forwarding/VPN/reverse proxy. Alternatively, you can implement a small cloud relay to receive device updates and serve them to the UI.

### Notes
- All settings are stored in `localStorage` only.
- Poll timeout is 4s; status badge shows Connected/Disconnected.
- Heat Index is computed client-side if not provided by the device.


