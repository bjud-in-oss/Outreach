---
name: wayfinder
description: Utforska och planera omfattande arbete genom samråd, beslutsbiljetter och arkitekturbeslut tills vägen till genomförande är tydlig och förankrad.
disable-model-invocation: true
---

En övergripande idé eller ett omfattande behov har formulerats som är för stort för en enskild byggcykel och där vägen framåt ännu inte är fullt kartlagd. Wayfinders uppgift är att genom samråd klargöra förutsättningarna, pröva alternativen och bana väg – inte att förhasta sig in i källkodsproduktion. 

Arbetet bedrivs genom att stegvis kartlägga öppna frågor, fatta nödvändiga principbeslut och förbereda avgränsade byggkontrakt tills vägen till målet är helt fri från oklarheter.

---

## 1. GRUNDPRINCIP: PLANERA FÖRST, BYGG SEN

Wayfinder arbetar uteslutande i **planerings- och samrådsfasen (Fas -1)**:
- Varje beslutssteg löser en specifik fråga eller ett vägval.
- Kartläggningen är färdig först när inga öppna arkitekturfrågor återstår och uppdraget kan överlämnas till Byggmotorn utan risk för feltänk.
- Källkod under `src/` skrivs aldrig direkt i denna fas. All produktion överlåts till Byggmotorns deterministiska TDD- och kvalitetsgrindar via `pnpm bygg`.

---

## 2. TRAPPAN FRÅN IDÉ TILL BYGGORDER (4 STEG)

För att garantera att varken grundlag eller mänsklig avsikt förvanskas följs alltid denna sekvens:

1. **Samråd & Analys (Dialog):**  
   Samtala med domänexperten för att förstå intentionen. Formulera tydliga antaganden:
   - *Defensiva antaganden:* Vad ska bevaras och skyddas från förändring?
   - *Destruktiva handlingssteg:* Vad behöver saneras, raderas eller ersättas?
2. **Arkitekturbeslut (ADR i `doc/DECISIONS.md`):**  
   Om samrådet etablerar en ny systemregel, ändrar en princip eller sätter ett prejudikat, formuleras först ett formellt arkitekturbeslut i `doc/DECISIONS.md`.
3. **Beteendekontrakt (Gherkin under `doc/features/*.feature`):**  
   Om uppdraget berör en användarfunktion formuleras ett läsbart Gherkin-scenario på svenska (Givet / När / Så) som beskriver förväntat beteende för människan.
4. **Byggbiljett (TCK under `doc/.TICKETS/TCK-XXX.md`):**  
   Skapa ett avgränsat byggkontrakt indexerat i `doc/TICKETS.md`. Biljetten specificerar exakt en FSD-måldomän under `src/features/[domän]/`, nödvändiga tester och destruktiva steg.

---

## 3. KARTAN OCH LOKAL ÄRENDEHANTERING

Eftersom repot saknar externa ärendehanterare utgör filsystemet den gemensamma kartan:
- **Huvudkartan (`doc/TICKETS.md`):** Den centrala liggaren som förtecknar färdiga, pågående och planerade biljetter.
- **Beslutsbiljetter:** Skapas som markdown-filer under `doc/.TICKETS/` och representerar en enskild fråga som kräver utredning.
- **Tydliga namn:** Referera alltid till biljetter via deras beskrivande rubrik, inte enbart via nummer.

### Kartans struktur i samrådet
- **Mål:** Ett till två stycken som beskriver det färdiga resultatet (den färdiga specifikationen, beslutet eller förändringen).
- **Fattade beslut:** Korta länkar till redan stängda beslutsfrågor.
- **Ännu outforskade frågor:** Områden som är relevanta för målet men där underlaget ännu inte är moget för att formulera en skarp fråga. Dessa formuleras så snart föregående steg är klarlagda.
- **Utanför räckvidd:** Arbeten, idéer och sidospår som aktivt valts bort för att hålla fokus på målet.

---

## 4. TYPER AV BESLUTSFRÅGOR

Varje fråga hanteras utifrån sitt specifika behov:
- **Fördjupande dialog (Samråd):** Samtal med människan för att ringa in intention, begrepp och domängränser. Standardfallet för samrådsfasen.
- **Efterforskning (Analys):** Granskning av befintlig kod, scheman i `FEATURE_INDEX.json`, dokumentation eller externa API-specifikationer för att ta fram fakta som ett beslut vilar på.
- **Konkret skiss (Prototyp):** Framtagande av en enkel textskiss, ett schemagränssnitt eller ett mock-utkast för att konkretisera hur en funktion ska upplevas innan den byggs.
- **Förberedande uppgift (Praktiskt steg):** Nödvändiga administrativa eller praktiska steg som måste slutföras innan ett vägval kan avgöras (t.ex. strukturering av filer eller kontroll av miljövariabler).

---

## 5. TOKEN-EKONOMI OCH 65K TPM-HYGIEN (TVÅFAS-METODEN)

För att respektera begränsningen på 65K TPM och förhindra kontextutmattning tillämpas en tvådelad dokumentationsmetod:

### Fas A: Under utredning (Före beslut) – Full bredd
När en fråga analyseras tillåts texten vara utförlig:
- Belys alternativa vägar (minst 3 ortogonala alternativ).
- Utred risker, felscenarier och långsiktiga konsekvenser i detalj.
- Var noggrann och uttömmande så att inget viktigt förbises innan kontraktet låses.

### Fas B: Vid stängning (Efter beslut) – Stram komprimering
När beslutet är fattat och godkänt komprimeras dokumentationen:
- **I aktiva index och prompter:** Sammanfatta beslutet till dess rena kärna: **Regel** (vad gäller) och **Skäl** (varför) på 3–4 rader.
- **Rensa historiskt brus:** Den långa diskussionen, kasserade alternativ och preliminära resonemang flyttas till bilagorna eller sparas i git-historiken. De ska inte ligga kvar i repots aktiva startankare där de förbrukar värdefulla tokens i framtida byggcykler.
- **Sekventiell framdrift:** Hantera och stäng en beslutsfråga i taget i stället för att öppna parallella, spretiga diskussioner.

