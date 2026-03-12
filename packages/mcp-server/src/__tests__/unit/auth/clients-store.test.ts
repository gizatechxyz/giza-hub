import { describe, test, expect, beforeEach } from 'bun:test';
import type { OAuthClientInformationFull } from '@modelcontextprotocol/sdk/shared/auth.js';

import { InMemoryClientsStore } from '../../../auth/clients-store';

function createClientMetadata(
  clientId: string,
  overrides: Partial<OAuthClientInformationFull> = {},
): OAuthClientInformationFull {
  return {
    client_id: clientId,
    client_secret: `secret-${clientId}`,
    redirect_uris: [`http://localhost/callback/${clientId}`],
    ...overrides,
  } as OAuthClientInformationFull;
}

describe('InMemoryClientsStore', () => {
  let store: InMemoryClientsStore;

  beforeEach(() => {
    store = new InMemoryClientsStore();
  });

  test('getClient returns undefined for unknown client', async () => {
    const result = await store.getClient('nonexistent-id');
    expect(result).toBeUndefined();
  });

  test('registerClient stores and returns the metadata', async () => {
    const metadata = createClientMetadata('client-1');
    const result = await store.registerClient(metadata);

    expect(result).toEqual(metadata);
    expect(result.client_id).toBe('client-1');
  });

  test('getClient returns stored client after register', async () => {
    const metadata = createClientMetadata('client-2');
    await store.registerClient(metadata);

    const result = await store.getClient('client-2');
    expect(result).toEqual(metadata);
  });

  test('overwriting a client replaces the previous entry', async () => {
    const original = createClientMetadata('client-3', {
      redirect_uris: ['http://localhost/original'],
    });
    await store.registerClient(original);

    const updated = createClientMetadata('client-3', {
      redirect_uris: ['http://localhost/updated'],
    });
    await store.registerClient(updated);

    const result = await store.getClient('client-3');
    expect(result).toEqual(updated);
    expect(result!.redirect_uris).toEqual([
      'http://localhost/updated',
    ]);
  });

  test('multiple clients are stored independently', async () => {
    const clientA = createClientMetadata('client-a');
    const clientB = createClientMetadata('client-b');
    await store.registerClient(clientA);
    await store.registerClient(clientB);

    const resultA = await store.getClient('client-a');
    const resultB = await store.getClient('client-b');
    expect(resultA).toEqual(clientA);
    expect(resultB).toEqual(clientB);
  });
});
