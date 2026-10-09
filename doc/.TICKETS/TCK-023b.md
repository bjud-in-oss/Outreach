# TCK-023b: Single Live Agent & VAD Turn-Completion Fix (Orchestration)

## 1. MÅLDOMÄN OCH AVGRÄNSNING
- **FSD-Måldomän:** `src/features/gemini_live_swarm/coordinator/`
- **Syfte:** Ställa om svärmens orkestrering till 1 Live-röstkabel (Att förlikas som Host) + 2 High-Thinking underagenter (Att följa, Att vända om) via `@google/genai`, eliminera 50s-timeouten via en dedikerad VAD, samt knyta oscillationsdjupet till UI-reglagets `ReflectionMode`.

## 2. KRAVSPECIFIKATION

### 2.1 En Enskild Live WebSocket & VAD (swarmOrchestrator)
- Konfigurera `swarmOrchestrator.ts` så att endast Huvudagenten (*Att förlikas*) håller en aktiv WebSocket-röstkabel mot användaren.
- Integrera VAD-detektering (Silero VAD / Native PCM energy threshold) exklusivt på den aktiva röstkabeln. VAD måste skicka `Turn Complete` vid > 400 ms tystnad för att bryta 50s-timeouten.

### 2.2 Bakgrunds-underagenter (@google/genai)
- Anropa *Att följa* (Skaparen) och *Att vända om* (Granskaren) som bakgrundsanrop via standard Gemini API (`@google/genai`) med `thinkingConfig` (High Thinking).
- Syntetisera underagenternas strukturerade JSON-svar i *Att förlikas* och strömma den sammanfattade rösten/texten till användaren.

### 2.3 Prenumeration på Reflektions-Reglage & Telemetri
- `swarmOrchestrator.ts` ska prenumerera på `ReflectionMode` (`normal | mikro | makro | meta`) från UI-domänens kontrakt (`reflectionStateHelper.ts`).
- Styr antalet oscillationsvarv och analysdjup under *Reflektera*-fasen utifrån valt läge och slå fast `MÄTTNAD: JA` när det semantiska deltat avtar.
- Exponera `token_throughput_per_minute` i telemetrin för resursmedvetenhet.

## 3. DESTRUKTIVA HANDLINGSSTEG (SANERING AV GAMLA TCK-023)
Byggmotorn SKA radera följande föråldrade element under denna FSD-domän:
- Radera logik för tre parallella WebSocket-anslutningar och Bidi-kablar i `geminiLiveSession.ts`.
- Ta bort osynkade timers, fallback-loopar och 50-sekunders timeout-spärrar i `floorController.ts`.
- Radera föråldrade testfall i `src/__tests__/` som kräver 3 samtida Bidi-kablar.