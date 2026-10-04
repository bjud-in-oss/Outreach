import { z } from 'zod';
import { McpToolDefinition } from '../contracts/mcpSchema.ts';
import { WalEngine } from '../../wal_logger/engine/walEngine.ts';
import { driveStore } from '../../google_drive_sync/model/driveStore.ts';
import { EventEnvelope } from '../../../shared/contracts/envelope.ts';

export const ApplyCodePatchSchema = z.object({
  filePath: z.string().min(1, 'filePath krävs'),
  searchBlock: z.string().describe(
    'Inkludera alltid 1–2 omgivande, oförändrade rader ovanför och nedanför ändringen för att garantera exakt indatering och unikhet.'
  ),
  replaceBlock: z.string(),
});

const patchToolProperties = {
  filePath: { type: 'string', description: 'Relativ sökväg i VFS Staging' },
  searchBlock: {
    type: 'string',
    description: 'Inkludera alltid 1–2 omgivande, oförändrade rader ovanför och nedanför ändringen för att garantera exakt indatering och unikhet.',
  },
  replaceBlock: { type: 'string', description: 'Nytt kodblock som ska ersätta searchBlock' },
};

export const CodePatchToolsDefinitions: McpToolDefinition[] = [
  {
    name: 'apply_code_patch',
    description: 'Utför en kirurgisk O(N) search/replace patch på en fil i VFS Staging med unikhetsskydd.',
    inputSchema: {
      type: 'object',
      properties: patchToolProperties,
      required: ['filePath', 'searchBlock', 'replaceBlock'],
    },
  },
];

async function executePatch(
  args: Record<string, any>,
  wal: WalEngine,
  ds: typeof driveStore
) {
  let parsed;
  try {
    parsed = ApplyCodePatchSchema.parse(args);
  } catch (err: any) {
    return {
      content: [{ type: 'text' as const, text: `Valideringsfel: ${err.message}` }],
      isError: true,
    };
  }

  const { filePath, searchBlock, replaceBlock } = parsed;
  const envelope: EventEnvelope<{ filePath: string; searchLen: number; replaceLen: number }> = {
    id: `patch-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    source: 'mcp/code_patch',
    type: 'code.patch.applied',
    time: new Date().toISOString(),
    specversion: '1.0',
    datacontenttype: 'application/json',
    data: { filePath, searchLen: searchBlock.length, replaceLen: replaceBlock.length },
  };

  const walEntry = await wal.appendWalEntry(envelope);

  try {
    const updated = ds.applyPatch(filePath, searchBlock, replaceBlock);
    await wal.commitWalEntry(walEntry.sequenceNumber);
    return {
      content: [{
        type: 'text' as const,
        text: `[MCP:apply_code_patch] Patch applicerad framgångsrikt på "${filePath}". WAL seq #${walEntry.sequenceNumber} COMMITTED. Storlek: ${updated.length} tecken.`,
      }],
    };
  } catch (patchErr: any) {
    await wal.failWalEntry(walEntry.sequenceNumber, patchErr.message);
    return {
      content: [{
        type: 'text' as const,
        text: 'Sökblocket var inte unikt eller kunde inte hittas. Lägg till 2 omgivande kontextrader i searchBlock och försök igen.',
      }],
      isError: true,
    };
  }
}

export function createCodePatchToolHandlers(
  walEngine?: WalEngine,
  driveStoreInstance: typeof driveStore = driveStore
) {
  const wal = walEngine || new WalEngine();
  return {
    apply_code_patch: (args: Record<string, any>) => executePatch(args, wal, driveStoreInstance),
  };
}
