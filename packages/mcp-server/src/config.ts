import { z } from 'zod';
import { Chain } from '@gizatech/agent-sdk';

const DEFAULT_GIZA_API_URL =
  'https://partners-backend-1038109371738.europe-west1.run.app';

const configSchema = z.object({
  gizaApiKey: z.string().min(1, 'GIZA_API_KEY is required'),
  gizaPartnerName: z.string().min(1, 'GIZA_PARTNER_NAME is required'),
  gizaChainId: z.coerce
    .number()
    .refine(
      (v): v is Chain => v === Chain.BASE || v === Chain.ARBITRUM,
      { message: `GIZA_CHAIN_ID must be ${Chain.BASE} (Base) or ${Chain.ARBITRUM} (Arbitrum)` },
    ),
  gizaApiUrl: z.string().url().default(DEFAULT_GIZA_API_URL),
  transport: z.enum(['stdio', 'http']).default('stdio'),
  port: z.coerce.number().int().positive().default(3000),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  const result = configSchema.safeParse({
    gizaApiKey: process.env.GIZA_API_KEY,
    gizaPartnerName: process.env.GIZA_PARTNER_NAME,
    gizaChainId: process.env.GIZA_CHAIN_ID,
    gizaApiUrl: process.env.GIZA_API_URL || DEFAULT_GIZA_API_URL,
    transport: process.env.TRANSPORT,
    port: process.env.PORT,
  });

  if (!result.success) {
    const messages = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid configuration:\n${messages}`);
  }

  return result.data;
}
