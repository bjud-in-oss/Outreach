import { EventEnvelopeSchema } from '../shared/contracts/envelope.ts';

export function runEnvelopeTests(): { name: string; passed: boolean; error?: string }[] {
  const results = [];

  // Test 1: Giltigt envelope valideras utan fel
  try {
    const valid = EventEnvelopeSchema.parse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      source: 'outreach/drive-sync',
      type: 'outreach.drive.file_created',
      specversion: '1.0',
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: { fileId: 'drive-abc-123', name: 'Kampanj.docx' },
      correlationId: 'corr-001',
    });
    results.push({ name: 'Valid envelope parses successfully', passed: valid.id === '123e4567-e89b-12d3-a456-426614174000' });
  } catch (err) {
    results.push({ name: 'Valid envelope parses successfully', passed: false, error: String(err) });
  }

  // Test 2: Ogiltigt envelope utan ID eller source ska avvisas (Fail Fast)
  try {
    EventEnvelopeSchema.parse({
      // Saknar id och source
      type: 'outreach.drive.file_created',
      data: {},
    });
    results.push({ name: 'Invalid envelope without id/source throws error', passed: false, error: 'Expected validation to fail' });
  } catch {
    results.push({ name: 'Invalid envelope without id/source throws error', passed: true });
  }

  // Test 3: Specversion måste vara '1.0'
  try {
    EventEnvelopeSchema.parse({
      id: 'id-1',
      source: 'source-1',
      type: 'test.event',
      specversion: '2.0', // Ogiltig
      time: new Date().toISOString(),
      data: {},
    });
    results.push({ name: 'Invalid specversion rejected', passed: false, error: 'Expected specversion 2.0 to fail' });
  } catch {
    results.push({ name: 'Invalid specversion rejected', passed: true });
  }

  return results;
}
