/**
 * Frontend Configuration Module (ES Module)
 */

const DEFAULT_DEV_BACKEND = 'http://localhost:3000';

export const CONFIG = {
  // Can be configured in settings modal or persisted in localStorage
  getBackendUrl() {
    const saved = localStorage.getItem('neobot_backend_url');
    if (saved && saved.trim() !== '') {
      return saved.trim().replace(/\/+$/, '');
    }
    // If running on localhost or 127.0.0.1, default to port 3000
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return DEFAULT_DEV_BACKEND;
    }
    // For GitHub Pages, fallback to default Render URL or prompt user
    return 'https://neobot-backend.onrender.com';
  },

  setBackendUrl(url) {
    if (url) {
      localStorage.setItem('neobot_backend_url', url.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem('neobot_backend_url');
    }
  },

  // Media Capture & Gemini Live Parameters
  CAMERA_FPS: 1,                // 1 frame per second (optimal for live vision & bandwidth)
  CAMERA_QUALITY: 0.6,          // JPEG compression quality (0.0 to 1.0)
  CAMERA_MAX_WIDTH: 640,        // Scaled resolution for vision
  CAMERA_MAX_HEIGHT: 480,
  
  AUDIO_INPUT_SAMPLE_RATE: 16000,   // Required by Gemini Live API (16kHz PCM)
  AUDIO_OUTPUT_SAMPLE_RATE: 24000,  // Gemini Live speech output rate (24kHz PCM)
  AUDIO_CHANNELS: 1                 // Mono audio
};
