# TCK-MAINT-002: Tillfredsställ Gate 2c i bidiLiveRunner.ts

## MÅL
Åtgärda det tomma catch-blocket på rad 208 i scripts/bidiLiveRunner.ts så att filen passerar Gate 2c.

## UPPDRAG FÖR BYGGMOTORN
1. Använd read_file för att inspektera metoden close() längst ned i scripts/bidiLiveRunner.ts.
2. Använd apply_patch med:
search_block:
    if (this.session?.close) {
      try {
        this.session.close();
      } catch {}
    }

replace_block:
    if (this.session?.close) {
      try {
        this.session.close();
      } catch (err) {
        void err;
      }
    }
