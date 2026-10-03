# Steg 2b: Modellera (TCK-020d)

## 1. Klientkonfiguration
```typescript
const clientOptions = {
  apiKey: key,
  apiVersion: 'v1alpha' as const,
};
this.aiClient = new GoogleGenAI(clientOptions);
```

## 2. Metodsignatur för generateAgentTurn
```typescript
public async generateAgentTurn(params: {
  role: string;
  systemInstruction: string;
  prompt: string;
  context?: string;
  model?: string;
}): Promise<AgentThoughtResponse> {
  if (!this.aiClient || this.liveStatus === 'HALTED') throw new Error(`API-nyckel saknas för ${params.role}.`);
  const modelToUse = params.model || this.liveModelName;
  const response = await this.aiClient.models.generateContent({
    model: modelToUse,
    contents: [{ role: 'user', parts: [{ text: `Roll: ${params.role}\nInstruktion: ${params.systemInstruction}\nKontext: ${params.context || ''}\nUppdrag: ${params.prompt}` }] }],
  });
  return { agentRole: params.role, thought: `Analys genererad via ${modelToUse}`, content: response.text || '' };
}
```

## 3. Inspektionsmetod för apiVersion
```typescript
public getApiVersion(): string {
  return 'v1alpha';
}
```
