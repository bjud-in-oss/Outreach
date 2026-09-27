# 2a Avgränsa: Tyst Röstspärr & Namnutlöst Ljudaktivering i Live-gränssnittet (TCK-011)

## 1. Avgränsningsmatris

| Område | Ingår i TCK-011 | Ingår INTE (Avgränsat) | Motivering |
| :--- | :--- | :--- | :--- |
| **Domän** | `src/features/gemini_live_swarm/` | Övriga moduler (`google_drive_sync`, `wal_logger`, `mcp_bridge`) | TCK-011 är strikt avgränsad till live-telemetri, ljudspärr och gränssnitt. |
| **Ljudspärr** | Tyst röstspärr under autonoma steg + selektiv öppning vid namnanrop eller Token Gate | Hårdvarukopplad ljuduppspelning via Web Audio API i enhetstester | Tester ska köras rent i minnet (< 3s) utan externa hårdvarukrav. |
| **Triggers** | Namnanrop på de 4 försoningsenheterna samt Token Gate (Steg 3c) | Generell wake-word-detektering ("Hey Google", "Alexa", etc.) | Endast systemets egna 4 försoningsenheter och fasövergångar hanteras. |
| **Enheter** | Exakt de 4 försoningsenheterna | Nya roller eller ändring av domänmodellen | Enheterna är fixerade och fullt harmoniserade sedan TCK-009. |
| **Säkerhetsspärr** | Token Gate (Steg 3c) | Källkodsändringar under Fas 1 | Inga filer under `src/` rörs förrän godkännandekoden har bekräftats. |
