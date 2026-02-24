import { textResult, errorResult, jsonResult, formatAddress } from '../format.js';

describe('textResult', () => {
  it('wraps text as successful result', () => {
    const result = textResult('hello');
    expect(result.content).toEqual([{ type: 'text', text: 'hello' }]);
    expect(result.isError).toBeUndefined();
  });
});

describe('errorResult', () => {
  it('wraps text as error result', () => {
    const result = errorResult('bad');
    expect(result.content).toEqual([{ type: 'text', text: 'bad' }]);
    expect(result.isError).toBe(true);
  });
});

describe('jsonResult', () => {
  it('serializes object to pretty JSON', () => {
    const result = jsonResult({ a: 1, b: [2, 3] });
    expect(JSON.parse(result.content[0]!.text)).toEqual({ a: 1, b: [2, 3] });
    expect(result.content[0]!.text).toContain('\n');
  });
});

describe('formatAddress', () => {
  it('truncates long addresses', () => {
    expect(
      formatAddress('0x1234567890abcdef1234567890abcdef12345678'),
    ).toBe('0x1234...5678');
  });

  it('returns short strings unchanged', () => {
    expect(formatAddress('0x123456')).toBe('0x123456');
  });
});
