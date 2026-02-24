// Entry points
export { serve } from './serve.js';
export { createGizaServer, GizaServer } from './server.js';

// Config
export { resolveConfig } from './config.js';

// Tool groups
export {
  walletTools,
  accountTools,
  protocolTools,
  lifecycleTools,
  portfolioTools,
  financialTools,
  rewardsTools,
  optimizerTools,
  allTools,
} from './tools/index.js';

// Context & errors
export { WalletContextStore } from './context.js';
export { WalletNotConnectedError, formatToolError } from './errors.js';

// Formatting helpers
export { textResult, errorResult, jsonResult, formatAddress } from './format.js';

// Prompt
export { DEFAULT_SYSTEM_PROMPT } from './prompt.js';

// Types
export type {
  ToolDefinition,
  ToolContext,
  ToolResult,
  ServerConfig,
  ResolvedServerConfig,
} from './types.js';
