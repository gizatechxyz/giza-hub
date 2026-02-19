import { z } from "zod";

const configSchema = z.object({
  gizaApiKey: z.string().min(1, "GIZA_API_KEY is required"),
  gizaApiUrl: z
    .string()
    .url("GIZA_API_URL must be a valid URL")
    .default("https://api.giza.tech"),
  gizaPartnerName: z.string().min(1, "GIZA_PARTNER_NAME is required"),
  gizaChainId: z.coerce.number().int().default(8453),
  rpcUrl: z.string().url().optional(),
  siweDomain: z.string().min(1).default("localhost"),
  siweUri: z.string().url().optional(),
  transport: z.enum(["http", "stdio"]).default("http"),
  port: z.coerce.number().int().min(1).max(65535).default(3000),
  rateLimitPerWallet: z.coerce.number().int().positive().default(30),
  rateLimitPerApp: z.coerce.number().int().positive().default(1000),
  rateLimitWindowMs: z.coerce.number().int().positive().default(60_000),
  sessionTtlMs: z.coerce.number().int().positive().default(3_600_000),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  const result = configSchema.safeParse({
    gizaApiKey: process.env["GIZA_API_KEY"],
    gizaApiUrl: process.env["GIZA_API_URL"],
    gizaPartnerName: process.env["GIZA_PARTNER_NAME"],
    gizaChainId: process.env["GIZA_CHAIN_ID"],
    rpcUrl: process.env["RPC_URL"],
    siweDomain: process.env["SIWE_DOMAIN"],
    siweUri: process.env["SIWE_URI"],
    transport: process.env["TRANSPORT"],
    port: process.env["PORT"],
    rateLimitPerWallet: process.env["RATE_LIMIT_PER_WALLET"],
    rateLimitPerApp: process.env["RATE_LIMIT_PER_APP"],
    rateLimitWindowMs: process.env["RATE_LIMIT_WINDOW_MS"],
    sessionTtlMs: process.env["SESSION_TTL_MS"],
  });

  if (!result.success) {
    const messages = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid configuration:\n${messages}`);
  }

  return result.data;
}
