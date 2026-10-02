# Steg 2a: Avgränsa & Systemkontrakt (TCK-019)

## 1. Vad som SKA göras i TCK-019
- **Tyst Token-Förnyelse (GIS Lifeline)**:
  - Beräkna tidpunkt för token-utgång och sätt en timer för automatisk förnyelse 5 minuter (300 sekunder) före utgång.
  - Anropa `google.accounts.oauth2.requestAccessToken({ prompt: '' })` tyst utan popup om sessionen lever.
  - Stöd injicerbar förnyelsefunktion (`TokenRefresher`) för deterministiska tester och säkerhet i servermiljö.
- **Reaktiva CloudEvents på SwarmEventBus**:
  - Publicera `DRIVE_AUTH_EXPIRED` (typ: `swarm.drive.auth.expired`) vid misslyckad förnyelse eller utgång.
  - Publicera `DRIVE_AUTH_REFRESHED` (typ: `swarm.drive.auth.refreshed`) vid lyckad tyst förnyelse.
- **Symbol-Krona & UI-Återhämtning**:
  - Vid behörighetsfel visas röd status i kronan med klickbart återinloggningsval.
  - Inga krascher eller ohanterade undantag i UI vid avbruten eller saknad session.
- **Transienta E2E-tester (< 3s)**:
  - Multi-skiktsverifiering under `src/__tests__/transient_TCK-019.test.ts`.
  - Konsolidering i `e2e_regression.test.ts`.

## 2. Vad som INTE ska göras (Avgränsningar)
- Inga serverbaserade OAuth redirect-flows (strider mot miljöns regler för flyktiga URL:er).
- Inga tokens i `localStorage` eller `sessionStorage` (in-memory principen från ADR-DRIVE-001 bibehålls strikt).
- Inga ändringar i MCP Bridge verktygsdefinitioner utöver befintlig integration.
- Ingen omskrivning av split-pane eller touch-overlay från TCK-018.
