/**
 * Hjälpfunktion för att generera 16kHz 16-bit PCM sinusvågor för deterministiska BDD-tester.
 */
export function generate16kHzPcmSine(
  durationMs = 500,
  frequencyHz = 440,
  amplitude = 16000
): { samples: Int16Array; base64: string } {
  const sampleRate = 16000;
  const sampleCount = Math.floor((sampleRate * durationMs) / 1000);
  const samples = new Int16Array(sampleCount);

  for (let i = 0; i < sampleCount; i++) {
    const t = i / sampleRate;
    samples[i] = Math.round(Math.sin(2 * Math.PI * frequencyHz * t) * amplitude);
  }

  const uint8 = new Uint8Array(samples.buffer);
  let binary = '';
  for (let i = 0; i < uint8.byteLength; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  const base64 = btoa(binary);

  return { samples, base64 };
}
