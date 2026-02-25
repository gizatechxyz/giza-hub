---
name: giza
description: Giza Agent SDK quickstart, configuration, and complete API reference
user-invocable: true
---

Your job: help the developer install, configure, and use the `@gizatech/agent-sdk` to build DeFi yield agents. Always produce working TypeScript (ESM). Use real token addresses from the tables below.

## Installation

```bash
pnpm add @gizatech/agent-sdk
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GIZA_API_KEY` | Yes | Partner API key |
| `GIZA_PARTNER_NAME` | No | Partner name (fallback for config) |
| `GIZA_API_URL` | No | Backend API URL override |

## GizaConfig

```typescript
import { Giza, Chain } from '@gizatech/agent-sdk';
import type { GizaConfig } from '@gizatech/agent-sdk';

const config: GizaConfig = {
  chain: Chain.BASE,           // Required — blockchain network
  apiKey: 'your-api-key',     // Optional — falls back to GIZA_API_KEY
  partner: 'your-partner',    // Optional — falls back to GIZA_PARTNER_NAME
  apiUrl: 'https://...',      // Optional — falls back to GIZA_API_URL
  timeout: 45_000,            // Optional — HTTP timeout in ms (default 45000)
  enableRetry: false,         // Optional — retry on 5xx/network errors (default false)
};

const giza = new Giza(config);
```

## Chain Enum

| Name | Value | Notes |
|------|-------|-------|
| `Chain.ETHEREUM` | `1` | Mainnet |
| `Chain.POLYGON` | `137` | |
| `Chain.ARBITRUM` | `42161` | |
| `Chain.BASE` | `8453` | Primary chain |
| `Chain.SEPOLIA` | `11155111` | Testnet |
| `Chain.BASE_SEPOLIA` | `84532` | Testnet |
| `Chain.DEVNET` | `-1` | Local dev |

## Common Token Addresses (Base)

| Token | Address |
|-------|---------|
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |

## Quickstart — Full Agent Workflow

```typescript
import { Giza, Chain } from '@gizatech/agent-sdk';

const giza = new Giza({ chain: Chain.BASE });

// 1. Create a smart account for an EOA
const agent = await giza.createAgent('0xYourEOA...');
console.log('Smart account:', agent.wallet);

// 2. Activate with token + protocols + deposit tx hash
await agent.activate({
  owner: '0xYourEOA...',
  token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  protocols: ['aave-v3', 'morpho-blue'],
  txHash: '0xDepositTxHash...',
});

// 3. Monitor portfolio
const info = await agent.portfolio();
console.log('Status:', info.status);

// 4. Check performance
const apr = await agent.apr();
console.log('APR:', apr.apr);
```

## Giza Class — Method Reference

| Method | Params | Returns | Description |
|--------|--------|---------|-------------|
| `agent(wallet)` | `wallet: Address` | `Agent` | Create Agent handle (no API call) |
| `createAgent(eoa)` | `eoa: Address` | `Promise<Agent>` | Create smart account + return Agent |
| `getAgent(eoa)` | `eoa: Address` | `Promise<Agent>` | Look up existing Agent by EOA |
| `getSmartAccount(eoa)` | `eoa: Address` | `Promise<SmartAccountInfo>` | Full smart account info |
| `protocols(token)` | `token: Address` | `Promise<ProtocolsResponse>` | Active protocols for token |
| `protocolSupply(token)` | `token: Address` | `Promise<ProtocolsSupplyResponse>` | Protocol supply data |
| `tokens()` | — | `Promise<TokensResponse>` | All tokens on chain |
| `stats()` | — | `Promise<Statistics>` | Chain-level statistics |
| `tvl()` | — | `Promise<TVLResponse>` | Total value locked |
| `optimize(options)` | `OptimizeOptions` | `Promise<OptimizeResponse>` | Capital allocation optimizer |
| `health()` | — | `Promise<HealthcheckResponse>` | API health check |
| `getApiConfig()` | — | `Promise<GlobalConfigResponse>` | API configuration |
| `chains()` | — | `Promise<ChainsResponse>` | Supported chain IDs |
| `getChain()` | — | `Chain` | Configured chain |
| `getApiUrl()` | — | `string` | API URL |

## Agent Class — Method Reference

See `/giza-manage` for lifecycle methods and `/giza-monitor` for read/monitoring methods.

| Category | Methods |
|----------|---------|
| Lifecycle | `activate()`, `deactivate()`, `topUp()`, `run()`, `withdraw()`, `waitForDeactivation()`, `status()` |
| Portfolio | `portfolio()`, `apr()`, `aprByTokens()`, `performance()`, `deposits()` |
| History | `transactions()`, `executions()`, `executionLogs()`, `logs()`, `rewards()`, `rewardHistory()` |
| Fees & Limits | `fees()`, `limit()` |
| Rewards | `claimRewards()` |
| Protocols | `protocols()`, `updateProtocols()` |
| Constraints | `constraints()`, `updateConstraints()` |

## Error Types

| Error | Properties | When |
|-------|-----------|------|
| `GizaError` | `message` | Base error class |
| `ValidationError` | `message` | Invalid params (bad address, empty protocols) |
| `GizaAPIError` | `statusCode`, `responseData`, `requestUrl`, `requestMethod`, `friendlyMessage` | API HTTP errors (400/401/403/404/5xx) |
| `TimeoutError` | `message` | Request exceeds `timeout` ms |
| `NetworkError` | `message` | Connection failures |
| `NotImplementedError` | `message` | Unimplemented features |

All errors extend `GizaError`. Catch hierarchy:

```typescript
import { GizaAPIError, ValidationError, TimeoutError } from '@gizatech/agent-sdk';

try {
  await agent.activate(options);
} catch (err) {
  if (err instanceof ValidationError) {
    // Fix params and retry
  } else if (err instanceof GizaAPIError) {
    console.error(err.statusCode, err.friendlyMessage);
  } else if (err instanceof TimeoutError) {
    // Retry or increase timeout
  }
}
```

## Address Type

```typescript
type Address = `0x${string}`;  // 0x-prefixed hex string
```

## Related Skills

- `/giza-manage` — Agent lifecycle, activation, deactivation, fund management
- `/giza-monitor` — Portfolio monitoring, APR, performance, transaction history
- `/giza-optimize` — Capital allocation optimizer
- `/giza-mcp` — MCP server for LLM integration
