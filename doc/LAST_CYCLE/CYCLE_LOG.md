# BYGGCYKEL LOGG: TCK-056
**Starttid:** 2026-11-13T21:47:38.323Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-056: Exempelskördning av drive_sync.legacy.ts och workspace-manifest (ADR-030)

**Måldomän:** `google_drive_sync` (`src/features/google_drive_sync/`)
**Målfiler:** `src/features/google_drive_sync/model/driveWorkspaceHelper.ts`
**Skördad Legacy:** `src/__tests__/drive_sync.legacy.ts`
**Mekanisk Acceptans:** Ett hermetiskt Vitest-test (konsoliderat till `src/features/google_drive_sync/__tests__/`) verifierar samtliga 3 scenarier från `src/__tests__/drive_sync.legacy.ts` (`GoogleDriveClient` token-initiering med `hasValidToken()`, `resolveMimeType('strategi.json')`, `getWorkspaceSubfolders()`) samt nya `createDefaultWorkspaceManifest()`, varefter Fas 3 raderar `src/__tests__/drive_sync.legacy.ts` och `pnpm verify` passerar med exit 0.

---

## Misstagsäkring & Systemiska Invarianter (Stoppklossar)
1. **Skapa `src/features/google_drive_sync/model/driveWorkspaceHelper.ts` (< 40 rader):**
   - Exportera `createDefaultWorkspaceManifest(rootName = 'Outreach_Workspace')` som returnerar `{ rootName, subfolders: ['Campaigns', 'Templates', 'Logs', 'Artifacts'] }`.
   - Rör inte `driveClient.ts` (ligger på 238/250 rader).
2. **Testdisciplin i Steg 3a (Fail-First + Skörd utan `vi.fn()`):**
   - Läs `src/__tests__/drive_sync.legacy.ts` och `src/features/google_drive_sync/api/driveClient.ts` i Steg 3a.
   - Importera `GoogleDriveClient` från `../features/google_drive_sync/api/driveClient` och `createDefaultWorkspaceManifest` från `../features/google_drive_sync/model/driveWorkspaceHelper`.
   - Inga kors-domänimporter och inga `vi.fn()`/`vi.spyOn()`.

---

## Scenariotriad (Den relationella och systemiska avsikten)

**Scenario: ATT FÖLJA – Drive-klientens kontrakt blir levande regressionsskydd**
  Givet att `drive_sync.legacy.ts` innehåller 3 verifierade tester för `GoogleDriveClient`
  När de skördas in i `src/features/google_drive_sync/__tests__/` tillsammans med `createDefaultWorkspaceManifest`
  Så körs de i varje `pnpm verify` och `drive_sync.legacy.ts` städas bort i Fas 3.

**Scenario: ATT VÄNDA OM – Avvisande av tysta regressionsfel i Drive-synken**
  Givet att `google_drive_sync` tidigare saknade aktiva enhetstester
  När testerna blir aktiva i Vitest
  Så fångas eventuella brott i MIME-typning eller mappstruktur direkt.

**Scenario: ATT FÖRLIKAS – Grön verifiering i hela repot**
  Givet att testerna passerar och legacy-filen är borttagen
  När `pnpm verify` körs
  Så passerar hela sviten med exit 0.

```


#### 1a Att följa: Intention & Nytta
Det här uppdraget handlar om att städa upp bland våra äldre tester och ge dem en permanent, pålitlig plats i vår nya struktur. Genom att flytta funktionerna från legacy-filen in till domänen för Google Drive säkerställer vi att koden testas ordentligt vid varje bygge, vilket gör systemet mer robust och tryggt att använda. Visst låter det som en bra plan att konsolidera detta?


#### 0a Att vända om: Kontraktsaudit
Kontraktsauditen är utförd och godkänd. Uppdraget omfattar strikt en FSD-domän (`google_drive_sync`) och innefattar planerad destruktiv sanering av legacy-tester i Fas 3. Alla restriktioner och säkerhetsspärrar är förstådda.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Här är de tre ortogonala alternativen för att lösa uppdraget för TCK-056:

Alternativ 1: Direkt konsolidering och modulär separation. Vi skapar hjälpfilen, flyttar existerande logik till nya enhetstester i domänen och raderar legacy-filen direkt efteråt.

Alternativ 2: Strukturerad steg-för-steg-migrering. Vi verifierar först manifestfunktionen, portar sedan testerna ett och ett och validerar att inga mockar krävs innan vi städar.

Alternativ 3: Integrerad körtidsvalidering. Vi bygger hjälpfilen och kör de skördade testerna direkt mot Drive-klienten för att säkerställa full funktionalitet innan legacy-koden saneras.


#### 2c Att vända om: Resiliensgranskning
Resiliensgranskningen visar att alternativ 3 har bäst resiliens eftersom det integrerar körtidsvalidering direkt, vilket säkerställer att klientkontraktet fungerar korrekt innan någon destruktiv sanering sker av legacy-koden. Detta minimerar risken för tysta regressionsfel vid migrering.


#### 2d Att förlikas: Mättnad
Resiliensgranskningen bekräftar att alternativ 3 är det mest hållbara spåret. Genom att integrera körtidsvalidering direkt minimerar vi risken för dolda fel. Jag deklarerar därmed MÄTTNAD: JA.


#### 3a Att följa: Testspecifikation



#### 3b Att följa: Källkod



#### 3c Att förlikas: Slutgiltigt Byggkontrakt
Byggkontraktet är spikat och kristalliserat. Vi skapar `src/features/google_drive_sync/model/driveWorkspaceHelper.ts` för workspace-manifestet och flyttar över arvegodstesterna till en ny, isolerad svit under `__tests__/` för löpande regredieringsskydd. I slutet av processen fasas `drive_sync.legacy.ts` ut helt, och vi säkerställer att `driveClient.ts` förblir orörd och inom radgränsen.
