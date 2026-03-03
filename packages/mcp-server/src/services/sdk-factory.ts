import { Giza, Chain } from '@gizatech/agent-sdk';

const clientCache = new Map<Chain, Giza>();

export function getGizaClient(chain: Chain): Giza {
  let client = clientCache.get(chain);
  if (!client) {
    client = new Giza({ chain });
    clientCache.set(chain, client);
  }
  return client;
}

export function getDefaultGizaClient(): Giza {
  return getGizaClient(Chain.BASE);
}
