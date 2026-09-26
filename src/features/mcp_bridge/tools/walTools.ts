import { McpToolDefinition } from '../contracts/mcpSchema.ts';
import { WalEngine } from '../../wal_logger/engine/walEngine.ts';

export const WalToolsDefinitions: McpToolDefinition[] = [
  {
    name: 'wal_get_stats',
    description: 'Returnerar statistik över totalt antal WAL-poster och deras commit-status',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

export function createWalToolHandlers(walEngine: WalEngine) {
  return {
    wal_get_stats: async () => {
      const history = walEngine.getWalHistory();
      const committed = history.filter((h) => h.status === 'COMMITTED').length;
      const pending = history.filter((h) => h.status === 'PENDING').length;
      const failed = history.filter((h) => h.status === 'FAILED').length;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              total: history.length,
              committed,
              pending,
              failed,
            }),
          },
        ],
      };
    },
  };
}
