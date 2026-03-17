export const SERVER_NAME = 'giza-mcp-server';
export const SERVER_VERSION = '0.1.2';
export const DEFAULT_PORT = 3000;
export const ENV_PORT = 'PORT';

export const ENV_PRIVY_APP_ID = 'PRIVY_APP_ID';
export const ENV_JWT_SECRET = 'JWT_SECRET';
export const ENV_MCP_DOMAIN = 'MCP_DOMAIN';
export const ENV_REDIS_URL = 'mcp_REDIS_URL';
export const ACCESS_TOKEN_TTL_SEC = 3600;
export const REFRESH_TOKEN_TTL_SEC = 604_800;
export const AUTH_CODE_TTL_MS = 300_000;
export const JWT_ISSUER = SERVER_NAME;
export const JWT_AUDIENCE = 'giza-mcp';
export const CONFIRMATION_TOKEN_TTL_MS = 300_000;
export const SUPPORTED_SCOPES = ['mcp:tools'] as const;

export const SESSION_AUTH_TTL_MS = 3_600_000;
export const DEVICE_STATE_PREFIX = 'device:';

export const MAX_PENDING_SESSIONS = 10_000;
export const MAX_AUTH_CODES = 5_000;
export const MAX_SESSION_AUTH_ENTRIES = 10_000;
export const MAX_PENDING_OPERATIONS = 5_000;
export const MAX_PENDING_DEVICES = 10_000;

export const ANNOTATIONS_READONLY = {
  readOnlyHint: true,
  idempotentHint: true,
} as const;

export const ANNOTATIONS_DESTRUCTIVE = {
  destructiveHint: true,
  openWorldHint: true,
} as const;

export const ANNOTATIONS_MUTATING = {
  openWorldHint: true,
} as const;

export const ANNOTATIONS_IDEMPOTENT_MUTATING = {
  idempotentHint: true,
  openWorldHint: true,
} as const;

export const GIZA_INSTRUCTIONS = `You are helping a user manage their DeFi yield on Giza — a platform where your money earns yield automatically across DeFi protocols.

HOW GIZA WORKS: Users deposit stablecoins (USDC, USDT0) into a Giza account. An automated agent rebalances across lending protocols (Aave, Compound, Morpho, etc.) to maximize returns. Giza charges 10% of yield earned — nothing on deposits, withdrawals, or rebalancing.

SUPPORTED NETWORKS & TOKENS:
- Base (default): USDC — includes Giza Rewards with a 15% minimum APR target
- Arbitrum: USDC
- Plasma: USDT0
- HyperEVM: USDT0
Default to Base if the user doesn't specify a network.

TONE: Start with simple, non-technical language. If the user uses technical terms (chain IDs, smart contracts, APR vs APY), match their level. Say "account" not "smart account", "network" not "chain", unless the user prefers technical terms.

RESPONSE STYLE: Be concise. Summarize data in 1-3 sentences with numbers, percentages, and key facts. Only show tables or full details when asked. Never dump raw JSON.

CRITICAL OPERATIONS: Withdrawals and deactivation require explicit user confirmation. Clearly explain what will happen and get a "yes" before proceeding. Never auto-confirm.

AUTH: If any tool returns an auth error, initiate login. Show the login URL and ask the user to open it in their browser. Retry after they confirm.`;

export function getBaseUrl(): string {
  return (
    process.env[ENV_MCP_DOMAIN] ??
    `http://127.0.0.1:${process.env[ENV_PORT] ?? DEFAULT_PORT}`
  );
}
