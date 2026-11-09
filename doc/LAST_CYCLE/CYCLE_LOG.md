# BYGGCYKEL LOGG: TCK-MAINT-027
**Starttid:** 2026-11-09T22:52:46.055Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-027: Skarp BidiLive-koppling och Dry-Run i run-path.ts

## 1. MÅL
Aktivera skarp nätverksorkestrering i `scripts/run-path.ts` via flaggan `--live` med hjälp av `skapaBidiLiveAdapter`, samt stöd för `--dry-run` för riskfri prompt- och portverifiering. Standardläget utan `--live` ska förbli blixtsnabbt och nätverksoberoende.

## 2. INFRASTRUKTURSPECIFIKATION
Berörda filer: `scripts/run-path.ts`, `scripts/__tests__/run-path.test.ts`.

1. `scripts/run-path.ts`:
   - Importera `skapaBidiLiveAdapter` från `../src/features/path`.
   - Läs in flaggorna `--live` och `--dry-run` från `argv`.
   - Vid `--dry-run`: Sätt en flagga i kontexten och logga: `   🛡️ [DRY-RUN]: Skarpt läge utan diskmodifiering aktivt.`.
   - Vid `--live`:
     * Instansiera `skapaBidiLiveAdapter` med konfiguration från `process.env` (`apiKey: process.env.GEMINI_API_KEY`, `model: process.env.LIVE_MODEL || 'gemini-3.8-live'`, `modality: (process.env.BIDI_MODALITY as any) || 'AUDIO'`).
     * Klientfabriken skapar en live-klient som ansluter till Gemini Live och exponerar `connect`, `send`, `stream` och `close` enligt adapterns kontrakt.
   - Utan `--live`: Använd befintlig mock-adapter med syntetiska svar för omedelbar och nätverksoberoende testning.

2. `scripts/__tests__/run-path.test.ts`:
   - Verifiera att `exekveraRunPath` hanterar flaggan `--dry-run` utan fel.
   - Verifiera att en injicerad `adapter` eller `clientFactory` exekverar framgångsrikt med `success: true` och `slutfold: true`.

## 3. ACCEPTANSKRITERIER
1. `scripts/run-path.ts` stöder både standard mock, `--dry-run` och `--live`.
2. Samtliga 20 testfiler i `pnpm test` passerar 100 % gröna.
3. `pnpm verify` passerar 100 % grön.
4. Trepunktsbesiktningen godkänns manuellt med `j`.

```


#### 1a Att följa: Intention & Nytta
Givet att användaren exekverar run-path.ts med flaggan --dry-run När körningen startar Så ska systemet markera kontexten för dry-run och logga meddelandet: 🛡️ [DRY-RUN]: Skarpt läge utan diskmodifiering aktivt Givet att användaren exekverar run-path.ts med flaggan --live När körningen startar Så ska en BidiLive-adapter instansieras och ansluta till Gemini Live Givet att användaren exekverar run-path.ts utan flaggor När körningen startar Så ska en mock-adapter användas för nätverksoberoende testning.


#### 0a Att vända om: Kontraktsaudit
Detta uppdrag berör exekveringsskripten `run-path.ts` och dess test, och håller sig strikt inom gällande arkitekturkontrakt. Inga modifieringar under `src/features/` krävs, och integrationen sker via godkända kontraktsexporter. Kontraktet är godkänt för Fas 1.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
För att lösa TCK-MAINT-027 formulerar jag tre ortogonala alternativ:

Alternativ 1: Direkt integration och villkorsstyrd instansiering i `run-path.ts`. Vi läser `argv` direkt och instansierar `skapaBidiLiveAdapter` vid flaggan `--live`, samt hanterar `--dry-run` genom flödeskontroll.

Alternativ 2: Fabriksmönster för adaptergenerering. Vi bryter ut adapterns tillblivelse till en egen modul i `scripts/` som returnerar rätt implementering baserat på CLI-parametrarna, vilket håller huvudlogiken ren.

Alternativ 3: Konfigurationsdriven exekvering med injicerad klientfabrik. Vi samlar upp konfigurationen och injicerar en fabrik i exekveringsmotorn, vilket möjliggör testning även utan att behöva parsas från globala `process.argv`.


#### 2c Att vända om: Resiliensgranskning
Efter en noga resiliensgranskning av de tre alternativen kan jag konstatera att Alternativ 3 är det mest resilienta.

Genom att använda en injicerad klientfabrik frikopplar vi exekveringslogiken från globala `process.argv`. Detta ger oss en stabil grund för testbarhet och skyddar systemet mot latenta haverier vid nätverksfel.

Vi bör nu gå vidare och låsa Alternativ 3.


#### 2d Att förlikas: Mättnad
Jag har vägt spänningsfältet och analyserat riskanalysen. Alternativ 3 är det vinnande kontraktet och vi deklarerar härmed MÄTTNAD: JA.
