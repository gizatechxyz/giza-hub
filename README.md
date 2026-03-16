# Giza Hub

Monorepo for the Giza developer platform and AI Agents — SDK, MCP server, and plugin and Skills for autonomous DeFi yield optimization.

## Packages

| Package | Description |
|---|---|
| [`@gizatech/agent-sdk`](./packages/sdk) | TypeScript SDK for smart account creation, agent lifecycle, portfolio monitoring, and optimization |
| [`@gizatech/mcp-server`](./packages/mcp-server) | MCP server exposing Giza tools for AI assistants (OAuth, Redis-backed sessions, Vercel-ready) |
| [`giza-skills`](./plugins/giza-skills) | Claude Code plugin with guided DeFi workflows — onboarding, portfolio, withdrawals, rewards |

## Quick start

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- A Giza partner API key — contact [gizatech.xyz](https://www.gizatech.xyz/) to obtain credentials

### Environment variables

```bash
GIZA_API_KEY=your-partner-api-key
GIZA_API_URL=your-api-url
GIZA_PARTNER_NAME=your-partner-name
```

### Install the SDK

```bash
bun add @gizatech/agent-sdk
```

```typescript
import { Giza, Chain } from "@gizatech/agent-sdk";

const giza = new Giza({ chain: Chain.BASE });

const agent = await giza.createAgent(
  "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
);
console.log("Smart Account:", agent.wallet);

await agent.activate({
  owner: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  protocols: ["aave", "compound"],
  txHash: depositTxHash,
});

const { apr } = await agent.apr();
```

### Use the MCP server

Connect any MCP-compatible client (Claude Desktop, Claude Code, Cursor) to the hosted server:

```json
{
  "mcpServers": {
    "giza": {
      "type": "http",
      "url": "https://mcp.gizatech.xyz/api/mcp"
    }
  }
}
```

See the [MCP server README](./packages/mcp-server) for self-hosting and local development.

### Install the Claude Code plugin

```bash
/plugin marketplace add gizatechxyz/giza-hub
/plugin install giza-skills
```

See the [plugin README](./plugins/giza-skills) for available skills and supported networks.

## SDK tools

| Group | Tools |
|---|---|
| Wallet | `connect_wallet`, `disconnect_wallet` |
| Account | `create_smart_account`, `get_smart_account` |
| Protocol | `get_protocols`, `get_tokens`, `get_stats`, `get_tvl` |
| Lifecycle | `activate_agent`, `deactivate_agent`, `top_up` |
| Portfolio | `get_portfolio`, `get_performance`, `get_apr`, `get_deposits` |
| Financial | `withdraw`, `get_withdrawal_status`, `get_transactions`, `get_fees` |
| Rewards | `claim_rewards` |
| Optimizer | `optimize` |

## Supported networks

- **Base (8453)** — default, includes Giza Rewards program
- **Arbitrum (42161)** — USDC
- **Plasma (9745)** — USDT0
- **HyperEVM (999)** — USDT0

## Examples

```bash
bun run --filter @gizatech/agent-sdk example:agent
bun run --filter @gizatech/agent-sdk example:optimizer
```

## Development

```bash
bun install

# SDK
cd packages/sdk && bun run build

# MCP server (local)
cd packages/mcp-server && cp .env.example .env && bun run dev

# Plugin (local)
claude --plugin-dir ./plugins/giza-skills
```

## License

MIT
