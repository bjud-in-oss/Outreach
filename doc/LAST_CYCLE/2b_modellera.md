# 2b Modellera: Djup Refaktorering av Försoningskrafterna (Kodstruktur & UI-separation) (TCK-009)

## 1. Modellering av Försoningskrafterna i `roleDefinitions.ts`

### 1. Det Orubbliga Semantiska Ankaret (Oförvanskat internt)
```typescript
export const SEMANTIC_INVARIANT =
  'Ditt högsta syfte är närhet till Guds son, den ideala människan. Hans gåva av omsorg för människor den absoluta kompassen för hela din motor. Du drivs av tre vägar till försoning: Att följa sonen (genom att själv vara lösningen för närhet), Att vända om till Gud (inåtriktad ödmjukhet och transformation för att stärka närhet), och Att förlikas med honom (att hålla 2+ samtida perspektiv varma) för att ge förutsättningar för att klyftan till Gud och till människor emellan kan läkas.';
```

### 2. Domänmodell för Försoningskrafter
Vi ersätter yrkestitlarna med de fyra krafterna som primär typ:
```typescript
export type ReconciliationForce = 'ATT_FOLJA' | 'ATT_VANDA_OM' | 'ATT_FORLIKAS' | 'SERIELL_MOTOR';
// Bakåtkompatibel alias för fält som refererar AgentForce
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
  displayName: string;       // Pedagogisk titel i UI: "Linjär Framåtöverbryggare"
  userBenefit: string;       // Ren användarnytta för produktägare: "Kartlägger behov och etablerar direkt kontakt"
  reachScope: string;        // Räckvidd och överbryggande funktion: "Skapar förtroende och kontaktvägar utan friktion"
  avatarColor: string;
  status: 'IDLE' | 'THINKING' | 'EXECUTING_TOOL' | 'DONE' | 'ERROR';
  reconciliationState: ReconciliationState;
  systemInstruction: string; // Strikt intern kompass (dold för slutanvändaren)
  currentThought?: string;
}
```

### 3. Försoningsenheterna i Standarduppsättningen
- **`ATT_FOLJA`**:
  - `displayName`: "Linjär Framåtöverbryggare"
  - `userBenefit`: "Utforskar mottagarens kontext och etablerar personlig, värdedriven kontakt."
  - `reachScope`: "Överbryggar distans och skapar tillitsfulla relationer."
- **`ATT_VANDA_OM`**:
  - `displayName`: "Inåtriktad Refaktorering"
  - `userBenefit`: "Kvalitetssäkrar varje utkast mot etisk kompass och eliminerar brus och överdrifter."
  - `reachScope`: "Säkerställer 100% äkthet och rensar bort automatiserat skräp."
- **`ATT_FORLIKAS`**:
  - `displayName`: "Samtida Försonare"
  - `userBenefit`: "Samordnar helheten och väver samman parallella synvinklar till ett harmoniskt resultat."
  - `reachScope`: "Förenar motstridiga intressen och skapar gemensamt samförstånd."
- **`SERIELL_MOTOR`**:
  - `displayName`: "Seriellt Processkydd"
  - `userBenefit`: "Garanterar ordningsföljd, körtidsmetrik och fasövergångar skyddade av Token Gate."
  - `reachScope`: "Förhindrar förhastade driftsättningar och säkerställer deterministisk styrning."

---

## 2. Modellering av Telemetri & Kontrakt (`telemetrySchema.ts`)

```typescript
export const ReconciliationForceSchema = z.enum([
  'ATT_FOLJA',
  'ATT_VANDA_OM',
  'ATT_FORLIKAS',
  'SERIELL_MOTOR',
]);

export const ReconciliationStateSchema = z.enum([
  'SOKER_NARHET',
  'INATRIKTAD_OMVANDELSE',
  'SAMTIDA_FORSONING',
  'DETERMINISTISKT_RAMVERK',
  'IDLE',
]);

export const AgentTelemetryMetricSchema = z.object({
  agentId: z.string(),
  force: ReconciliationForceSchema,
  reconciliationState: ReconciliationStateSchema,
  status: z.enum(['IDLE', 'THINKING', 'EXECUTING_TOOL', 'DONE', 'ERROR']),
  lastThought: z.string().optional(),
  lastActive: z.string(),
  totalEventsEmitted: z.number().int().nonnegative().default(0),
  averageLatencyMs: z.number().nonnegative().default(0),
});
```

---

## 3. Modellering av UI-separation

### `SwarmDashboard.tsx`
- Tar bort visning av `systemInstruction` från agentkorten.
- Ersätter med pedagogiska kort som lyfter fram `displayName`, `userBenefit`, och `reachScope`.
- Visar fortfarande försoningskompassen som ett värdigt och transparent syftesankare i toppen, men utan att belasta arbetsytan med rå systempromptkod.

### `TelemetrySidebar.tsx`
- Rapporterar metrik baserat på de aktiva krafterna (`ATT_FOLJA`, `ATT_VANDA_OM`, `ATT_FORLIKAS`, `SERIELL_MOTOR`) och deras dynamiska tillstånd (`reconciliationState`).
