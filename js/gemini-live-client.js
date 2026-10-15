/**
 * Gemini Multimodal Live API Client (ES Module)
 * Connects to Gemini Live via Ephemeral Token or Backend WebSocket Proxy Relay.
 * Manages:
 * 1. Session token retrieval from backend
 * 2. Setup handshake (model, voice, science guide personality)
 * 3. Bidirectional streaming (16kHz PCM audio & 1 FPS JPEG camera frames)
 * 4. Audio output parsing & barge-in (interruption) detection
 */

import { CONFIG } from './config.js';

export class GeminiLiveClient {
  constructor(options = {}) {
    this.ws = null;
    this.isConnected = false;
    this.isSetupComplete = false;

    // Callbacks
    this.onReady = options.onReady || (() => {});
    this.onAudioChunk = options.onAudioChunk || (() => {});
    this.onTranscript = options.onTranscript || (() => {});
    this.onInterrupted = options.onInterrupted || (() => {});
    this.onTurnComplete = options.onTurnComplete || (() => {});
    this.onError = options.onError || (() => {});
    this.onClose = options.onClose || (() => {});
  }

  /**
   * Fetches session credentials from backend and establishes WebSocket connection
   */
  async connect() {
    const backendUrl = CONFIG.getBackendUrl();

    // 1. Request session from backend
    let sessionData;
    try {
      const response = await fetch(`${backendUrl}/api/session-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      sessionData = await response.json();
      if (!response.ok || !sessionData.ok) {
        throw new Error(sessionData.error || `Failed to provision session (${response.status})`);
      }
    } catch (err) {
      console.error('[GeminiLiveClient] Session provisioning failed:', err);
      throw new Error(`Backend connection error: ${err.message}`);
    }

    // 2. Determine WebSocket URL
    let wsUrl;
    if (sessionData.mode === 'ephemeral' && sessionData.token) {
      console.log('[GeminiLiveClient] Connecting directly using Google Ephemeral Token...');
      const endpoint = sessionData.wsEndpoint || 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained';
      wsUrl = `${endpoint}?access_token=${sessionData.token}`;
    } else {
      console.log('[GeminiLiveClient] Connecting via Backend WebSocket Relay Proxy...');
      // Convert HTTP(S) URL to WS(S) URL
      const wsProtocol = backendUrl.startsWith('https') ? 'wss:' : 'ws:';
      const host = backendUrl.replace(/^https?:\/\//, '');
      const path = sessionData.wsPath || '/ws/live';
      wsUrl = `${wsProtocol}//${host}${path}`;
    }

    // 3. Connect WebSocket
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);
      } catch (err) {
        return reject(err);
      }

      this.ws.onopen = () => {
        console.log('🔗 WebSocket Connected to Gemini Live API.');
        this.isConnected = true;

        // Send Initial Setup Message
        this.sendSetupMessage(sessionData);
      };

      this.ws.onmessage = async (event) => {
        try {
          let textData;
          if (event.data instanceof Blob) {
            textData = await event.data.text();
          } else {
            textData = event.data;
          }

          const message = JSON.parse(textData);
          this.handleIncomingMessage(message, resolve);
        } catch (err) {
          console.warn('[GeminiLiveClient] Error parsing incoming message:', err);
        }
      };

      this.ws.onerror = (event) => {
        console.error('[GeminiLiveClient] WebSocket error:', event);
        this.onError(new Error('WebSocket connection error.'));
        reject(new Error('WebSocket connection error.'));
      };

      this.ws.onclose = (event) => {
        console.log(`🔌 WebSocket Closed (${event.code}: ${event.reason || 'Normal closure'})`);
        this.isConnected = false;
        this.isSetupComplete = false;
        this.onClose(event);
      };
    });
  }

  /**
   * Sends the mandatory initial setup payload
   */
  sendSetupMessage(sessionData) {
    const model = sessionData.model || 'gemini-2.5-flash';
    const voice = sessionData.voice || 'Puck';
    const systemInstruction = sessionData.systemInstruction || 'You are NeoBot, a helpful AI science robot.';

    const setupPayload = {
      setup: {
        model: `models/${model}`,
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice
              }
            }
          }
        },
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        }
      }
    };

    console.log('[GeminiLiveClient] Sending setup payload for model:', model);
    this.ws.send(JSON.stringify(setupPayload));
  }

  /**
   * Handles incoming server messages
   */
  handleIncomingMessage(message, initialResolve) {
    // 1. Setup Complete
    if (message.setupComplete) {
      console.log('✅ Gemini Live Setup Complete. Ready for real-time interaction.');
      this.isSetupComplete = true;
      if (initialResolve) initialResolve();
      this.onReady();
      return;
    }

    // 2. Server Content (Audio parts, text, barge-in)
    if (message.serverContent) {
      const { modelTurn, interrupted, turnComplete } = message.serverContent;

      // Handle Barge-in (visitor interrupted robot mid-speech)
      if (interrupted) {
        console.log('⚡ User interrupted robot speech (Barge-in). Flushing audio queue.');
        this.onInterrupted();
      }

      // Handle Model Voice Output
      if (modelTurn?.parts) {
        for (const part of modelTurn.parts) {
          // Audio Chunk (24kHz PCM base64)
          if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/')) {
            this.onAudioChunk(part.inlineData.data);
          }
          // Optional Text Transcript
          if (part.text) {
            this.onTranscript(part.text);
          }
        }
      }

      if (turnComplete) {
        this.onTurnComplete();
      }
    }

    // 3. Go Away Frame (session time limit warning)
    if (message.goAway) {
      console.warn('⚠️ Gemini Live sent goAway notice. Session expiring soon.');
    }
  }

  /**
   * Streams 16kHz PCM audio chunk to Gemini
   */
  sendAudioChunk(base64Pcm) {
    if (!this.isConnected || !this.isSetupComplete || !this.ws) return;

    const payload = {
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Pcm
          }
        ]
      }
    };

    this.ws.send(JSON.stringify(payload));
  }

  /**
   * Streams 1 FPS JPEG camera frame to Gemini
   */
  sendVideoFrame(base64Jpeg) {
    if (!this.isConnected || !this.isSetupComplete || !this.ws) return;

    const payload = {
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: 'image/jpeg',
            data: base64Jpeg
          }
        ]
      }
    };

    this.ws.send(JSON.stringify(payload));
  }

  /**
   * Closes the connection and cleans up resources
   */
  disconnect() {
    this.isConnected = false;
    this.isSetupComplete = false;

    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close(1000, 'User stopped interaction');
        }
      } catch (e) {
        // Ignore close error
      }
      this.ws = null;
    }
  }
}
