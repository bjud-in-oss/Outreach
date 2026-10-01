# Steg 2e: Syntetisera & Verifiering av Mättnad (TCK-018)

## 1. Målkonfliktanalys
- **Konflikt 1**: Ändringen av symbol för `ATT_VANDA_OM` från `↔` till `⇐`.
  - *Syntes*: `CROWN_SYMBOLS.ATT_VANDA_OM` sätts till `⇐`. `crownStateHelper.ts` behåller bakåtkompatibilitet så att både `↔` och `⇐` hanteras säkert, och `transient_TCK-017.test.ts` uppdateras så att båda testerna passerar grönt.
- **Konflikt 2**: Snap till 0% i `SplitPaneCanvas` vs tidigare 15% minimum clamp.
  - *Syntes*: Grepplistens klick växlar explicit mellan `0` (100% fullskärmschatt) och `50`, medan manuell dragning tillåter intervallet `0%–100%` med magnetisk snap vid ytterlägena (< 10% -> 0%, > 90% -> 100%).
- **Konflikt 3**: Touch-overlay krock med ordinarie meny.
  - *Syntes*: När immersivt läge är inaktivt visas meny och krona i standardflödet. När immersivt läge är aktivt tas de bort ur det ordinarie flex-flödet och visas enbart via den flytande overlayen som tonas ut efter 3 sekunder.
- **Konflikt 4**: AST-begränsningar (max 125 rader, max 5 förgreningsvillkor).
  - *Syntes*: Modulär uppdelning i små, fokuserade komponenter (`ExecutionCard.tsx`, `useUserActivityLock.ts`, `TouchOverlayMenu.tsx`).

MÄTTNAD: JA
