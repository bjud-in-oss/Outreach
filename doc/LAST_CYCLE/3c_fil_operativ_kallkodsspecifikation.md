# Steg 3c: Filoperativ Källkodsspecifikation (TCK-021b)

## 1. GROW Specifikation
- **Goal (Mål)**: Implementera MCP-verktyget `apply_code_patch` med Zod-schema och promptbeskrivning, integrera med `driveStore.applyPatch` och WAL (PENDING -> COMMITTED), och returnera `{ isError: true }` med system-nudge vid tvetydiga träffar.
- **Reality (Nuläge)**: `driveStore.ts` har en funktionell `applyPatch`-motor (TCK-021a), men verktyget saknas i `mcp_bridge` och exponeras inte via JSON-RPC 2.0 i `mcpServer.ts`.
- **Options (Alternativ)**:
  - Alternativ 1: Lägga verktyget direkt i `driveTools.ts`. Ökar risken att överskrida radgränser och blandar Google Drive API (moln) med lokal kodpatchning.
  - Alternativ 2: Skapa en dedikerad verktygsfil `src/features/mcp_bridge/tools/codePatchTools.ts` och registrera den som tillägg i `mcpServer.ts`. Håller tydlig ansvarsfördelning och låg filkomplexitet.
- **Will (Beslut)**: Genomför Alternativ 2.

## 2. Operativt Delta: Bevara vs Sanera
- **Bevara**:
  - Samtliga befintliga verktyg i `mcpServer.ts`: `drive_create_file`, `wal_query_recent`, `outreach_evaluate_tone`, `drive_save_draft`, `drive_list_templates`, `wal_get_stats`.
  - `driveStore.ts` VFS Staging-metoder.
  - JSON-RPC 2.0 parser och felhanterare i `mcpServer.ts`.
- **Sanera / Utöka (Destruktiva Handlingssteg för Fas 2)**:
  - Skapa `src/features/mcp_bridge/tools/codePatchTools.ts`.
  - Utöka `src/features/mcp_bridge/index.ts` med export av `codePatchTools`.
  - Uppdatera `src/features/mcp_bridge/server/mcpServer.ts` att registrera `apply_code_patch`.
  - Skapa transient test `src/__tests__/transient_TCK-021b.test.ts`.

## 3. Zod-kontrakt & Typdefinitioner
```typescript
export const ApplyCodePatchSchema = z.object({
  filePath: z.string().min(1, 'filePath krävs'),
  searchBlock: z.string().describe(
    'Inkludera alltid 1–2 omgivande, oförändrade rader ovanför och nedanför ändringen för att garantera exakt indatering och unikhet.'
  ),
  replaceBlock: z.string(),
});
```

## 4. Godkännandekod (Token Gate)
- **Token**: `TCK-021B-MCP-PATCH-TOKEN`
- **Säkerhetsspärr**: Ingen källkod under `src/` ändras förrän användaren anger godkännandekoden i chatten via `pnpm genomfor TCK-021B-MCP-PATCH-TOKEN`.
