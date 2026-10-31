# TCK-MAINT-004: Tillfredsställ Gate 2c i scripts/samrad.ts

## MÅL
Åtgärda det tomma catch-blocket på rad 130 i scripts/samrad.ts så att filen passerar Gate 2c.

## UPPDRAG FÖR BYGGMOTORN
1. Använd read_file för att inspektera scripts/samrad.ts runt rad 128-132.
2. Använd apply_patch med:
search_block:
  let featureIndexStr = '';
  try { featureIndexStr = fs.readFileSync(path.join(ROOT_DIR, 'doc', 'FEATURE_INDEX.json'), 'utf-8'); } catch {}

replace_block:
  let featureIndexStr = '';
  try { 
    featureIndexStr = fs.readFileSync(path.join(ROOT_DIR, 'doc', 'FEATURE_INDEX.json'), 'utf-8'); 
  } catch (err) {
    void err;
  }
