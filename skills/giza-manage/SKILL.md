---
name: giza-manage
description: Agent lifecycle management — activation, deactivation, funding, protocols, constraints
user-invocable: true
---

Your job: help the developer manage Giza yield agent lifecycle — create, activate, deactivate, fund, withdraw, and configure agents. Always produce working TypeScript (ESM). Assume the developer already has a `Giza` instance configured (see `/giza`).

## Creating an Agent

```typescript
import { Giza, Chain } from '@gizatech/agent-sdk';

const giza = new Giza({ chain: Chain.BASE });

// Create new smart account
const agent = await giza.createAgent('0xYourEOA...');
console.log('Smart account:', agent.wallet);

// Or get existing agent
const agent = await giza.getAgent('0xYourEOA...');
```

## AgentStatus State Machine

```
UNKNOWN ─────────────────────────────────────────┐
                                                  │
              ┌─── ACTIVATION_FAILED              │
              │                                   │
ACTIVATING ───┤                                   │
              │                                   │
              └─── ACTIVATED ──── RUNNING ──┬── BLOCKED
                       │                    │
                       │              RUN_FAILED
                       │
                  DEACTIVATING ──┬── DEACTIVATION_FAILED
                       │         │
                  DEACTIVATED    └── DEACTIVATED_FEE_NOT_PAID
                       │
                  BRIDGING
                       │
                  EMERGENCY
```

### All 13 AgentStatus Values

| Status | Description |
|--------|-------------|
| `unknown` | Initial/unrecognized state |
| `activating` | Activation in progress |
| `activation_failed` | Activation failed |
| `activated` | Ready, idle |
| `running` | Optimization execution in progress |
| `run_failed` | Execution failed |
| `blocked` | Agent blocked (requires intervention) |
| `deactivating` | Deactivation in progress |
| `deactivation_failed` | Deactivation failed |
| `deactivated` | Fully deactivated, funds withdrawn |
| `emergency` | Emergency state |
| `deactivated_fee_not_paid` | Deactivated due to unpaid fees |
| `bridging` | Cross-chain bridge in progress |

## Activation

```typescript
await agent.activate({
  owner: '0xYourEOA...',                                       // Required — EOA owner
  token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',       // Required — token address (USDC on Base)
  protocols: ['aave-v3', 'morpho-blue'],                       // Required — at least one
  txHash: '0xDepositTxHash...',                                // Required — deposit transaction hash
  constraints: [                                                // Optional
    { kind: 'min_protocols', params: { value: 2 } },
  ],
});
// Returns { message: string, wallet: string }
```

### ActivateOptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `owner` | `Address` | Yes | EOA that owns the agent |
| `token` | `Address` | Yes | Token to deposit |
| `protocols` | `string[]` | Yes | Protocol names (min 1) |
| `txHash` | `string` | Yes | Deposit tx hash |
| `constraints` | `ConstraintConfig[]` | No | Allocation constraints |

### Discovering Protocols

```typescript
// List available protocols for a token
const { protocols } = await giza.protocols('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
console.log(protocols); // ['aave-v3', 'morpho-blue', 'compound-v3', ...]
```

## Deactivation

```typescript
// Deactivate and transfer funds back to owner (default)
await agent.deactivate();

// Deactivate without fund transfer
await agent.deactivate({ transfer: false });
// Returns { message: string }
```

### DeactivateOptions

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `transfer` | `boolean` | `true` | Transfer remaining funds to owner |

## Waiting for Deactivation

```typescript
const result = await agent.waitForDeactivation({
  interval: 5000,     // Poll every 5s (default)
  timeout: 300_000,   // Give up after 5min (default)
  onUpdate: (status) => console.log('Status:', status),
});
console.log('Final status:', result.status);
// Returns WithdrawalStatusResponse
```

### WaitForDeactivationOptions

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `interval` | `number` | `5000` | Polling interval in ms |
| `timeout` | `number` | `300000` | Max wait time in ms |
| `onUpdate` | `(status: AgentStatus) => void` | — | Status change callback |

### WithdrawalStatusResponse

