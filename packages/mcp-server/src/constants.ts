export const SERVER_NAME = 'giza-mcp-server';
export const SERVER_VERSION = '0.1.0';
export const DEFAULT_PORT = 3000;
export const ENV_PORT = 'PORT';

export const ENV_PRIVY_APP_ID = 'PRIVY_APP_ID';
export const ENV_PRIVY_APP_SECRET = 'PRIVY_APP_SECRET';
export const ENV_JWT_SECRET = 'JWT_SECRET';
export const ENV_MCP_DOMAIN = 'MCP_DOMAIN';
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
export const MAX_MCP_TRANSPORTS = 10_000;

export function getBaseUrl(): string {
  return (
    process.env[ENV_MCP_DOMAIN] ??
    `http://127.0.0.1:${process.env[ENV_PORT] ?? DEFAULT_PORT}`
  );
}
