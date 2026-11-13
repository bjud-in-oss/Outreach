import { describe, it, expect } from 'vitest';
import { skapaBidiLiveAdapter } from '../engine/bidiLiveAdapter';

describe('BidiLiveAdapter Tool Execution', () => {
  it('should execute tools and send response back to the session', async () => {
    let capturedToolName = '';
    let capturedToolArgs: any = null;
    let toolResponseSent = false;
    let capturedFunctionResponses: any = null;
    let sessionClosed = false;

    const executeTool = async (name: string, args: any) => {
      capturedToolName = name;
      capturedToolArgs = args;
      return { result: 'success' };
    };

    const tools = [{ functionDeclarations: [{ name: 'save_code' }] }];

    const mockSession = {
      sendClientContent: async () => {},
      receiveStream: async function* () {
        yield {
          toolCall: {
            functionCalls: [
              {
                id: 'call-1',
                name: 'save_code',
                args: { file_path: 'test.ts', code: 'export const x = 1;' }
              }
            ]
          }
        };

        await new Promise(resolve => setTimeout(resolve, 50));

        yield {
          serverContent: {
            modelTurn: {
              parts: [{ text: 'Verktyg kördes och filen sparades!' }]
            }
          }
        };
      },
      sendToolResponse: async (responses: any) => {
        toolResponseSent = true;
        capturedFunctionResponses = responses;
      },
      close: async () => {
        sessionClosed = true;
      }
    };

    class MockSdk {
      live = {
        connect: async () => mockSession
      };
    }

    const adapter = skapaBidiLiveAdapter({
      apiKey: 'dummy-key',
      tools,
      executeTool,
      sdkConstructor: MockSdk
    });

    const result = await adapter.skicka({ userPrompt: 'Spara test.ts' });

    expect(capturedToolName).toBe('save_code');
    expect(capturedToolArgs.file_path).toBe('test.ts');
    expect(toolResponseSent).toBe(true);
    expect(capturedFunctionResponses).toBeDefined();
    expect(capturedFunctionResponses.functionResponses).toHaveLength(1);
    expect(capturedFunctionResponses.functionResponses[0].id).toBe('call-1');
    expect(capturedFunctionResponses.functionResponses[0].response.result).toBe('success');
    expect(result.svar).toBe('Verktyg kördes och filen sparades!');
    expect(sessionClosed).toBe(true);
  });

  it('should catch executeTool errors and send them back', async () => {
    let errorSent = false;
    let capturedFunctionResponses: any = null;

    const executeTool = async (name: string, args: any) => {
      throw new Error('Verktygsfel: Kunde inte skriva fil');
    };

    const mockSession = {
      sendClientContent: async () => {},
      receiveStream: async function* () {
        yield {
          toolCall: {
            functionCalls: [
              {
                id: 'call-2',
                name: 'save_code',
                args: { file_path: 'fail.ts' }
              }
            ]
          }
        };
        await new Promise(resolve => setTimeout(resolve, 50));
        yield {
          serverContent: {
            modelTurn: {
              parts: [{ text: 'Misslyckades.' }]
            }
          }
        };
      },
      sendToolResponse: async (responses: any) => {
        errorSent = true;
        capturedFunctionResponses = responses;
      },
      close: async () => {}
    };

    class MockSdk {
      live = {
        connect: async () => mockSession
      };
    }

    const adapter = skapaBidiLiveAdapter({
      apiKey: 'dummy-key',
      tools: [],
      executeTool,
      sdkConstructor: MockSdk
    });

    const result = await adapter.skicka({ userPrompt: 'Försök spara' });

    expect(errorSent).toBe(true);
    expect(capturedFunctionResponses.functionResponses[0].id).toBe('call-2');
    expect(capturedFunctionResponses.functionResponses[0].response.error).toBe('Verktygsfel: Kunde inte skriva fil');
  });
});
