import { z } from 'zod';

export const McpToolDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  inputSchema: z.record(z.string(), z.unknown()),
});

export type McpToolDefinition = z.infer<typeof McpToolDefinitionSchema>;

export const McpRequestSchema = z.object({
  jsonrpc: z.literal('2.0').default('2.0'),
  id: z.union([z.string(), z.number()]),
  method: z.string(),
  params: z.record(z.string(), z.unknown()).default({}),
});

export type McpRequest = z.infer<typeof McpRequestSchema>;

export const McpResponseSchema = z.object({
  jsonrpc: z.literal('2.0').default('2.0'),
  id: z.union([z.string(), z.number()]),
  result: z
    .object({
      tools: z.array(McpToolDefinitionSchema).optional(),
      content: z
        .array(
          z.object({
            type: z.string(),
            text: z.string().optional(),
          })
        )
        .optional(),
      isError: z.boolean().optional(),
    })
    .optional(),
  error: z
    .object({
      code: z.number().int(),
      message: z.string(),
      data: z.unknown().optional(),
    })
    .optional(),
});

export type McpResponse = z.infer<typeof McpResponseSchema>;
