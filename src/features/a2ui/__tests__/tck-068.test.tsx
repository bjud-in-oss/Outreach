import { describe, it, expect } from 'vitest';
import { A2UIPayloadSchema } from '../contracts/a2uiSchema';

describe('TCK-068 Zod v4 compatibility', () => {
  it('should parse A2UIPayload with z.record(z.string(), z.any())', () => {
    const payload = {
      componentId: 'card-1',
      dataModel: { count: 1 },
    };

    const parsed = A2UIPayloadSchema.parse(payload);
    expect(parsed).toEqual(payload);
  });

  it('dataModel should have a defined keySchema in Zod v4', () => {
    const dataModelSchema = A2UIPayloadSchema.shape.dataModel as any;
    console.log('dataModelSchema keys:', Object.keys(dataModelSchema));
    console.log('dataModelSchema:', dataModelSchema);
    
    // ZodRecord has a keyType property
    expect(dataModelSchema).toHaveProperty('keyType');
    expect(dataModelSchema.keyType).toBeDefined();
  });
});
