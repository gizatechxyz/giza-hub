# Giza Agent SDK

TypeScript SDK and tooling for [Giza Agents](https://www.gizatech.xyz/) — autonomous DeFi yield optimization agents that manage and optimize capital allocation across lending protocols.

## Packages

| Package | Description |
|---------|-------------|
| [`@gizatech/agent-sdk`](./packages/sdk) | SDK for smart account creation, agent lifecycle, portfolio monitoring, and stateless optimization |

## Quick Start

### Install the SDK

```bash
bun add @gizatech/agent-sdk
```

### Environment variables

```bash
GIZA_API_KEY=your-partner-api-key
GIZA_API_URL=your-api-url
GIZA_PARTNER_NAME=your-partner-name
```

Contact Giza at [gizatech.xyz](https://www.gizatech.xyz/) to obtain partner credentials.

### Usage

```typescript
import { GizaAgent, Chain } from '@gizatech/agent-sdk';

const giza = new GizaAgent({ chainId: Chain.BASE });

// Create a smart account for a user
const account = await giza.agent.createSmartAccount({
  origin_wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
});

// Activate the agent after the user deposits funds
await giza.agent.activate({
  wallet: account.smartAccountAddress,
  origin_wallet: userWallet,
  initial_token: USDC_ADDRESS,
  selected_protocols: ['aave', 'compound'],
  tx_hash: depositTxHash,
});

// Monitor performance
const { apr } = await giza.agent.getAPR({
  wallet: account.smartAccountAddress,
});
```

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
```

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
- [API Reference](./docs/api-reference/client.mdx)
- [Examples](./docs/examples/basic-usage.mdx)

## License

MIT
