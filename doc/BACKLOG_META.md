# FRAMTIDA META-UPPDRAG: EXEKVERBARA SPECIFIKATIONER & MUTATIONSTESTNING

## Kontext & Målbild
När motorns grundläggande stafett (Fas 0–3) är verifierad i skarp drift vill vi höja testkvaliteten från "gröna alibin" till matematiskt bevisad funktion enligt Dave Farleys principer för Continuous Delivery.
  
## 🎯 Aktuella Atomära Underhållsuppdrag (Ett fel i taget)

1. **TCK-MAINT-002: WebSocket-livscykel i `bidiLiveRunner.ts`**
   - *Mål:* Lägg till `if (this.isClosed) return;` i `onmessage` för att skydda runner-processen mot eftersläpande Google-paket.
   - *Metod:* Autonom körning via Byggmotorn. 100 % budget till en fil.

2. **TCK-MAINT-003: Relativ sökvägsbevaring i `run-planera-live.ts`**
   - *Mål:* Bevara undermappar (`ui/`, `session/`) vid automatisk export till `index.ts` så att trasiga barrel-importer inte uppstår.

3. **TCK-MAINT-004: Sessionsisolerat biljetterbjudande i `samrad.ts`**
   - *Mål:* Lär Mötesbryggan att endast erbjuda start av bygge om en ny biljett faktiskt skapades i den aktiva dialogen.

---

## 🔬 Framtida Arkitektur- & Testinvarianter

1. **Strikt Kontrakts-DSL i Ticket-nedbrytningen:**
   - Tvinga alla transienta tester att interagera med omvärlden via EventBus, CloudEvents eller MCP.
2. **Mutationstestning (Stryker):**
   - Automatiserat nattjobb mot `src/shared/contracts/` för att bevisa att testsviten detekterar logikfel.