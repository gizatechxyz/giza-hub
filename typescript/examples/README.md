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

## Running Examples

### Complete Partner Workflow

Demonstrates the complete partner integration workflow:

```bash
pnpm run example
```

**Note:** Update the `userOriginWallet` variable in `create-account.ts` with your actual user's wallet address before running.

## Available Examples

- **`create-account.ts`** - Complete partner workflow example:
  1. Create a smart account for a user
  2. Get available DeFi protocols
  3. Activate the agent after user deposits
  4. Monitor performance metrics
  5. View transaction history
  6. Withdraw funds to origin wallet

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
