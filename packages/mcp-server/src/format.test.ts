import { describe, it, expect } from 'vitest';
import {
  formatAddress,
  formatDate,
  formatUsd,
  formatPercent,
  formatTokenAmount,
  formatStatus,
  textResponse,
} from './format.js';

describe('formatAddress', () => {
  it('truncates a 42-char address', () => {
    expect(formatAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e')).toBe(
      '0x742d...f44e',
    );
  });

  it('returns short strings unchanged', () => {
    expect(formatAddress('0x1234')).toBe('0x1234');
  });
});

describe('formatDate', () => {
  it('formats an ISO date', () => {
    const result = formatDate('2025-02-20T12:00:00Z');
    expect(result).toContain('Feb');
    expect(result).toContain('20');
    expect(result).toContain('2025');
  });

  it('returns invalid date strings unchanged', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('formatUsd', () => {
  it('formats a dollar amount', () => {
    expect(formatUsd(1234.56)).toBe('$1,234.56');
  });

  it('formats zero', () => {
    expect(formatUsd(0)).toBe('$0.00');
  });
});

describe('formatPercent', () => {
  it('formats a decimal as percentage', () => {
    expect(formatPercent(0.0523)).toBe('5.23%');
  });
});

describe('formatTokenAmount', () => {
  it('formats with default decimals', () => {
    expect(formatTokenAmount(1234.5678)).toBe('1,234.57');
  });

  it('formats with custom decimals', () => {
    expect(formatTokenAmount(1234.5678, 4)).toBe('1,234.5678');
  });
});

describe('formatStatus', () => {
  it('title-cases underscored status', () => {
    expect(formatStatus('activation_failed')).toBe('Activation Failed');
  });

  it('title-cases single word', () => {
    expect(formatStatus('active')).toBe('Active');
  });
});

describe('textResponse', () => {
  it('wraps text in MCP content format', () => {
    const result = textResponse('hello');
    expect(result).toEqual({
      content: [{ type: 'text', text: 'hello' }],
    });
  });
});
