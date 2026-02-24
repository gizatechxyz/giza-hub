# Giza Agent SDK

TypeScript SDK and tooling for [Giza Agents](https://www.gizatech.xyz/) — autonomous DeFi yield optimization agents that manage and optimize capital allocation across lending protocols.

## Packages

| Package | Description |
|---------|-------------|
| [`@gizatech/agent-sdk`](./packages/sdk) | SDK for smart account creation, agent lifecycle, portfolio monitoring, and stateless optimization |
| [`@gizatech/mcp-server`](./packages/mcp-server) | MCP server exposing Giza tools to LLMs (Claude, GPT, etc.) via stdio or HTTP transport |

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
import { Giza, Chain } from '@gizatech/agent-sdk';

const giza = new Giza({ chain: Chain.BASE });

// Create a smart account for a user
const agent = await giza.createAgent('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
console.log('Smart Account:', agent.wallet);

// Activate the agent after the user deposits funds
await agent.activate({
  owner: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  protocols: ['aave', 'compound'],
  txHash: depositTxHash,
});

// Monitor performance
const { apr } = await agent.apr();
```

### MCP Server

```bash
bun add @gizatech/mcp-server
```

The MCP server exposes all Giza SDK capabilities as tools that LLMs can call via the [Model Context Protocol](https://modelcontextprotocol.io/). Three integration tiers:

**Zero config** -- reads credentials from env vars, starts stdio transport:

```typescript
import { serve } from '@gizatech/mcp-server';
serve();
```

**Explicit config** -- specify chain, transport, and port:

```typescript
import { serve } from '@gizatech/mcp-server';
serve({ chain: 8453, transport: 'http', port: 3001 });
```

**Full control** -- bring your own Giza instance, cherry-pick tools, custom prompt:

```typescript
import { Giza, Chain } from '@gizatech/agent-sdk';
import {
  createGizaServer,
  portfolioTools,
  lifecycleTools,
  protocolTools,
} from '@gizatech/mcp-server';

const giza = new Giza({ chain: Chain.BASE });
const server = createGizaServer({
  giza,
  tools: [...portfolioTools, ...lifecycleTools, ...protocolTools],
  systemPrompt: 'You are a savings assistant...',
});

await server.stdio();
```

#### Claude Desktop configuration

```json
{
  "mcpServers": {
    "giza": {
      "command": "npx",
      "args": ["@gizatech/mcp-server"],
      "env": {
        "GIZA_API_KEY": "your-api-key",
        "GIZA_PARTNER_NAME": "your-partner-name",
        "GIZA_API_URL": "https://api.giza.tech",
        "GIZA_CHAIN_ID": "8453"
      }
    }
  }
}
```

#### Available tools

| Group | Tools |
|-------|-------|
| Wallet | `connect_wallet`, `disconnect_wallet` |
| Account | `create_smart_account`, `get_smart_account` |
| Protocol | `get_protocols`, `get_tokens`, `get_stats`, `get_tvl` |
| Lifecycle | `activate_agent`, `deactivate_agent`, `top_up`, `run_agent` |
| Portfolio | `get_portfolio`, `get_performance`, `get_apr`, `get_deposits` |
| Financial | `withdraw`, `get_withdrawal_status`, `get_transactions`, `get_fees` |
| Rewards | `claim_rewards` |
| Optimizer | `optimize`, `simulate` |

## Development

Requires [Bun](https://bun.sh/) and Node.js >= 18.

```bash
# Install all workspace dependencies
bun install

# Build everything
bun run --filter '*' build

# Run all tests
bun run --filter '*' test
```

### Per-package commands

```bash
# SDK
bun run --filter @gizatech/agent-sdk build
bun run --filter @gizatech/agent-sdk test

# MCP Server
bun run --filter @gizatech/mcp-server build
bun run --filter @gizatech/mcp-server test
bun run --filter @gizatech/mcp-server test:integration
bun run --filter @gizatech/mcp-server test:e2e
```

### MCP Server test layers

The MCP server has three test layers:

| Command | Layer | What it tests |
|---------|-------|---------------|
| `test` | Unit | Tool handlers, formatters, config resolution |
| `test:integration` | Integration | MCP protocol via `InMemoryTransport` with mocked SDK |
| `test:e2e` | E2E | Spawned CLI process via stdio and HTTP transports |

Integration tests exercise tool registration, Zod schema wiring, wallet session state, error propagation, and prompt registration through a real MCP client/server handshake -- all in-process with no network calls.

E2E tests spawn `dist/cli.js` and connect via `StdioClientTransport` and `StreamableHTTPClientTransport`, verifying the full process boundary. The `test:e2e` script builds automatically before running.

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
- [MCP Server](./docs/mcp-server/overview.mdx)
- [MCP Server Testing](./docs/mcp-server/testing.mdx)
- [Examples](./docs/examples/basic-usage.mdx)

## License

MIT
