import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { 
  PromptCompileInputSchema, 
  CompiledPromptSchema, 
  ProvningsportOptionsSchema, 
  BidiLiveAdapterConfigSchema, 
  OrchestratorConfigSchema 
} from '../contracts/pathSchema';

import type { StepNode, PortNode } from '../model/types';

describe('TCK-064 Schema och Typkontroller', () => {
  
  it('skall validera att PromptCompileInputSchema inte har duplicerade nycklar', () => {
    const keys = Object.keys(PromptCompileInputSchema.shape);
    const uniqueKeys = new Set(keys);
    expect(keys.length).toBe(uniqueKeys.size);
    
    // Förväntade unika nycklar baserat på sanering
    expect(keys).toContain('fas');
    expect(keys).toContain('stegId');
    expect(keys).toContain('ticketId');
    expect(keys).toContain('malDoman');
    expect(keys).toContain('uppdrag');
    expect(keys).toContain('biljettText');
  });

  it('skall innehålla systemPrompt i CompiledPromptSchema', () => {
    const shape = CompiledPromptSchema.shape;
    expect(shape.systemPrompt).toBeDefined();
    expect(shape.systemPrompt).toBeInstanceOf(z.ZodOptional);
  });

  it('skall innehålla testKod i ProvningsportOptionsSchema', () => {
    const shape = ProvningsportOptionsSchema.shape;
    expect(shape.testKod).toBeDefined();
    expect(shape.testKod).toBeInstanceOf(z.ZodOptional);
  });

  it('skall ha maxReconnectAttempts satt till default 6 i BidiLiveAdapterConfigSchema', () => {
    const config = BidiLiveAdapterConfigSchema.parse({});
    expect(config.maxReconnectAttempts).toBe(6);
  });

  it('skall utöka OrchestratorConfigSchema med korrekta defaults och typer', () => {
    const config = OrchestratorConfigSchema.parse({
      receptTyp: 'classic',
      ticketId: 'TCK-123',
      malDoman: 'path',
      uppdrag: 'Testa konfiguration'
    });

    expect(config.uppdragsTyp).toBe('TCK');
    expect(config.maxYttreOmvandelseForsok).toBe(4);
    expect(config.kontextMinne).toBeUndefined();
    
    const metaConfig = OrchestratorConfigSchema.parse({
      receptTyp: 'lean',
      ticketId: 'TCK-124',
      malDoman: 'path',
      uppdrag: 'Testa MAINT',
      uppdragsTyp: 'MAINT',
      maxYttreOmvandelseForsok: 2,
      kontextMinne: { test: 'data' }
    });

    expect(metaConfig.uppdragsTyp).toBe('MAINT');
    expect(metaConfig.maxYttreOmvandelseForsok).toBe(2);
    expect(metaConfig.kontextMinne).toEqual({ test: 'data' });
  });

  it('skall tillåta valfri run-funktion i StepNode och PortNode typer', () => {
    // Vi kan inte testa TS-typer direkt i runtime på ett enkelt sätt, men vi kan definiera objekt som följer dessa typer.
    const stepNode: StepNode = {
      id: 'step-1',
      name: 'Steg 1',
      type: 'STEP',
      execute: async () => ({ success: true }),
      run: async () => {} // Valfri funktion som ska vara tillåten
    };

    const portNode: PortNode = {
      id: 'port-1',
      name: 'Port 1',
      type: 'PORT',
      port: async () => ({ oppnad: true }),
      run: async () => {} // Valfri funktion som ska vara tillåten
    };

    expect(stepNode.id).toBe('step-1');
    expect(portNode.id).toBe('port-1');
    expect(typeof stepNode.run).toBe('function');
    expect(typeof portNode.run).toBe('function');
  });
});
