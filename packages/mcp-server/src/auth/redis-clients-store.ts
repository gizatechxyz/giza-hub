import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import type { OAuthClientInformationFull } from '@modelcontextprotocol/sdk/shared/auth.js';
import { RedisAuthStore } from '../utils/redis-auth-store';
import {
  CLIENT_REGISTRATION_TTL_SEC,
  MAX_REGISTERED_CLIENTS,
} from '../constants';

export class RedisClientsStore implements OAuthRegisteredClientsStore {
  private readonly store = new RedisAuthStore<OAuthClientInformationFull>(
    'giza:client:',
    CLIENT_REGISTRATION_TTL_SEC,
    MAX_REGISTERED_CLIENTS,
  );

  async getClient(
    clientId: string,
  ): Promise<OAuthClientInformationFull | undefined> {
    return this.store.get(clientId);
  }

  async registerClient(
    metadata: OAuthClientInformationFull,
  ): Promise<OAuthClientInformationFull> {
    await this.store.set(metadata.client_id, metadata);
    return metadata;
  }
}
