# 3c Fil-operativ Källkodsspecifikation (TCK-016)

## 1. Förändringskedja för Fas 2 (pnpm genomfor)

Följande filer är specificerade för källkodsändring under Fas 2 efter bekräftelse av godkännandekoden (`TCK-016-PURGE-MONOLITH-TOKEN`):

---

### Fil 1–7: Filer att radera
- `src/features/gemini_live_swarm/ui/SwarmDashboard.tsx` (RADERAS)
- `src/features/gemini_live_swarm/ui/TelemetrySidebar.tsx` (RADERAS)
- `src/features/gemini_live_swarm/ui/MasterDevelopmentPlan.tsx` (RADERAS)
- `src/features/gemini_live_swarm/ui/components/SwarmControlPanel.tsx` (RADERAS)
- `src/features/gemini_live_swarm/ui/components/SwarmUnitCard.tsx` (RADERAS)
- `src/features/gemini_live_swarm/ui/components/SwarmStreamLog.tsx` (RADERAS)
- `src/features/google_drive_sync/ui/DriveSyncPanel.tsx` (RADERAS)

---

### Fil 8: `src/App.tsx` (REFAKTORERING TILL MINIMALT ROT-SKAL < 30 RADER)
- Ersätt den monolitiska flikstrukturen med ett rent, minimalistiskt rot-skal:
```tsx
import React from 'react';
import { SwarmProvider } from './features/gemini_live_swarm/index.ts';

export default function App() {
  return (
    <SwarmProvider>
      <main className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">
        {/* Ren grundvisningsyta förberedd för TCK-017 Symbol-Krona & Split-Pane */}
      </main>
    </SwarmProvider>
  );
}
```

---

### Fil 9: `src/features/gemini_live_swarm/index.ts` (MODIFIERING)
- Ta bort alla re-exports av raderade UI-komponenter (`SwarmDashboard`, `TelemetrySidebar`, etc.).
- Exportera endast kärnmoduler och `SwarmProvider` / `useSwarmContext`.

---

### Fil 10: `src/features/google_drive_sync/index.ts` (MODIFIERING)
- Ta bort re-export av `DriveSyncPanel`. Behåll `GoogleDriveClient`, `useDriveStore`.

---

### Fil 11: `scripts/verify-architecture.js` (MODIFIERING)
- Rensa bort de raderade filerna från `astCheckTargets`.

---

### Fil 12: `src/__tests__/transient_TCK-007.test.ts`, `transient_TCK-008.test.ts`, `transient_TCK-012.test.ts` (ANPASSNING)
- Säkra att dessa tester kontrollerar komponenter villkorligt (`if (fs.existsSync(...))`) eller testar kvarvarande kontrakt, så att de inte kräver raderade filer.

---

### Fil 13: `src/__tests__/transient_TCK-016.test.ts` (NY TRANSIENT TESTFIL)
- Skapa 3 isolerade testfall (< 3s i minnet):
  1. **Test 1 (Ren Renderelektion)**: Verifiera att `App.tsx` har < 30 rader och omsluts av `SwarmProvider` utan gamla monolitkomponenter.
  2. **Test 2 (Bakgrundsöverlevnad)**: Verifiera att `SwarmProvider` och `SwarmEventBus` upprätthåller sitt tillstånd oberoende av UI:t.
  3. **Test 3 (Import-Integritet)**: Verifiera via statisk AST/filgenomsökning att inga föråldrade UI-importer återstår.

---

### Fil 14: `scripts/run-tests.js` & `src/__tests__/suite/e2e_regression.test.ts` (MODIFIERING)
- Registrera `transient_TCK-016.test.ts` i test runner och regressionssvit.
