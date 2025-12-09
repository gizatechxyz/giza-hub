# Giza Agent SDK

TypeScript SDK for partners to integrate Giza's DeFi yield optimization agents.

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

Create a `.env` file:
```bash
export GIZA_API_KEY="your-partner-api-key"
export GIZA_PARTNER_NAME="your-partner-name"
export GIZA_API_URL="giza-api-url"
```

Basic usage:
```typescript
import { GizaAgent, Chain } from '@giza/agent-sdk';

const giza = new GizaAgent({
  chainId: Chain.BASE,
});

// Create a smart account for a user
const account = await giza.agent.createSmartAccount({
  origin_wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
});

console.log('Smart Account:', account.smartAccountAddress);
```

## Partner Workflow

The SDK provides a complete workflow for partners to manage user agents:

### 1. Create Smart Account

Create a smart account for your user based on their origin wallet (EOA or smart wallet):

```typescript
const account = await giza.agent.createSmartAccount({
  origin_wallet: userWallet,
});

// User should deposit to this address
console.log('Deposit to:', account.smartAccountAddress);
```

### 2. Get Available Protocols

Fetch available DeFi protocols for the deposit token:

```typescript
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const { protocols } = await giza.agent.getProtocols(USDC);
// ['aave', 'compound', 'morpho', ...]
```

### 3. Activate Agent

After the user deposits funds, activate the agent:

```typescript
await giza.agent.activate({
  wallet: account.smartAccountAddress,
  origin_wallet: userWallet,
  initial_token: USDC,
  selected_protocols: protocols,
  tx_hash: depositTxHash,
});
```

### 4. Monitor Performance

Track agent performance and metrics:

```typescript
// Get performance chart data
const performance = await giza.agent.getPerformance({
  wallet: account.smartAccountAddress,
  from_date: '2024-01-01 00:00:00',
});

// Get APR
const apr = await giza.agent.getAPR({
  wallet: account.smartAccountAddress,
});
console.log(`APR: ${apr.apr}%`);

// Get portfolio status
const portfolio = await giza.agent.getPortfolio({
  wallet: account.smartAccountAddress,
});
console.log('Status:', portfolio.status);
console.log('Deposits:', portfolio.deposits);

// Get transaction history
const history = await giza.agent.getTransactions({
  wallet: account.smartAccountAddress,
  page: 1,
  limit: 20,
});
```

### 5. Withdraw

Withdraw funds to the user's origin wallet. Full withdrawal deactivates the agent:

```typescript
await giza.agent.withdraw({
  wallet: account.smartAccountAddress,
  transfer: true, // Transfer to origin wallet
});

// Poll for completion
const status = await giza.agent.pollWithdrawalStatus(
  account.smartAccountAddress,
  {
    interval: 5000,
    timeout: 300000,
    onUpdate: (status) => console.log('Status:', status),
  }
);
```

## API Reference

### Smart Account Operations

| Method | Description |
|--------|-------------|
| `createSmartAccount(params)` | Create a new smart account for a user |
| `getSmartAccount(params)` | Get smart account information |

### Protocol Operations

| Method | Description |
|--------|-------------|
| `getProtocols(tokenAddress)` | Get available protocols for a token |
| `updateProtocols(wallet, protocols)` | Update selected protocols |

### Agent Lifecycle

| Method | Description |
|--------|-------------|
| `activate(params)` | Activate an agent after deposit |
| `deactivate(params)` | Deactivate an agent |
| `topUp(params)` | Add funds to an active agent |
| `run(params)` | Trigger an agent run manually |

### Performance & History

| Method | Description |
|--------|-------------|
| `getPerformance(params)` | Get performance chart data |
| `getPortfolio(params)` | Get portfolio and agent status |
| `getAPR(params)` | Get APR metrics |
| `getTransactions(params)` | Get transaction history |
| `getDeposits(wallet)` | Get deposit history |

### Withdrawal Operations

