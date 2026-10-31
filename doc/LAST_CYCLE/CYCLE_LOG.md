# BYGGCYKEL LOGG: TCK-MAINT-008
**Starttid:** 2026-10-31T16:47:59.224Z
**Modell:** gemini-3.8-live

---
### INITIAL PROMPT
```
# TCK-MAINT-008: Sanera tysta catch-block i run-planera-live.ts

## MÅL
Ersätt de 3 tomma catch-blocken på rad 156, 543 och 556 i `scripts/run-planera-live.ts` med explicit felloggning så att filen uppfyller Gate 2c.

## UPPDRAG FÖR BYGGMOTORN
1. Använd `read_file` för att inspektera `scripts/run-planera-live.ts`.
2. Använd `apply_patch` för att ersätta de tre tomma catch-blocken:

Patch 1 (Startsanering runt rad 150–157):
search_block:
        if (fs.existsSync(full)) {
          console.log(`🧹 [STARTSANERING]: Tar bort okommittat utkast: ${f}`);
          fs.unlinkSync(full);
        }
      }
    } catch {}

replace_block:
        if (fs.existsSync(full)) {
          console.log(`🧹 [STARTSANERING]: Tar bort okommittat utkast: ${f}`);
          fs.unlinkSync(full);
        }
      }
    } catch (err: any) {
      console.warn(`⚠️ [STARTSANERING]: Kunde inte rensa okommittat utkast: ${err?.message || err}`);
    }

Patch 2 (Feature index runt rad 540–544):
search_block:
      fs.writeFileSync(FEATURE_INDEX_PATH, JSON.stringify(indexData, null, 2), 'utf-8');
    } catch {}

replace_block:
      fs.writeFileSync(FEATURE_INDEX_PATH, JSON.stringify(indexData, null, 2), 'utf-8');
    } catch (err: any) {
      console.warn(`⚠️ [FAS 3]: Kunde inte uppdatera FEATURE_INDEX.json: ${err?.message || err}`);
    }

Patch 3 (Biljettstatus runt rad 553–557):
search_block:
        fs.writeFileSync(TICKETS_PATH, ticketsContent, 'utf-8');
      }
    }
  } catch {}

replace_block:
        fs.writeFileSync(TICKETS_PATH, ticketsContent, 'utf-8');
      }
    }
  } catch (err: any) {
    console.warn(`⚠️ [FAS 3]: Kunde inte uppdatera TICKETS.md: ${err?.message || err}`);
  }

```


#### 1a Att följa: Intention & Nytta
Feature: Förbättrad felhantering i körskriptet för live-planering

  Scenario: Explicita felloggningar vid filoperationer i planeringsskriptet
    Givet att planeringsskriptet har tysta catch-block vid filoperationer
    När ett fel uppstår vid rensning av utkast, uppdatering av feature-index eller biljettstatus
    Så ska systemet logga en varning med felmeddelandet för full spårbarhet


#### 0a Att vända om: Kontraktsaudit
Jag bekräftar att TCK-MAINT-008 uppfyller alla kontraktskrav för Steg 0a, då ändringarna begränsas till skriptet `run-planera-live.ts` utan att modifiera FSD-domäner under `src/features/`. Jag sparar nu beteendekontraktet i `doc/features/`.


#### 0b Att förlikas: Vägval
STATUS: GODKÄND


#### 1b Att följa: Domängränser



#### 2b Att följa: 3 Alternativ
Här är tre ortogonala alternativ för att åtgärda de tysta catch-blocken i `scripts/run-planera-live.ts`:

Alternativ 1 innebär att vi injicerar direkt felloggning med `console.warn` i varje catch-block via `apply_patch`, vilket är den enklaste och mest direkta lösningen enligt kontraktet.

Alternativ 2 är att införa en gemensam loggningsfunktion i ett separat skriptmodul och anropa denna. Detta skapar en mer enhetlig felhantering över tid.

Alternativ 3 bygger på att publicera felen som händelser via `SwarmEventBus`, vilket möjliggör osynlig spårning och integration med telemetrisystemet.


#### 2c Att vända om: Resiliensgranskning
Alternativ 1 ger direkt och tydlig felinformation lokalt, vilket uppfyller kontraktet utan att tillföra komplexa beroenden. Alternativ 2 ökar enhetligheten, men riskerar att sprida koden mer än vad biljetten kräver. Alternativ 3 med EventBus är mest robust för telemetri, men kräver att eventbussen är rätt initierad i skriptkontexten. Sammantaget är Alternativ 1 mest lämpat som avbrottsfritt körtidsankare för denna maintenance.


#### 2d Att förlikas: Mättnad
Vi slår fast att Alternativ 1 är det vinnande alternativet för detta underhåll. Detta säkrar ett avbrottsfritt körtidsankare med direkt felinformation och minsta möjliga komplexitet i systemet. MÄTTNAD: JA.
