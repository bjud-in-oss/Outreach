import { describe, it, expect } from 'vitest';
import { EventEnvelopeSchema } from '../contracts/envelope';

describe('EventEnvelopeSchema', () => {
  it('should parse a valid envelope successfully', () => {
    const validData = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      source: 'outreach/drive-sync',
      type: 'outreach.drive.file_created',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: { fileId: 'drive-abc-123', name: 'Kampanj.docx' },
      correlationId: 'corr-001',
    };
    
    const result = EventEnvelopeSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject an invalid envelope without id or source', () => {
    const invalidData = {
      type: 'outreach.drive.file_created',
      data: {},
    };
    
    const result = EventEnvelopeSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject an invalid specversion', () => {
    const invalidData = {
      id: 'id-1',
      source: 'source-1',
      type: 'test.event',
      specversion: '2.0',
      time: new Date().toISOString(),
      data: {},
    };
    
    const result = EventEnvelopeSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
