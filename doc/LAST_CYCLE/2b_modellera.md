# Steg 2b: Modellera Parallell 3-Agent Uppkoppling (TCK-022d)

## 1. Parallell Uppkoppling i `connectLive`
```typescript
const channels: Array<{ channel: SwarmAudioChannel; instruction: string }> = [
  { channel: 'forlikas', instruction: 'Försoningsmotorns kompass aktiv.' },
  { channel: 'folja', instruction: 'Att följa: Lösningen för närhet.' },
  { channel: 'vanda_om', instruction: 'Att vända om: Inåtriktad ödmjulhet.' },
];

const sessions = await Promise.all(
  channels.map(({ channel, instruction }) =>
    (this.aiClient as any).live.connect(makeAgentConfig(channel, instruction))
  )
);

channels.forEach(({ channel }, idx) => {
  this.agentSessions.set(channel, sessions[idx]);
});
this.activeSdkSession = this.agentSessions.get('forlikas') || sessions[0];
```

## 2. Strikt thinkingConfig
```typescript
thinkingConfig: { thinkingLevel: 'high' }
```
Inga redundanta nycklar eller felaktiga case-varianter.
