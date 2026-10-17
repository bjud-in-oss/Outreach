# Pattern: Reverse Direction (Bryta Förankring)

## Avsikt (Intent)
Motverka förhastad konvergens och kognitiv förankring (anchoring bias). Mönstret tvingar agenten att bryta den första uppenbara tankebanan genom att vända på informationsflödet, arbeta baklänges från önskat sluttillstånd och identifiera ortogonala alternativ i lösningsrymden.

---

## Kontext & Problem
När en LLM ombeds lösa ett arkitektur- eller kodproblem genererar den oftast den mest sannolika fortsättningen baserat på omedelbara träningsvikter. Detta leder till:
1. **Linjär förankring:** Modellen börjar vid indata och traskar framåt mot utdata längs den mest konventionella stigen.
2. **Falsk valfrihet:** Om modellen uppmanas skapa alternativ skapar den ofta ytliga variationer (kosmetiska ändringar, triviala omdöpningar) snarare än skilda arkitektoniska strategier.

---

## Mönstrets Kärnmekanik

### 1. Arbeta Baklänges (Outcome-Driven Inversion)
Börja inte i nuläget eller i tillgängliga parametrar. Börja i den exakta effekten:
- Vad är det absoluta minimibevis som krävs för att påvisa att funktionen fungerar?
- Vilken är den yttersta invariant som inte får brytas vid systemets gräns?
- Härled därefter bakåt vilka minimistrukturer som krävs för att bära detta tillstånd.

### 2. Ortogonalitetsprincipen
När alternativ tas fram måste de representera **vinkelräta avvägningar (trade-offs)**, inte kosmetiska varianter. Två alternativ är ortogonala endast om de väljer olika sidor av en fundamental arkitektonisk skiljelinje:
- **Kontrollmodell:** Autonomt tillstånd vs. Reaktivt händelsedrivet tillstånd.
- **Kopplingsgrad:** Synkron direktkontrakt vs. Asynkron frikopplad förmedling.
- **Abstraktionsnivå:** Komponerbar generalisering vs. Rå, transparent nollabstraktion.

### 3. Invertera Frågeställningen (Anti-problemet)
Fråga inte bara "Hur bygger vi detta?". Fråga:
- "Hur skulle vi designa detta om vi ville göra det omöjligt för komponenten att tappa tillstånd?"
- "Hur ser systemet ut om vi tar bort hela det antagna mellanlagret?"

---

## Operativ Tillämpning i Triaden
- **Roll:** *Att följa* i Fas 1 (Steg 2b).
- **Uppdrag:** Skapa 3 distinkta alternativ där varje alternativ vilar på en genuint skild arkitektonisk grundbult.

## Anti-mönster & Varningstecken
- *Halmgubbar (Alibi-alternativ):* Att lägga fram två medvetet bristfälliga alternativ för att framhäva en förutbestämd favorit.
- *Synonyma alternativ:* Alternativ som bara skiljer sig i filnamn, interna variabelnamn eller syntax.

---
*Mönstret är anpassat för Outreach Engine v10.4 från 'Reverse Direction' i [Augmented Coding Patterns](https://github.com/lexler/augmented-coding-patterns) av Lada Kesseler (Lexler), licensierat under CC-BY-4.0 och MIT License.*