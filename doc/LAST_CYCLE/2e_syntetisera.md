# Steg 2e: Syntetisera & Förlika Målkonflikter (TCK-022d)

## 1. Målkonflikter & Förlikning
- **Konflikt 1**: 3 samtidiga Bidi-anslutningar vs Resursförbrukning och fellägen vid nätverksfel.
  - *Förlikning*: Parallell uppkoppling via `Promise.all` initierar alla tre försoningskrafter samtidigt vid sessionens start. Om en misslyckas stängs de övriga via Fail Fast och felmeddelandet rapporteras omedelbart på `SwarmEventBus`.
- **Konflikt 2**: SDK:ns tolerans för `thinkingConfig`-fält.
  - *Förlikning*: Bidi Live API i v1alpha validerar strikt `thinkingConfig`. Genom att använda exakt `{ thinkingLevel: 'high' }` utan redundanta dupliceringar accepteras payloaden direkt vid handshaken.
- **Konflikt 3**: Radantal och AST-komplexitet i `geminiLiveSession.ts`.
  - *Förlikning*: Genom att samla kanaler och instruktioner i en array och köra en kompakt `map` bibehålls linjeantalet väl under 250 rader.

MÄTTNAD: JA
