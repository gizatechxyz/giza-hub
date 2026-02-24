import {
  GizaAPIError,
  ValidationError,
  TimeoutError,
  NetworkError,
  GizaError,
} from '@gizatech/agent-sdk';
import { WalletNotConnectedError, formatToolError } from '../errors.js';

describe('WalletNotConnectedError', () => {
  it('has correct name and message', () => {
    const err = new WalletNotConnectedError();
    expect(err.name).toBe('WalletNotConnectedError');
    expect(err.message).toContain('connect_wallet');
    expect(err).toBeInstanceOf(GizaError);
  });
});

describe('formatToolError', () => {
  it('formats WalletNotConnectedError', () => {
    const result = formatToolError(new WalletNotConnectedError());
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain('connect_wallet');
  });

  it('formats GizaAPIError with friendly message', () => {
    const err = GizaAPIError.fromResponse(401, { message: 'bad key' });
    const result = formatToolError(err);
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain('Authentication');
  });

  it('formats ValidationError', () => {
    const err = new ValidationError('bad input');
    const result = formatToolError(err);
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain('Validation error');
  });

  it('formats TimeoutError', () => {
    const err = new TimeoutError(5000);
    const result = formatToolError(err);
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain('timed out');
  });

  it('formats NetworkError', () => {
    const err = new NetworkError('ECONNREFUSED');
    const result = formatToolError(err);
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain('Network error');
  });

  it('formats generic GizaError', () => {
    const err = new GizaError('something broke');
    const result = formatToolError(err);
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toBe('something broke');
  });

  it('formats generic Error', () => {
    const result = formatToolError(new Error('oops'));
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toBe('oops');
  });

  it('formats non-Error values', () => {
    const result = formatToolError('string error');
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toBe('An unexpected error occurred');
  });
});
