# Steg 2a: Avgränsa & Systemkontrakt (TCK-020)

## 1. Vad som SKA göras i TCK-020
- **Intent-Driven Audio & User Gesture**:
  - Koppla start av `AudioContext` och mikrofon till klick på intent-knapparna (`REFLECT`, `REMEMBER`, `CONSULT`).
  - Klick på redan aktiv knapp stänger session och sänder `"🟡 Agenter i dvala"` till `SymbolCrown`.
- **Integrerade & Adaptiva Lägesknappar i SplitPane**:
  - Lägg in knapparna på själva delningslinjen mellan navigeringspilarna.
  - Adaptiv kollaps: Inaktiva knappar minimeras till runda ikoner (`🎬`, `🧠`, `💬`) på smala skärmar medan den aktiva knappen visar full text och förstoras (`scale-105`).
- **Orientering & Enkelpilar**:
  - Identifiera skärmorientering (`portrait` vs `landscape`).
  - Porträtt: Horisontell delningslinje med vertikala pilar; dölj nedåtpil vid botten (visa enbart `[ ⇧ ]`); dölj uppåtpil vid topp (visa enbart `[ ⇩ ]`).
  - Landskap: Vertikal delningslinje med horisontella pilar (`[ ⇐ ]` / `[ ⇒ ]`).
- **Permanent SymbolCrown & Fullskärmsåtergång**:
  - SymbolCrown förblir alltid synlig i toppen.
  - Klick på pil eller toggle återställer split ratio rent från 0% eller 100% till neutralläge (50%).
- **Transienta E2E-tester (< 3s)**:
  - Validera alla delar i minnet via `src/__tests__/transient_TCK-020.test.ts`.

## 2. Vad som INTE ska göras (Avgränsningar)
- Ingen videoströmning eller bildbearbetning (planerat för senare ticket).
- Inga förändringar av Google Drive sync eller WAL logger kontrakten.
- Ingen omskrivning av Gemini Live WebSocket-kärnan från TCK-010.
