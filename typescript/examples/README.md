# Examples

This directory contains example scripts demonstrating how to use the Giza Agent SDK.

## Setup

1. **Configure environment variables** by creating a `.env` file in the root directory:

```bash
# Copy the template
cp env-template .env

# Edit .env with your credentials
# GIZA_API_KEY=your-partner-api-key
# GIZA_API_URL=giza-api-url
```

2. **Install dependencies** (if not already done):

```bash
pnpm install
```

## Agent Examples

### Complete Partner Workflow

Demonstrates the complete partner integration workflow:

```bash
pnpm run example
```

**Note:** 
- Update the `userOriginWallet` variable in `agent.example.ts` with your actual user's wallet address before running.


### Optimizer Example

Demonstrates how to use Giza's optimizer service for capital allocation optimization:

```bash
pnpm run example:optimizer
```

## Available Examples

- **`agent.example.ts`** - Complete partner workflow example:
  1. Create a smart account for a user
  2. Get available DeFi protocols
  3. Activate the agent after user deposits
  4. Monitor performance metrics
  5. View transaction history
  6. Withdraw funds to origin wallet

- **`optimizer.example.ts`** - Optimizer service example:
  1. Basic optimization without constraints
  2. Optimization with constraints (min protocols, exclude protocol)
  3. Optimization for different chains
  4. Optimization with maximum allocation constraints
  5. Display optimization results, action plans, and calldata

## Example Code Snippets

### Create Smart Account

```typescript
const account = await giza.agent.createSmartAccount({
  origin_wallet: userWallet,
});
```

### Activate Agent

```typescript
await giza.agent.activate({
  wallet: account.smartAccountAddress,
  origin_wallet: userWallet,
  initial_token: USDC_ADDRESS,
  selected_protocols: ['aave', 'compound'],
  tx_hash: depositTxHash,
});
```

### Monitor Performance

```typescript
const performance = await giza.agent.getPerformance({
  wallet: account.smartAccountAddress,
});

const apr = await giza.agent.getAPR({
  wallet: account.smartAccountAddress,
});
```

### Withdraw

```typescript
await giza.agent.withdraw({
  wallet: account.smartAccountAddress,
  transfer: true,
});
```

### Optimize Capital Allocation

```typescript
const result = await giza.optimizer.optimize({
  chainId: Chain.BASE,
  total_capital: "1000000000", // 1000 USDC (6 decimals)
  token_address: USDC_ADDRESS,
  current_allocations: {
    aave: "500000000",
    compound: "500000000",
  },
  protocols: ["aave", "compound", "moonwell", "fluid"],
  constraints: [
    {
      kind: WalletConstraints.MIN_PROTOCOLS,
      params: { min_protocols: 2 },
    },
  ],
});

console.log(`APR Improvement: ${result.optimization_result.apr_improvement}%`);
console.log(`Actions: ${result.action_plan.length}`);
console.log(`Calldata: ${result.calldata.length} transactions`);
```
