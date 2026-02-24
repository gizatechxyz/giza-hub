import type { ToolDefinition } from '../types.js';
import { walletTools } from './wallet.js';
import { accountTools } from './account.js';
import { protocolTools } from './protocol.js';
import { lifecycleTools } from './lifecycle.js';
import { portfolioTools } from './portfolio.js';
import { financialTools } from './financial.js';
import { rewardsTools } from './rewards.js';
import { optimizerTools } from './optimizer.js';

export {
  walletTools,
  accountTools,
  protocolTools,
  lifecycleTools,
  portfolioTools,
  financialTools,
  rewardsTools,
  optimizerTools,
};

/**
 * All built-in tools combined. Used as the default when
 * no custom tool selection is provided.
 */
export const allTools: ToolDefinition[] = [
  ...walletTools,
  ...accountTools,
  ...protocolTools,
  ...lifecycleTools,
  ...portfolioTools,
  ...financialTools,
  ...rewardsTools,
  ...optimizerTools,
];
