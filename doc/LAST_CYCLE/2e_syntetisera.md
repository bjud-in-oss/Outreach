# Steg 2e: Syntetisera & Verifiering av Mättnad (TCK-016)

## 1. Målkonfliktanalys
- **Konflikt**: Om vi raderar `SwarmDashboard.tsx`, kommer äldre tester som testade att SwarmDashboard fanns att fallera?
  - **Lösning**: Granska de transienta testerna (TCK-007, TCK-008, TCK-012). De tester som kontrollerade källkoden i SwarmDashboard.tsx görs villkorliga (`if (fs.existsSync(...))`) eller anpassas så att de inte kräver den raderade monoliten.
- **Konflikt**: Skulle `App.tsx` förlora anslutningen till eventbussen och bakgrundstjänsterna?
  - **Lösning**: Nej, `SwarmProvider` kapslar in och bibehåller alla instanser (`SwarmEventBus`, `GeminiLiveSession`, `GoogleDriveClient`, `SwarmOrchestrator`) globalt i minnet oavsett UI-komponenter.

## 2. Arkitektonisk Sammanfattning
- Monoliten raderas fullständigt.
- UI är helt rent och redo för den nya symbol-kronan och split-pane-designen i TCK-017.
- `App.tsx` är krympt till < 30 rader.
- `SwarmProvider` förblir den odelade ryggraden för bakgrundsöverlevnad.

MÄTTNAD: JA
