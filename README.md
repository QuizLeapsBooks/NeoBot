# NeoBot 🤖
### Interactive AI Talking Robot for School Science Exhibitions
Powered by **Google Gemini Multimodal Live API**, **Node.js + Express**, and **Vanilla HTML5/CSS/JavaScript**.

---

## 🌟 Overview

NeoBot turns a smartphone mounted inside a cardboard robot body into an autonomous, voice-interactive science exhibition guide. Visitors talk to the robot, ask science questions, and hold up projects or objects in front of the robot's camera. NeoBot listens, observes, and responds in real time with a friendly, educational robot voice.

* **Real-time Voice Interaction:** Low-latency bidirectional audio streaming using 16kHz linear PCM input and 24kHz linear PCM output.
* **Live Camera Vision:** 1 FPS downscaled snapshots allowing the AI to perceive what visitors show it.
* **Barge-In (Interruption):** Immediately stops talking when a visitor begins speaking.
* **Zero Secret Exposure:** Your permanent Google Gemini API key stays private in backend environment variables.
* **Dual-Mode Connection:**
  * **Primary:** Ephemeral Tokens for direct browser-to-Gemini low-latency WebSockets.
  * **Resilient Fallback:** Server-side WebSocket Relay Proxy if ephemeral tokens are restricted on your key tier.
* **Screen Wake Lock:** Keeps phone screen awake inside the cardboard robot.
* **Camera Flip:** Easy toggle between front and rear lenses for aperture alignment.

---

## 📁 Repository Structure

```
NeoBot/
├── index.html                 # Robot face UI & controls (GitHub Pages root)
├── server.js                  # Express backend & WebSocket proxy (Render root)
├── package.json               # ES module package scripts & dependencies
├── .env.example               # Environment variables template
├── .gitignore                 # Prevents committing .env or node_modules
│
├── css/
│   └── style.css              # Dark futuristic robot aesthetic & animations
│
├── js/
│   ├── main.js                # App lifecycle orchestrator & UI binding
│   ├── config.js              # Frontend configuration & backend URL
│   ├── audio-manager.js       # Web Audio API (16kHz capture & 24kHz player)
│   ├── camera-manager.js      # Video capture & 1 FPS JPEG downsampler
│   ├── gemini-live-client.js  # Gemini Live WebSocket protocol client
│   └── utils.js               # Float32, PCM16, and Base64 format converters
│
├── backend/
│   ├── config/
│   │   └── robot-personality.js # Science guide persona & spoken cadence rules
│   └── routes/
│       ├── session.js           # POST /api/session-token (mints ephemeral tokens)
│       └── proxy.js             # WSS /ws/live (fallback WebSocket proxy)
│
├── test-frontend.js           # Automated frontend & audio format test suite
└── test-server.js             # Automated backend & health endpoint test suite
```

---

## 🚀 Quickstart (Local Development)

### 1. Prerequisites
* Node.js v20+ installed
* A Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### 2. Setup
Clone the repository and install dependencies:
```bash
git clone https://github.com/QuizLeapsBooks/NeoBot.git
cd NeoBot
npm install
```

Create your `.env` file from the template:
```bash
cp .env.example .env
```

Open `.env` and insert your Gemini API key:
```env
PORT=3000
GEMINI_API_KEY=AIzaSy...your_actual_key_here
GEMINI_MODEL=gemini-3.8-live
GEMINI_VOICE=Puck
ROBOT_NAME=NeoBot
ALLOWED_ORIGIN=*
```

### 3. Run the Server
```bash
node server.js
```
Open **`http://localhost:3000`** on your browser.

Click **Run**, allow Camera & Microphone access, and talk to your robot!

---

## 🧪 Running Automated Tests

Run the full end-to-end verification suite (tests audio downsampling, PCM conversions, HTML structure, backend endpoints, and Gemini Live message formatting):
```bash
# Terminal 1: Start backend
node server.js

# Terminal 2: Run tests
npm test
```
All 37 automated tests will run and report status.

---

## ☁️ Deployment Guide

### A. Deploy Backend to Render (Free Web Service)
1. Push your repository to GitHub.
2. Sign in to [Render](https://render.com) and click **New + > Web Service**.
3. Select your GitHub repository (`NeoBot`).
4. Configure service settings:
   * **Root Directory:** *(leave blank / root)*
   * **Environment:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `node server.js`
5. Under **Environment Variables**, add:
   * `GEMINI_API_KEY`: *(your Google Gemini API key)*
   * `GEMINI_MODEL`: `gemini-3.8-live`
   * `GEMINI_VOICE`: `Puck`
   * `ROBOT_NAME`: `NeoBot`
   * `ALLOWED_ORIGIN`: `https://your-github-username.github.io`
6. Click **Deploy Web Service**.
7. Note down your Render backend URL (e.g., `https://neobot-backend.onrender.com`).

---

### B. Deploy Frontend to GitHub Pages
1. In your GitHub repository, navigate to **Settings > Pages**.
2. Under **Build and deployment > Source**, select **Deploy from a branch**.
3. Under **Branch**, select `main` and folder `/ (root)`.
4. Click **Save**.
5. Once deployed, open your GitHub Pages URL (e.g., `https://your-username.github.io/NeoBot/`).
6. Click the ⚙️ (Settings) icon in the top right corner, paste your Render backend URL, and click **Save Settings**.

---

## 🤖 Exhibition Day Checklist

1. **Cardboard Enclosure:** Cut an aperture for the camera lens and speaker grille.
2. **Camera Alignment:** Use the camera thumbnail on screen and tap **⇄ (Flip)** to align the camera cutout with the visitor's eye level.
3. **Bluetooth Speaker:** Pair the phone with an external Bluetooth speaker placed inside the robot chest for clear, loud audio in a crowded hall.
4. **Power:** Keep the phone plugged into a 5V/2A power bank inside the robot body so the battery lasts all day.
5. **Screen:** NeoBot automatically requests a Screen Wake Lock so the phone screen stays active without sleeping.
