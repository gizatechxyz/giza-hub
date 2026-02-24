import {
  GizaAPIError,
  TimeoutError,
  NetworkError,
  GizaError,
} from '@gizatech/agent-sdk';
import { createTestHarness } from './helpers/mcp-client.js';

const VALID_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

function getText(result: { content: unknown }): string {
  return (result.content as Array<{ type: string; text: string }>)[0]!.text;
}

describe('error propagation', () => {
  it('WalletNotConnectedError returns isError with connect_wallet message', async () => {
    const { client, cleanup } = await createTestHarness();
    try {
      const result = await client.callTool({
        name: 'get_portfolio',
        arguments: {},
      });
      expect(result.isError).toBe(true);
      expect(getText(result)).toContain('connect_wallet');
    } finally {
      await cleanup();
    }
  });

  it('GizaAPIError returns isError with friendlyMessage', async () => {
    const { client, mockGiza, cleanup } = await createTestHarness();
    try {
      await client.callTool({
        name: 'connect_wallet',
        arguments: { wallet: VALID_WALLET },
      });
      mockGiza.__mockAgent.portfolio.mockRejectedValueOnce(
        new GizaAPIError('Not found', 404),
      );
      const result = await client.callTool({
        name: 'get_portfolio',
        arguments: {},
      });
      expect(result.isError).toBe(true);
      expect(getText(result)).toContain('not found');
    } finally {
      await cleanup();
    }
  });

  it('TimeoutError returns isError with timeout message', async () => {
    const { client, mockGiza, cleanup } = await createTestHarness();
    try {
      await client.callTool({
        name: 'connect_wallet',
        arguments: { wallet: VALID_WALLET },
      });
      mockGiza.__mockAgent.portfolio.mockRejectedValueOnce(
        new TimeoutError(5000),
      );
      const result = await client.callTool({
        name: 'get_portfolio',
        arguments: {},
      });
      expect(result.isError).toBe(true);
      expect(getText(result)).toContain('timed out');
    } finally {
      await cleanup();
    }
  });

  it('NetworkError returns isError with network error message', async () => {
    const { client, mockGiza, cleanup } = await createTestHarness();
    try {
      await client.callTool({
        name: 'connect_wallet',
        arguments: { wallet: VALID_WALLET },
      });
      mockGiza.__mockAgent.portfolio.mockRejectedValueOnce(
        new NetworkError('ECONNREFUSED'),
      );
      const result = await client.callTool({
        name: 'get_portfolio',
        arguments: {},
      });
      expect(result.isError).toBe(true);
      expect(getText(result)).toContain('Network error');
    } finally {
      await cleanup();
    }
  });

  it('generic GizaError preserves message', async () => {
    const { client, mockGiza, cleanup } = await createTestHarness();
    try {
      await client.callTool({
        name: 'connect_wallet',
        arguments: { wallet: VALID_WALLET },
      });
      mockGiza.__mockAgent.portfolio.mockRejectedValueOnce(
        new GizaError('Something went wrong with Giza'),
      );
      const result = await client.callTool({
        name: 'get_portfolio',
        arguments: {},
      });
      expect(result.isError).toBe(true);
      expect(getText(result)).toContain('Something went wrong with Giza');
    } finally {
      await cleanup();
    }
  });

  it('generic Error preserves error message', async () => {
    const { client, mockGiza, cleanup } = await createTestHarness();
    try {
      await client.callTool({
        name: 'connect_wallet',
        arguments: { wallet: VALID_WALLET },
      });
      mockGiza.__mockAgent.portfolio.mockRejectedValueOnce(
        new Error('Unexpected failure'),
      );
      const result = await client.callTool({
        name: 'get_portfolio',
        arguments: {},
      });
      expect(result.isError).toBe(true);
      expect(getText(result)).toContain('Unexpected failure');
    } finally {
      await cleanup();
    }
  });

  it('non-Error throw returns unexpected error message', async () => {
    const { client, mockGiza, cleanup } = await createTestHarness();
    try {
      await client.callTool({
        name: 'connect_wallet',
        arguments: { wallet: VALID_WALLET },
      });
      mockGiza.__mockAgent.portfolio.mockRejectedValueOnce('string throw');
      const result = await client.callTool({
        name: 'get_portfolio',
        arguments: {},
      });
      expect(result.isError).toBe(true);
      expect(getText(result)).toContain('unexpected error');
    } finally {
      await cleanup();
    }
  });
});
