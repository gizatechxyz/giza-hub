import { z } from 'zod';
import { Giza, Chain } from '@gizatech/agent-sdk';
import type { ServerConfig, ResolvedServerConfig } from './types.js';
import { allTools } from './tools/index.js';
import { DEFAULT_SYSTEM_PROMPT } from './prompt.js';

const CHAIN_VALUES = new Set<number>(
  Object.values(Chain).filter((v): v is number => typeof v === 'number'),
);

const serverConfigSchema = z.object({
  chain: z
    .number()
    .refine((v) => CHAIN_VALUES.has(v), { message: 'Unsupported chain ID' })
    .optional(),
  apiKey: z.string().min(1).optional(),
  partner: z.string().min(1).optional(),
  apiUrl: z.string().url().optional(),
  name: z.string().min(1).optional(),
  version: z.string().min(1).optional(),
  transport: z.enum(['stdio', 'http']).optional(),
  port: z.number().int().min(1).max(65535).optional(),
  systemPrompt: z.string().optional(),
});

/**
 * Resolve a partial ServerConfig into a fully resolved config
 * by filling gaps from environment variables and defaults.
 */
export function resolveConfig(
  input: ServerConfig = {},
): ResolvedServerConfig {
  if (input.giza) {
    return {
      giza: input.giza,
      tools: input.tools ?? allTools,
      systemPrompt: input.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
      name: input.name ?? 'giza-yield-server',
      version: input.version ?? '0.0.1',
      transport: input.transport ?? envTransport(),
      port: input.port ?? envPort(),
    };
  }

  const chain = input.chain ?? envChainId();
  const apiKey = input.apiKey ?? process.env['GIZA_API_KEY'];
  const partner = input.partner ?? process.env['GIZA_PARTNER_NAME'];
  const apiUrl = input.apiUrl ?? process.env['GIZA_API_URL'];

  const parsed = serverConfigSchema.parse({
    chain,
    apiKey,
    partner,
    apiUrl,
    name: input.name,
    version: input.version,
    transport: input.transport,
    port: input.port,
    systemPrompt: input.systemPrompt,
  });

  const giza = new Giza({
    chain: parsed.chain as Chain,
    apiKey: parsed.apiKey,
    partner: parsed.partner,
    apiUrl: parsed.apiUrl,
  });

  return {
    giza,
    tools: input.tools ?? allTools,
    systemPrompt: input.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
    name: parsed.name ?? 'giza-yield-server',
    version: parsed.version ?? '0.0.1',
    transport: parsed.transport ?? envTransport(),
    port: parsed.port ?? envPort(),
  };
}

function envChainId(): number | undefined {
  const raw = process.env['CHAIN_ID'];
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function envTransport(): 'stdio' | 'http' {
  const raw = process.env['TRANSPORT'];
  return raw === 'http' ? 'http' : 'stdio';
}

function envPort(): number {
  const raw = process.env['PORT'];
  if (!raw) return 3000;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 3000;
}
