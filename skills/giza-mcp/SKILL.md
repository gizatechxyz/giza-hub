---
name: giza-mcp
description: MCP server setup for LLM integration — Claude Desktop, Cursor, Claude Code, CLI
user-invocable: true
---

Your job: help the developer set up and configure the `@gizatech/mcp-server` so LLMs can manage Giza yield agents via MCP tools. Always produce working configuration and TypeScript (ESM).

## Installation

```bash
pnpm add @gizatech/mcp-server
```

## Quick Setup — Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "giza": {
      "command": "npx",
      "args": ["@gizatech/mcp-server"],
      "env": {
        "GIZA_API_KEY": "your-api-key",
        "CHAIN_ID": "8453"
      }
    }
  }
}
```

## Quick Setup — Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "giza": {
      "command": "npx",
      "args": ["@gizatech/mcp-server"],
      "env": {
        "GIZA_API_KEY": "your-api-key",
        "CHAIN_ID": "8453"
      }
    }
  }
}
```

## Quick Setup — Claude Code

Add to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "giza": {
      "command": "npx",
      "args": ["@gizatech/mcp-server"],
      "env": {
        "GIZA_API_KEY": "your-api-key",
        "CHAIN_ID": "8453"
      }
    }
  }
}
```

## Quick Setup — CLI (stdio)

```bash
GIZA_API_KEY=your-key CHAIN_ID=8453 npx @gizatech/mcp-server
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GIZA_API_KEY` | Yes | — | Partner API key |
| `GIZA_PARTNER_NAME` | No | — | Partner name |
| `GIZA_API_URL` | No | — | API URL override |
| `CHAIN_ID` | Yes | — | Blockchain chain ID (e.g., `8453` for Base) |
| `TRANSPORT` | No | `stdio` | Transport protocol: `stdio` or `http` |
| `PORT` | No | `3000` | HTTP port (when `TRANSPORT=http`) |

## 3 Configuration Tiers

### Tier 1 — `serve()` (zero-config)

Uses environment variables for everything:

```typescript
import { serve } from '@gizatech/mcp-server';

await serve(); // reads GIZA_API_KEY, CHAIN_ID, etc. from env
```

### Tier 2 — `serve(config)` (explicit config)

Override specific options:

```typescript
import { serve } from '@gizatech/mcp-server';

await serve({
  chain: 8453,
  apiKey: 'your-key',
  partner: 'your-partner',
  transport: 'http',
  port: 3001,
});
```

### Tier 3 — `createGizaServer(config)` (full control)

Build your own server with a pre-configured `Giza` SDK instance:

```typescript
import { Giza, Chain } from '@gizatech/agent-sdk';
import { createGizaServer, resolveConfig } from '@gizatech/mcp-server';

const giza = new Giza({ chain: Chain.BASE, apiKey: 'your-key' });

const resolved = resolveConfig({
  giza,
  name: 'my-custom-server',
  version: '1.0.0',
});

