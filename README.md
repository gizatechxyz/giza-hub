# Giza Agent SDK

TypeScript SDK and tooling for [Giza Agents](https://www.gizatech.xyz/) — autonomous DeFi yield optimization agents that manage and optimize capital allocation across lending protocols.

## Packages

| Package                                              | Description                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [`@gizatech/agent-sdk`](./packages/sdk)              | SDK for smart account creation, agent lifecycle, portfolio monitoring, and stateless optimization |
| [`@gizatech/mcp-server`](./packages/mcp-server)      | MCP server exposing Giza tools for AI assistants (OAuth, Redis-backed sessions, Vercel-ready)     |

## Quick Start

### Environment variables

```bash
GIZA_API_KEY=your-partner-api-key
GIZA_API_URL=your-api-url
GIZA_PARTNER_NAME=your-partner-name
```

Contact Giza at [gizatech.xyz](https://www.gizatech.xyz/) to obtain partner credentials.

### SDK

```bash
bun add @gizatech/agent-sdk
```

```typescript
import { Giza, Chain } from "@gizatech/agent-sdk";

const giza = new Giza({ chain: Chain.BASE });

// Create a smart account for a user
const agent = await giza.createAgent(
  "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
);
console.log("Smart Account:", agent.wallet);

// Activate the agent after the user deposits funds
await agent.activate({
  owner: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  protocols: ["aave", "compound"],
  txHash: depositTxHash,
});

// Monitor performance
const { apr } = await agent.apr();
```

#### Available tools

| Group     | Tools                                                               |
| --------- | ------------------------------------------------------------------- |
| Wallet    | `connect_wallet`, `disconnect_wallet`                               |
| Account   | `create_smart_account`, `get_smart_account`                         |
| Protocol  | `get_protocols`, `get_tokens`, `get_stats`, `get_tvl`               |
| Lifecycle | `activate_agent`, `deactivate_agent`, `top_up`, `run_agent`         |
| Portfolio | `get_portfolio`, `get_performance`, `get_apr`, `get_deposits`       |
| Financial | `withdraw`, `get_withdrawal_status`, `get_transactions`, `get_fees` |
| Rewards   | `claim_rewards`                                                     |
| Optimizer | `optimize`                                                          |

### Examples

```bash
bun run --filter @gizatech/agent-sdk example:agent
bun run --filter @gizatech/agent-sdk example:optimizer
```

## Documentation

- [Quickstart](./docs/quickstart.mdx)
- [Integration Methods](./docs/integration-methods.mdx)
- [Core Concepts](./docs/concepts/overview.mdx)
- [SDK Reference](./docs/sdk-reference/overview.mdx)
- [Claude Code Skills](./docs/skills.mdx)
- [Examples](./docs/examples/basic-usage.mdx)

## License

MIT
