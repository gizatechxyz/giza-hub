import { describe, it, expect } from 'vitest';
import { formatToolError, WalletNotConnectedError } from './errors.js';
import {
  GizaAPIError,
  TimeoutError,
  NetworkError,
  ValidationError,
} from '@gizatech/agent-sdk';

describe('formatToolError', () => {
  it('handles WalletNotConnectedError', () => {
    const result = formatToolError(new WalletNotConnectedError());
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain('No wallet connected');
  });

  it('handles GizaAPIError 401', () => {
    const error = new GizaAPIError('Unauthorized', 401);
    const result = formatToolError(error);
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain('Authentication failed');
  });

  it('handles GizaAPIError 404', () => {
    const error = new GizaAPIError('Not found', 404);
    const result = formatToolError(error);
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain('No smart account exists');
  });

  it('handles GizaAPIError 400 with message from responseData', () => {
    const error = new GizaAPIError('Bad request', 400, {
      message: 'Amount too small',
    });
    const result = formatToolError(error);
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain('Amount too small');
  });

  it('handles TimeoutError', () => {
    const result = formatToolError(new TimeoutError(30000));
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain('timed out');
  });

  it('handles NetworkError', () => {
    const result = formatToolError(new NetworkError('ECONNREFUSED'));
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain('Could not reach');
  });

  it('handles ValidationError', () => {
    const result = formatToolError(new ValidationError('Invalid address'));
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain('Invalid address');
  });

  it('handles unknown errors', () => {
    const result = formatToolError(new Error('Something broke'));
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain('Something broke');
  });

  it('handles non-Error values', () => {
    const result = formatToolError('string error');
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toBe('An unexpected error occurred');
  });
});
