import { describe, it, expect } from 'vitest';
import { processData } from './index.js';

describe('small-app', () => {
  it('should process data correctly', () => {
    const input = [
      { id: 1, name: 'Test' },
      { id: 2, name: 'User' }
    ];
    const result = processData(input);
    expect(result).toHaveLength(2);
    expect(result[0].processed).toBe(true);
    expect(result[0].timestamp).toBeDefined();
  });
});