const server = createGizaServer(resolved);
// server.mcp is the underlying McpServer — add custom tools, connect transports, etc.
```

## ServerConfig Interface

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `giza` | `Giza` | — | Pre-built SDK instance (tier 3) |
| `chain` | `number` | `CHAIN_ID` env | Chain ID |
| `apiKey` | `string` | `GIZA_API_KEY` env | API key |
| `partner` | `string` | `GIZA_PARTNER_NAME` env | Partner name |
| `apiUrl` | `string` | `GIZA_API_URL` env | API URL |
| `tools` | `ToolDefinition[]` | `allTools` | Tool definitions to register |
| `systemPrompt` | `string` | Built-in prompt | Custom MCP system prompt |
| `name` | `string` | `giza-yield-server` | MCP server name |
| `version` | `string` | `0.0.1` | MCP server version |
| `transport` | `'stdio' \| 'http'` | `stdio` | Transport protocol |
| `port` | `number` | `3000` | HTTP port |

## All 22 MCP Tools

### Wallet Tools (2)

| Tool | Description | Params |
|------|-------------|--------|
| `connect_wallet` | Connect wallet address to session | `wallet: Address` |
| `disconnect_wallet` | Disconnect wallet from session | — |

### Account Tools (2)

| Tool | Description | Params |
|------|-------------|--------|
| `create_smart_account` | Create Giza smart account for EOA | `eoa: Address` |
| `get_smart_account` | Look up smart account by EOA | `eoa: Address` |

### Protocol Tools (4)

| Tool | Description | Params |
|------|-------------|--------|
| `get_protocols` | Active protocols for a token | `token: Address` |
| `get_tokens` | All tokens on chain | — |
| `get_stats` | Chain statistics (TVL, users, APR) | — |
| `get_tvl` | Total value locked | — |

### Lifecycle Tools (4)

| Tool | Description | Params |
|------|-------------|--------|
| `activate_agent` | Activate yield agent | `owner`, `token`, `protocols[]`, `txHash`, `constraints[]?` |
| `deactivate_agent` | Deactivate agent | `transfer?: boolean` |
| `top_up` | Top up agent funds | `txHash: string` |
| `run_agent` | Trigger optimization execution | — |

### Portfolio Tools (4)

| Tool | Description | Params |
|------|-------------|--------|
| `get_portfolio` | Full portfolio info | — |
| `get_performance` | Performance chart data | `from?: YYYY-MM-DD` |
| `get_apr` | Wallet APR | `startDate?`, `endDate?`, `useExactEndDate?` |
| `get_deposits` | Deposit history | — |

### Financial Tools (4)

| Tool | Description | Params |
|------|-------------|--------|
| `withdraw` | Withdraw funds (partial or full) | `amount?: string` |
| `get_withdrawal_status` | Current withdrawal status | — |
| `get_transactions` | Transaction history | `limit?: int`, `sort?: string` |
| `get_fees` | Fee information | — |

### Rewards Tools (1)

| Tool | Description | Params |
|------|-------------|--------|
| `claim_rewards` | Claim available rewards | — |

### Optimizer Tools (1)

| Tool | Description | Params |
|------|-------------|--------|
| `optimize` | Run yield optimizer | `token`, `capital`, `currentAllocations`, `protocols[]`, `constraints[]?`, `wallet?` |

## Tool-to-SDK Method Mapping

| MCP Tool | SDK Method |
|----------|-----------|
| `connect_wallet` | Session-level (wallet store) |
| `disconnect_wallet` | Session-level (wallet store) |
| `create_smart_account` | `giza.createAgent(eoa)` |
| `get_smart_account` | `giza.getSmartAccount(eoa)` |
| `get_protocols` | `giza.protocols(token)` |
| `get_tokens` | `giza.tokens()` |
| `get_stats` | `giza.stats()` |
| `get_tvl` | `giza.tvl()` |
| `activate_agent` | `agent.activate(options)` |
| `deactivate_agent` | `agent.deactivate(options)` |
| `top_up` | `agent.topUp(txHash)` |
| `run_agent` | `agent.run()` |
| `get_portfolio` | `agent.portfolio()` |
| `get_performance` | `agent.performance(options)` |
| `get_apr` | `agent.apr(options)` |
| `get_deposits` | `agent.deposits()` |
| `withdraw` | `agent.withdraw(amount?)` |
| `get_withdrawal_status` | `agent.status()` |
| `get_transactions` | `agent.transactions(options).first()` |
| `get_fees` | `agent.fees()` |
| `claim_rewards` | `agent.claimRewards()` |
| `optimize` | `giza.optimize(options)` |

## Cherry-Picking Tool Groups

Register only the tool groups you need:

```typescript
import { serve } from '@gizatech/mcp-server';
import {
  walletTools,
  accountTools,
  protocolTools,
  lifecycleTools,
  portfolioTools,
  financialTools,
  rewardsTools,
  optimizerTools,
} from '@gizatech/mcp-server';

// Read-only server — no lifecycle or financial operations
await serve({
  tools: [...walletTools, ...accountTools, ...protocolTools, ...portfolioTools],
});
```

## HTTP Transport

```typescript
await serve({
  transport: 'http',
  port: 3001,
});
```

Or via environment:

```bash
TRANSPORT=http PORT=3001 GIZA_API_KEY=your-key CHAIN_ID=8453 npx @gizatech/mcp-server
```

## Typical LLM Conversation Flow

1. **User:** "Connect my wallet 0xABC..."
   - LLM calls `connect_wallet` with `{ wallet: "0xABC..." }`

2. **User:** "What tokens are available?"
   - LLM calls `get_tokens`

3. **User:** "Show me protocols for USDC"
   - LLM calls `get_protocols` with `{ token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" }`

4. **User:** "Activate my agent with aave-v3 and morpho-blue, here's my deposit tx: 0xDEF..."
   - LLM calls `activate_agent` with owner, token, protocols, txHash

5. **User:** "How's my portfolio doing?"
   - LLM calls `get_portfolio` and `get_apr`

6. **User:** "Optimize my allocation"
   - LLM calls `optimize` with current allocation data

7. **User:** "Withdraw 500 USDC"
   - LLM calls `withdraw` with `{ amount: "500000000" }`

## Related Skills

- `/giza` — SDK quickstart, configuration, complete API reference
- `/giza-manage` — Agent lifecycle, activation, deactivation, fund management
- `/giza-monitor` — Portfolio monitoring, APR, performance, transaction history
- `/giza-optimize` — Capital allocation optimizer
