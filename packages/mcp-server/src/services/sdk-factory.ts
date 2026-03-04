import { Giza, Chain } from '@gizatech/agent-sdk';
import type { Agent, Address } from '@gizatech/agent-sdk';

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

const agentCache = new Map<string, Agent>();

export async function getAgentForSession(
  chain: Chain,
  eoa: Address,
): Promise<Agent> {
  const key = `${chain}:${eoa}`;
  let agent = agentCache.get(key);
  if (!agent) {
    const giza = getGizaClient(chain);
    agent = await giza.getAgent(eoa);
    agentCache.set(key, agent);
  }
  return agent;
}
