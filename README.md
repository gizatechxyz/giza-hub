# Giza Agent SDK

TypeScript SDK for integrating [Giza Agents](https://www.gizatech.xyz/) - autonomous DeFi yield optimization agents that automatically manage and optimize capital allocation across lending protocols.

## What is Giza Agent SDK?

Giza Agent SDK enables partners to integrate self-driving capital management into their applications. Create smart accounts for users, activate autonomous agents, and let Giza optimize yield across DeFi protocols like Aave, Compound, and Moonwell.

## Features

- 🤖 **Autonomous Yield Optimization** - Agents automatically rebalance capital for maximum APR
- 🔐 **Smart Account Management** - ZeroDev-powered smart accounts with secure session keys
- 📊 **Performance Monitoring** - Real-time APR tracking and portfolio analytics
- 🔄 **Multi-Protocol Support** - Seamless integration with leading DeFi protocols
- 💰 **Flexible Withdrawals** - Partial or full withdrawals with automatic deactivation
- ⚡ **Intelligence as a Service (IaaS)** - Stateless Optimizer for partners with existing execution infrastructure

## Installation

```bash
npm install @gizatech/agent-sdk
# or
pnpm add @gizatech/agent-sdk
# or
yarn add @gizatech/agent-sdk
```

## Quick Start

```typescript
import { GizaAgent, Chain } from '@gizatech/agent-sdk';

// Initialize the SDK
const giza = new GizaAgent({
  chainId: Chain.BASE,
});

// Create smart account for user
const account = await giza.agent.createSmartAccount({
  origin_wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
});

// Get available protocols
const { protocols } = await giza.agent.getProtocols(USDC_ADDRESS);

// Activate agent after user deposits
await giza.agent.activate({
  wallet: account.smartAccountAddress,
  origin_wallet: userWallet,
  initial_token: USDC_ADDRESS,
  selected_protocols: ['aave', 'compound'],
  tx_hash: depositTxHash,
});

// Monitor performance
const performance = await giza.agent.getPerformance({ 
  wallet: account.smartAccountAddress 
});
const apr = await giza.agent.getAPR({ 
  wallet: account.smartAccountAddress 
});
```

## Environment Setup

Set these environment variables:

```bash
GIZA_API_KEY=your-partner-api-key
GIZA_API_URL=your-api-url
GIZA_PARTNER_NAME=your-partner-name
```

**Get API Keys**: Contact Giza at [gizatech.xyz](https://www.gizatech.xyz/) to obtain your partner credentials.

## Documentation

📚 **[Full Documentation](./docs)** - Complete guides, API reference, and examples

- [Quickstart Guide](./docs/quickstart.mdx) - Get up and running in minutes
- [Integration Methods](./docs/integration-methods.mdx) - Choose between Agentic vs IaaS approaches
- [Core Concepts](./docs/concepts/overview.mdx) - Understand smart accounts, agents, and protocols
- [API Reference](./docs/api-reference/client.mdx) - Complete method documentation
- [Examples](./docs/examples/basic-usage.mdx) - Practical code examples

## Examples

Run the included examples:

```bash
# Complete agent workflow
pnpm run example:agent

# Optimizer usage
pnpm run example:optimizer
```

## Development

```bash
# Install dependencies
pnpm install

# Build the SDK
pnpm build

# Run tests
pnpm test

# Watch mode for development
pnpm dev
```

## Support

- **Documentation**: [Full Documentation](./docs)
- **Website**: [gizatech.xyz](https://www.gizatech.xyz/)
- **Issues**: [GitHub Issues](https://github.com/gizatech/agent-sdk/issues)
- **Email**: support@gizatech.xyz

## License

MIT © Giza
