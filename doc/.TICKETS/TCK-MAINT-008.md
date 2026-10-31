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