| Field | Type |
|-------|------|
| `status` | `AgentStatus` |
| `wallet` | `Address` |
| `activation_date` | `string` |
| `last_deactivation_date` | `string?` |
| `last_reactivation_date` | `string?` |

## Top Up

```typescript
await agent.topUp('0xNewDepositTxHash...');
// Returns { message: string }
```

## Run Optimization

```typescript
const result = await agent.run();
console.log('Status:', result.status);
// Returns { status: string }
```

## Withdrawals

```typescript
// Partial withdrawal
const result = await agent.withdraw('1000000'); // amount in smallest unit
// Returns PartialWithdrawResponse: { date, amount, value, withdraw_details }

// Full withdrawal (triggers deactivation)
const result = await agent.withdraw();
// Returns FullWithdrawResponse: { message: string }
```

### WithdrawDetail

| Field | Type |
|-------|------|
| `token` | `string` |
| `amount` | `string` |
| `value` | `number` |
| `value_in_usd` | `number` |
| `principal_amount` | `number?` |
| `yield_amount` | `number?` |
| `fee_amount` | `number?` |
| `tx_hash` | `string?` |
| `block_number` | `number?` |

## Withdrawal Status

```typescript
const status = await agent.status();
console.log(status.status); // AgentStatus
```

## Protocol Management

```typescript
// Get current protocols
const protocols = await agent.protocols();
// Returns Protocol[]

// Update selected protocols
await agent.updateProtocols(['aave-v3', 'compound-v3']);
```

### Protocol

| Field | Type |
|-------|------|
| `name` | `string` |
| `is_active` | `boolean` |
| `description` | `string` |
| `tvl` | `number` |
| `apr` | `number?` |
| `pools` | `ProtocolPool[]?` |
| `chain_id` | `number` |
| `parent_protocol` | `string` |
| `link` | `string` |
| `address` | `string?` |
| `title` | `string?` |

## Constraint Management

```typescript
// Get current constraints
const constraints = await agent.constraints();

// Update constraints
await agent.updateConstraints([
  { kind: 'min_protocols', params: { value: 2 } },
  { kind: 'exclude_protocol', params: { protocol: 'risky-protocol' } },
]);
```

### ConstraintConfig

```typescript
interface ConstraintConfig {
  kind: string;     // WalletConstraints enum value
  params: Record<string, unknown>;
}
```

See `/giza-optimize` for the full `WalletConstraints` enum and param details.

## Claim Rewards

```typescript
const claimed = await agent.claimRewards();
for (const reward of claimed.rewards) {
  console.log(`${reward.token}: ${reward.amount_float}`);
}
```

### ClaimedReward

| Field | Type |
|-------|------|
| `token` | `string` |
| `amount` | `number` |
| `amount_float` | `number` |
| `current_price_in_underlying` | `number` |

## Limit

```typescript
const { limit } = await agent.limit('0xYourEOA...');
console.log('Wallet limit:', limit);
```

## Full Lifecycle Example

```typescript
import { Giza, Chain } from '@gizatech/agent-sdk';

const giza = new Giza({ chain: Chain.BASE });
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const EOA = '0xYourEOA...';

// 1. Create agent
const agent = await giza.createAgent(EOA);

// 2. Discover protocols
const { protocols } = await giza.protocols(USDC);

// 3. Activate
await agent.activate({
  owner: EOA,
  token: USDC,
  protocols: protocols.slice(0, 3),
  txHash: '0xDepositTx...',
});

// 4. Run optimization
await agent.run();

// 5. Check status
const info = await agent.portfolio();
console.log('Status:', info.status);

// 6. Deactivate when done
await agent.deactivate();
const result = await agent.waitForDeactivation({
  onUpdate: (s) => console.log('Deactivating...', s),
});
console.log('Done:', result.status);
```

## Related Skills

- `/giza` — SDK quickstart, configuration, complete API reference
- `/giza-monitor` — Portfolio monitoring, APR, performance, transaction history
- `/giza-optimize` — Capital allocation optimizer
- `/giza-mcp` — MCP server for LLM integration
