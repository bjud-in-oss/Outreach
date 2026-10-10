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

export const McpContentItemSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
});

export const McpResponseSchema = z.object({
  jsonrpc: z.literal('2.0').default('2.0'),
  id: z.union([z.string(), z.number()]),
  result: z
    .object({
      tools: z.array(McpToolDefinitionSchema).optional(),
      content: z.array(McpContentItemSchema).optional(),
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

/**
 * Gemini Live WebSocket Bidi Tool Execution Schemas (TCK-003)
 * Spec: Gemini 3.8 Live API Asynchronous Function Calling
 */
export const BidiFunctionCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  args: z.record(z.string(), z.unknown()),
});

export type BidiFunctionCall = z.infer<typeof BidiFunctionCallSchema>;

export const BidiFunctionResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  response: z.object({
    output: z.union([z.record(z.string(), z.unknown()), z.string(), z.array(z.unknown())]),
  }),
});

export type BidiFunctionResponse = z.infer<typeof BidiFunctionResponseSchema>;

export const BidiGenerateContentToolResponseSchema = z.object({
  functionResponses: z.array(BidiFunctionResponseSchema),
  behavior: z.literal('NON_BLOCKING'),
});

export type BidiGenerateContentToolResponse = z.infer<typeof BidiGenerateContentToolResponseSchema>;
