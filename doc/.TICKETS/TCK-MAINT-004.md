# TCK-MAINT-004: Explicit felhantering och resiliens i scripts/samrad.ts

## MÅL
Ersätt det tysta catch-blocket på rad 130 i `scripts/samrad.ts` med explicit felhantering så att koden uppfyller Gate 2c utan att dölja undantag.

## UPPDRAG FÖR BYGGMOTORN
1. Använd `read_file` för att inspektera `scripts/samrad.ts` runt rad 128–132.
2. Använd `apply_patch` med:
search_block:
  let featureIndexStr = '';
  try { featureIndexStr = fs.readFileSync(path.join(ROOT_DIR, 'doc', 'FEATURE_INDEX.json'), 'utf-8'); } catch {}

replace_block:
  let featureIndexStr = '';
  try {
    const indexPath = path.join(ROOT_DIR, 'doc', 'FEATURE_INDEX.json');
    if (fs.existsSync(indexPath)) {
      featureIndexStr = fs.readFileSync(indexPath, 'utf-8');
    }
  } catch (err: any) {
    console.warn(`⚠️ [SAMRÅD]: Kunde inte ladda FEATURE_INDEX.json: ${err?.message || err}`);
  }
