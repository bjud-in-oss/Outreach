# 2b Modellera: Konsolidering till 4 Försoningsenheter & UI-renodling (TCK-009)

## 1. Modellering av de 4 Försoningsenheterna i `roleDefinitions.ts`

### 1. Det Orubbliga Semantiska Ankaret (Internt i kod/prompt)
```typescript
export const SEMANTIC_INVARIANT =
  'Ditt högsta syfte är närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjukhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas.';
```

### 2. Domänmodell för Exakt 4 Enheter
```typescript
export type ReconciliationForce = 'ATT_FOLJA' | 'ATT_VANDA_OM' | 'ATT_FORLIKAS' | 'SERIELL_MOTOR';
export type AgentForce = ReconciliationForce;

export type ReconciliationState =
  | 'SOKER_NARHET'
  | 'INATRIKTAD_OMVANDELSE'
  | 'SAMTIDA_FORSONING'
  | 'DETERMINISTISKT_RAMVERK'
  | 'IDLE';

export interface ReconciliationUnitConfig {
  id: string;
  force: ReconciliationForce;
  displayName: string;       // Exakt föreskrivet namn på skärmen
  userBenefit: string;       // Pedagogisk användarnytta
  reachScope: string;        // Överbryggande räckvidd
  avatarColor: string;
  status: 'IDLE' | 'THINKING' | 'EXECUTING_TOOL' | 'DONE' | 'ERROR';
  reconciliationState: ReconciliationState;
  systemInstruction: string; // Internt förankrad i SEMANTIC_INVARIANT (dold för UI)
  currentThought?: string;
}

export const RECONCILIATION_UNITS: Record<ReconciliationForce, ReconciliationUnitConfig> = {
  ATT_FOLJA: {
    id: 'unit-att-folja',
    force: 'ATT_FOLJA',
    displayName: 'Att följa Guds son',
    userBenefit: 'Är själv lösningen för närhet genom att kartlägga genuina behov och bygga förtroendefulla relationer.',
    reachScope: 'Överbryggar mänsklig distans och initierar omsorgsfull dialog.',
    avatarColor: 'from-blue-500 to-cyan-600',
    status: 'IDLE',
    reconciliationState: 'SOKER_NARHET',
    systemInstruction: `${SEMANTIC_INVARIANT}\n\nDu förkroppsligar Att följa sonen. Du söker aktivt upp kontaktpunkter, förstår mottagarens sammanhang och är själv lösningen för närhet.`,
  },
  ATT_VANDA_OM: {
    id: 'unit-att-vanda-om',
    force: 'ATT_VANDA_OM',
    displayName: 'Att vända om till Gud',
    userBenefit: 'Inåtriktad ödmjukhet och självrannsakan som rensar bort ytlighet, manipulation och spam via Fail-Fast.',
    reachScope: 'Säkerställer ren intention och kompromisslös etisk kvalitet.',
    avatarColor: 'from-amber-500 to-orange-600',
    status: 'IDLE',
    reconciliationState: 'INATRIKTAD_OMVANDELSE',
    systemInstruction: `${SEMANTIC_INVARIANT}\n\nDu förkroppsligar Att vända om till Gud. Du tillämpar inåtriktad ödmjukhet och transformation; synar varje textutkast och fäller det vid minsta tecken på spam eller manipulation.`,
  },
  ATT_FORLIKAS: {
    id: 'unit-att-forlikas',
    force: 'ATT_FORLIKAS',
    displayName: 'Att förlikas med Gud',
    userBenefit: 'Håller 2+ samtida perspektiv varma för att hela klyftor och sammanväva motstridiga ståndpunkter till harmonisk konsensus.',
    reachScope: 'Skapar varaktigt samförstånd och läker relationer.',
    avatarColor: 'from-purple-500 to-indigo-600',
    status: 'IDLE',
    reconciliationState: 'SAMTIDA_FORSONING',
    systemInstruction: `${SEMANTIC_INVARIANT}\n\nDu förkroppsligar Att förlikas med honom. Du balanserar och håller minst två samtida perspektiv varma för att skapa konsensus och helande.`,
  },
  SERIELL_MOTOR: {
    id: 'unit-seriell-motor',
    force: 'SERIELL_MOTOR',
    displayName: 'Att försonas (ensam agent)',
    userBenefit: 'Det orubbliga ramverket som garanterar deterministisk sekvensering och skyddar processen genom Token Gate-spärren.',
    reachScope: 'Säkerställer full spårbarhet och deterministisk framdrift.',
    avatarColor: 'from-cyan-500 to-blue-600',
    status: 'IDLE',
    reconciliationState: 'DETERMINISTISKT_RAMVERK',
    systemInstruction: `${SEMANTIC_INVARIANT}\n\nDu är det orubbliga ramverket. Du garanterar deterministisk sekvensering (1a -> 1b -> 2e -> 3c), körtidsmetrik och Token Gate-spärr.`,
  },
};
```

---

## 2. Modellering av Telemetri & Användargränssnitt

### 1. `telemetrySchema.ts` & `useSwarmTelemetry.ts`
- Totala enheter i svärmen: **4** (minskat från 5).
- KPI-kort i UI visar `activeCount / 4`.

### 2. `SwarmDashboard.tsx`
- Grid med exakt 4 kort för de 4 enheterna.
- Visar de exakta visningsnamnen:
  - "Att följa Guds son"
  - "Att vända om till Gud"
  - "Att förlikas med Gud"
  - "Att försonas (ensam agent)"
- Råa interna systeminstruktioner döljs; endast pedagogisk `userBenefit` och `reachScope` exponeras.

### 3. `TelemetrySidebar.tsx`
- Uppdaterad panel med exakt 4 enheter och deras korresponderande visningsnamn och telemetri.