| Method | Description |
|--------|-------------|
| `withdraw(params)` | Withdraw funds (partial or full) |
| `getWithdrawalStatus(wallet)` | Check withdrawal status |
| `pollWithdrawalStatus(wallet, options)` | Poll until withdrawal completes |
| `getWithdrawalHistory(wallet)` | Get withdrawal history |
| `getFees(wallet)` | Get fee information |

#### Partial vs Full Withdrawal

```typescript
// Partial withdrawal - withdraw specific amount, agent stays active
const result = await giza.agent.withdraw({
  wallet: smartAccountAddress,
  amount: '1000000000', // 1000 USDC (6 decimals)
});
// Returns: { date, total_value, total_value_in_usd, withdraw_details }

// Full withdrawal - withdraw everything and deactivate agent
await giza.agent.withdraw({
  wallet: smartAccountAddress,
  transfer: true, // Transfer to origin wallet
});
// Returns: { message: 'Wallet deactivation initiated' }
```

### Utility Operations

| Method | Description |
|--------|-------------|
| `claimRewards(wallet)` | Claim accrued rewards |
| `getLimit(params)` | Get deposit limit |

## Configuration

### Environment Variables (Required)

| Variable | Description | Required |
|----------|-------------|----------|
| `GIZA_API_KEY` | Partner API key from Giza | ✅ Yes |
| `GIZA_PARTNER_NAME` | Partner name associated with the API key | ✅ Yes |
| `GIZA_API_URL` | Backend API URL | ✅ Yes |

### Constructor Options

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `chainId` | `Chain` | ✅ | - | Blockchain network (BASE or ARBITRUM) |
| `agentId` | `string` | ❌ | `"giza-app"` | Agent identifier |
| `timeout` | `number` | ❌ | `45000` | Request timeout in ms |
| `enableRetry` | `boolean` | ❌ | `false` | Enable retry on 5xx errors |

## Supported Chains

```typescript
import { Chain } from '@giza/agent-sdk';

Chain.BASE      // 8453
Chain.ARBITRUM  // 42161
```

## Error Handling

The SDK provides typed errors for different scenarios:

```typescript
import { 
  GizaAPIError, 
  ValidationError, 
  TimeoutError, 
  NetworkError 
} from '@giza/agent-sdk';

try {
  await giza.agent.activate(params);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid parameters:', error.message);
  } else if (error instanceof GizaAPIError) {
    console.error('API error:', error.statusCode, error.message);
  } else if (error instanceof TimeoutError) {
    console.error('Request timed out');
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  }
}
```

## Running the Example

```bash
# Install dependencies
pnpm install

# Configure .env file with your credentials

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

### Testing

```bash
# Run unit and integration tests
pnpm test

# Run E2E tests (requires local backend services)
pnpm run test:e2e
```

### E2E Tests

E2E tests run against local backend services and test the complete partner workflow:

1. **Smart Account Creation** - Create and fund a smart account
2. **Protocol Discovery** - Get available DeFi protocols
3. **Agent Activation** - Activate the agent with protocols
4. **Performance Monitoring** - Test all monitoring endpoints
5. **Withdrawal** - Test partial and full withdrawal

#### Prerequisites

1. **Start backend services locally:**
   ```bash
   # Terminal 1: Start agents-api
   cd agents-api && pnpm start:dev
   
   # Terminal 2: Start arma-backend
   cd arma-backend && uv run uvicorn arma.main:app --port 8000
   ```

2. **Create a partner API key:**
   ```bash
   cd arma-backend
   uv run arma partners create --name "e2e-test-partner" --description "E2E testing"
   ```

3. **Configure environment variables** (`.env` file):
   ```bash
   GIZA_API_KEY=<your-partner-api-key>
   GIZA_PARTNER_NAME=e2e-test-partner
   GIZA_API_URL=http://localhost:8000
   E2E_TEST_EOA=<your-funded-eoa-on-base>
   ```

4. **Run E2E tests:**
   ```bash
   pnpm run test:e2e
   ```

The tests will prompt you to fund the smart account with USDC on Base chain during execution.

## License

MIT

---

Built with ❤️ by Giza
