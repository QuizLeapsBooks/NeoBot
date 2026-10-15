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
    if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
      // If hosted on GitHub Pages, fallback to Render URL
      if (window.location.hostname.includes('github.io')) {
        return 'https://neobot-t7c2.onrender.com';
      }

      // If opened on a known local dev server port (Live Server 5500, Vite 5173, etc.),
      // redirect to the Node.js backend on port 3000
      const devPorts = ['5500', '5501', '5173', '4173', '8080', '8000'];
      if (devPorts.includes(window.location.port)) {
        return `http://${window.location.hostname}:3000`;
      }

      // Otherwise (production/Render, or already on port 3000) — use same origin
      return window.location.origin;
    }

    return DEFAULT_DEV_BACKEND;
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
