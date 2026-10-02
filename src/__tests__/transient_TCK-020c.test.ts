import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('TCK-020c Transient Verification', () => {
  it('säkerställer att alla ljudmoduler hålls under maxgränsen på 250 rader', () => {
    const sessionPath = path.resolve(__dirname, '../features/gemini_live_swarm/session/geminiLiveSession.ts');
    const audioPath = path.resolve(__dirname, '../features/gemini_live_swarm/session/sessionIntentAudio.ts');
    const playerPath = path.resolve(__dirname, '../features/gemini_live_swarm/session/liveAudioPlayback.ts');

    const sessionLines = fs.readFileSync(sessionPath, 'utf-8').split('\n').length;
    const audioLines = fs.readFileSync(audioPath, 'utf-8').split('\n').length;
    const playerLines = fs.readFileSync(playerPath, 'utf-8').split('\n').length;

    expect(sessionLines).toBeLessThan(250);
    expect(audioLines).toBeLessThan(250);
    expect(playerLines).toBeLessThan(250);
  });
});