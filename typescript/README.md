# Giza Agent SDK

TypeScript SDK for integrating Giza's agents.

## Installation

```bash
npm install @giza/agent-sdk
```

or

```bash
yarn add @giza/agent-sdk
```

or

```bash
pnpm add @giza/agent-sdk
```

## Quick Start

Create a `.env` file (copy from `env-template`):
```bash

export GIZA_API_KEY="..."
export GIZA_API_URL="..."
```

Then use the SDK:
```typescript
import { GizaAgent, Chain } from '@giza/agent-sdk';

// Initialize the SDK
const agent = new GizaAgent({
  chainId: Chain.BASE,
});

// Create a smart account
const account = await agent.smartAccount.create({
  origin_wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
});

console.log('Smart Account:', account.smartAccountAddress);
console.log('Backend Wallet:', account.backendWallet);
```

## Configuration

### Environment Variables (Required)

The SDK requires the following environment variables to be set:

| Variable | Description | Required |
|----------|-------------|----------|
| `GIZA_API_KEY` | Partner API key from Giza | ✅ Yes |
| `GIZA_API_URL` | Backend API URL | ✅ Yes |

### Configuration Options

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `chainId` | `Chain` | ✅ | - | Blockchain network (BASE or ARBITRUM) |
| `agentId` | `string` | ❌ | `"arma-dev"` | Agent identifier |
| `timeout` | `number` | ❌ | `45000` | Request timeout in ms |
| `enableRetry` | `boolean` | ❌ | `false` | Enable retry on 5xx errors |

## Example

Run the example script:

```bash
# Install dependencies
pnpm install

# Make sure .env file is configured with your credentials

# Run the example
pnpm run example
```

## Development

### Building

```bash
pnpm run build
```

### Development Mode

```bash
pnpm run dev
```

This will watch for changes and rebuild automatically.

### Cleaning Build Files

```bash
pnpm run clean
```

## Testing

The SDK includes test suite with unit, integration, and E2E tests.

### Run Tests

```bash
# Run all tests (unit + integration)
pnpm test

# Run E2E tests (requires local backend services)
pnpm run test:e2e
```

### Test Structure

- **Unit Tests** (`__tests__/unit/`): Test individual components in isolation
- **Integration Tests** (`__tests__/integration/`): Test component interactions with mocked HTTP
- **E2E Tests** (`__tests__/e2e/`): Test complete flows against local backend services

## Roadmap

Features coming in future releases:

- ✅ Smart account creation
- ✅ Smart account queries by origin wallet
- 🔄 Smart account queries by address (planned)
- 🔄 Permission updates (planned)
- 🔄 Performance tracking module (planned)
- 🔄 Withdrawal module (planned)
- 🔄 Optimizer module with x402 payments (planned)

## License

MIT

---

Built with ❤️ by Giza
