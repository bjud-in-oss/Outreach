export class LiveAudioPlayer {
  private audioPlaybackCtx: AudioContext | null = null;

  public play24kHzPCMBase64(base64Data: string, onTalking?: () => void): void {
    try {
      if (!this.audioPlaybackCtx || this.audioPlaybackCtx.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioPlaybackCtx = new AudioCtx({ sampleRate: 24000 });
      }
      if (this.audioPlaybackCtx.state === 'suspended') {
        this.audioPlaybackCtx.resume();
      }

      const rawBinary = atob(base64Data);
      const bytes = new Uint8Array(rawBinary.length);
      for (let i = 0; i < rawBinary.length; i++) bytes[i] = rawBinary.charCodeAt(i);

      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const buffer = this.audioPlaybackCtx.createBuffer(1, float32Array.length, 24000);
      buffer.getChannelData(0).set(float32Array);
      const source = this.audioPlaybackCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioPlaybackCtx.destination);
      source.start();

      if (onTalking) onTalking();
    } catch {
      /* Playback fallback handled */
    }
  }

  public dispose(): void {
    if (this.audioPlaybackCtx && this.audioPlaybackCtx.state !== 'closed') {
      try { this.audioPlaybackCtx.close(); } catch { /* ignore */ }
      this.audioPlaybackCtx = null;
    }
  }
}