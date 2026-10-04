# Steg 2b: Modellera MCP Wrapper & Transaktionsflöde (TCK-021b)

## 1. Zod-schema och Verktygsdefinition
```typescript
import { z } from 'zod';
import { McpToolDefinition } from '../contracts/mcpSchema.ts';

export const ApplyCodePatchSchema = z.object({
  filePath: z.string().min(1, 'filePath krävs'),
  searchBlock: z.string().describe(
    'Inkludera alltid 1–2 omgivande, oförändrade rader ovanför och nedanför ändringen för att garantera exakt indatering och unikhet.'
  ),
  replaceBlock: z.string(),
});

export const CodePatchToolsDefinitions: McpToolDefinition[] = [
  {
    name: 'apply_code_patch',
    description: 'Utför en kirurgisk O(N) search/replace patch på en fil i VFS Staging med unikhetsskydd.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Relativ sökväg i VFS Staging' },
        searchBlock: {
          type: 'string',
          description:
            'Inkludera alltid 1–2 omgivande, oförändrade rader ovanför och nedanför ändringen för att garantera exakt indatering och unikhet.',
        },
        replaceBlock: { type: 'string', description: 'Nytt kodblock som ska ersätta searchBlock' },
      },
      required: ['filePath', 'searchBlock', 'replaceBlock'],
    },
  },
];
```

## 2. Handler-flöde
1. Validera argument mot `ApplyCodePatchSchema`.
2. Skapa CloudEvents envelope:
   ```typescript
   const envelope = {
     id: `patch-${Date.now()}-${Math.random().toString(36).substring(7)}`,
     source: 'mcp/code_patch',
     type: 'code.patch.applied',
     time: new Date().toISOString(),
     specversion: '1.0' as const,
     datacontenttype: 'application/json',
     data: { filePath, searchBlockLength: searchBlock.length, replaceBlockLength: replaceBlock.length },
   };
   ```
3. Anropa `walEngine.appendWalEntry(envelope)` -> status `PENDING`.
4. Utför `driveStore.applyPatch(filePath, searchBlock, replaceBlock)`.
5. Vid framgång:
   - Anropa `walEngine.commitWalEntry(seq)` -> status `COMMITTED`.
   - Returnera:
     ```typescript
     {
       content: [
         {
           type: 'text',
           text: `[MCP:apply_code_patch] Patch applicerad framgångsrikt på "${filePath}". WAL seq #${seq} COMMITTED.`,
         },
       ],
     }
     ```
6. Vid fel (`AMBIGUOUS_SEARCH_BLOCK`, `SEARCH_BLOCK_NOT_FOUND`, `FILE_NOT_FOUND`):
   - Anropa `walEngine.failWalEntry(seq, err.message)`.
   - Returnera utan att kasta exception:
     ```typescript
     {
       content: [
         {
           type: 'text',
           text: 'Sökblocket var inte unikt eller kunde inte hittas. Lägg till 2 omgivande kontextrader i searchBlock och försök igen.',
         },
       ],
       isError: true,
     }
     ```
