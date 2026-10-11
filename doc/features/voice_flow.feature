# language: sv
Funktionalitet: Röstflöde, Trådisolering och Start/Paus-styrning (TCK-025)

  Bakgrund:
    Givet en aktiv Outreach Samordningsmotor med SwarmEventBus
    Och trådisolerad ljudbuffert (Worker Threads / SharedArrayBuffer)

  Scenario: VAD talidentifiering och Engine TTFT-separation
    När PCM-ljudström matas in med 16kHz sinusvåg
    Så ska VAD detektera tal inom 800 ms
    Och Engine TTFT (Time To First Token) ska understiga 1200 ms
    Och ljuduppspelningen ska förbli fri från hackningar trots High-Thinking

  Scenario: Start och Paus av röstsession med AbortController
    Givet att röstmotorn är i gång i Auto-Listen läge
    När användaren klickar på Paus-knappen
    Så ska en AbortController avbryta pågående bakgrunds-thinking
    Och ljudbufferten ska tystas omedelbart
    Och tillståndet ska frysas i WAL och STATE.json

  Scenario: Återupptagning från Paus
    Givet att röstmotorn är pausad
    När användaren klickar på Start-knappen
    Så ska sessionen återgå till Auto-Listen
    Och VAD ska återaktiveras för inkommande ljud
