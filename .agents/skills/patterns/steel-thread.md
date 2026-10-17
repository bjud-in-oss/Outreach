# Pattern: Steel Thread (Skarp Liveline)

## Avsikt (Intent)
Förhindra "hängande arkitektur" där komponenter, datamodeller och hjälpfunktioner byggs upp i ett isolerat vakuum utan verklig kontakt med omvärlden. Mönstret tvingar fram en minimal, obruten vertikal linje ("ståltråd") genom hela systemstacken innan breddning, optimering eller förfining tillåts.

---

## Kontext & Problem
Ett vanligt haveri vid programutveckling med AI är horisontell överbyggnad:
1. Agenten genererar snygga gränssnittskomponenter, rika typer och intrikata hjälpfunktioner med 100 % gröna enhetstester baserade på lokala mocks.
2. När systemet slutligen ska kopplas ihop i verklig körtid visar det sig att de underliggande API:erna, hårdvaruresurserna eller nätverksprotokollen beter sig fundamentalt annorlunda än vad antagits.
3. Hela det horisontella bygget rasar eller kräver omfattande omskrivning.

---

## Mönstrets Kärnmekanik

### 1. Det Obrutna Vertikala Snittet
En ståltråd skär igenom **samtliga arkitekturlager** med minsta möjliga funktionalitet:
`Användarhandling / Entrypoint -> Domäntillstånd -> Fysiskt Körtids-API / Hårdvara / Periferi -> Verifierbar Utdata / Systemeffekt`.

### 2. Djup Före Bredd (Deep Slice First)
- Implementera inga avancerade kantfall, felkoder eller polerade UI-varianter förrän ståltråden har bevisats leda ström hela vägen ut till verkligheten.
- Koppla kabeln till det faktiska körtidsankaret (`AudioContext`, `WebSocket`, `getUserMedia`, Web Storage etc.) direkt från start.

### 3. Fail-First på Systemnivå
- Tråden måste testas mot repots befintliga, omodifierade tillstånd före källkodsändringar och **måste fallera rött (exit 1)**.
- Felet måste bero på att den fysiska förbindelsen saknas, inte på ett ytligt syntaxfel i själva testet.

---

## Operativ Tillämpning i Triaden
- **Roll:** *Att följa* vid testdesign (Steg 3a) och Byggmotorns första grind (Gate 3a).
- **Uppdrag:** Upprätta och verifiera den skarpa livelinen innan domänlogik implementeras under Fas 2.

## Anti-mönster & Varningstecken
- *Isolerade mock-öar:* Tester som passerar grönt genom att mocka bort exakt de körtids-API:er som komponenten är till för att använda.
- *Tidig breddning:* Att specificera tio olika UI-tillstånd innan ett enda tillstånd har bevisats kunna nå nätverket eller ljudmotorn.

---
*Mönstret formaliserar principen om Körtidsankare och Skarp Liveline för Outreach Engine v10.4. Konceptuellt rotat i etablerad mjukvaruarkitektur: Tracer Bullets (Hunt & Thomas, The Pragmatic Programmer, 1999) och Steel Thread inom Extreme Programming och agil systemdesign.* 