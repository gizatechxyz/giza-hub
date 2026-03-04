import { describe, test, expect } from 'bun:test';
import {
  GizaAPIError,
  TimeoutError,
  NetworkError,
  ValidationError,
} from '@gizatech/agent-sdk';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  jsonResult,
  handleToolCall,
} from '../../../services/error-handler.js';

describe('jsonResult', () => {
  test('wraps value in CallToolResult with pretty JSON', () => {
    const value = { foo: 1, bar: [2, 3] };
    const result = jsonResult(value);

    expect(result.content).toHaveLength(1);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(value, null, 2),
    });
    expect(result.isError).toBeUndefined();
  });
});

describe('handleToolCall', () => {
  test('returns formatted result on success', async () => {
    const data = { id: 42 };
    const result = await handleToolCall(
      () => Promise.resolve(data),
      (r) => jsonResult(r),
    );

    expect(result.isError).toBeUndefined();
    expect(result.content[0]!.text).toBe(
      JSON.stringify(data, null, 2),
    );
  });

  test('catches ValidationError', async () => {
    const result = await handleToolCall(
      () => {
        throw new ValidationError('bad field');
      },
      (r) => jsonResult(r),
    );

    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toStartWith('Invalid input:');
    expect(result.content[0]!.text).toContain('bad field');
  });

  test('catches GizaAPIError and returns friendlyMessage', async () => {
    const apiError = GizaAPIError.fromResponse(404, {
      message: 'not found',
    });
    const result = await handleToolCall(
      () => {
        throw apiError;
      },
      (r) => jsonResult(r),
    );

    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toBe(apiError.friendlyMessage);
  });

  test('catches TimeoutError', async () => {
    const result = await handleToolCall(
      () => {
        throw new TimeoutError(5000);
      },
      (r) => jsonResult(r),
    );

    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain('timed out');
  });

  test('catches NetworkError', async () => {
    const result = await handleToolCall(
      () => {
        throw new NetworkError('ECONNREFUSED');
      },
      (r) => jsonResult(r),
    );

    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain('Unable to reach');
  });

  test('catches unknown Error and uses its message', async () => {
    const result = await handleToolCall(
      () => {
        throw new Error('something broke');
      },
      (r) => jsonResult(r),
    );

    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toBe('something broke');
  });

  test('catches non-Error throw with fallback message', async () => {
    const result = await handleToolCall(
      () => {
        throw 'string-error';
      },
      (r) => jsonResult(r),
    );

    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toBe(
      'An unexpected error occurred',
    );
  });
});
