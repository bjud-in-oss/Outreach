import { McpToolDefinition } from '../contracts/mcpSchema.ts';
import { GoogleDriveClient } from '../../google_drive_sync/api/driveClient.ts';

export const DriveToolsDefinitions: McpToolDefinition[] = [
  {
    name: 'drive_save_draft',
    description: 'Sparar ett utkast direkt i Google Drive Campaigns-mappen',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        body: { type: 'string' },
      },
      required: ['title', 'body'],
    },
  },
  {
    name: 'drive_list_templates',
    description: 'Listar tillgängliga mallar från Google Drive Templates-mappen',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

export function createDriveToolHandlers(driveClient: GoogleDriveClient) {
  return {
    drive_save_draft: async (args: Record<string, any>) => {
      const fileName = `${args.title.replace(/\s+/g, '_')}.md`;
      const uploaded = await driveClient.uploadFileMultipart({
        name: fileName,
        folderId: 'campaigns-folder',
        content: args.body,
        mimeType: 'text/markdown',
      });
      return {
        content: [{ type: 'text', text: `Utkast sparat med ID ${uploaded.id}: ${uploaded.name}` }],
      };
    },
    drive_list_templates: async () => {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify([
              { id: 'tmpl-1', name: 'Partnerskapsförfrågan - B2B AI.md' },
              { id: 'tmpl-2', name: 'Investerarsamordning Q3.md' },
            ]),
          },
        ],
      };
    },
  };
}
