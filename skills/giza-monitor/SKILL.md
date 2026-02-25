---
name: giza-monitor
description: Portfolio monitoring, APR, performance charts, and transaction history
user-invocable: true
---

Your job: help the developer monitor Giza yield agents — portfolio state, APR, performance charts, deposits, transactions, and rewards. Always produce working TypeScript (ESM). Assume the developer already has a `Giza` instance configured (see `/giza`).

## Getting an Agent Handle

```typescript
import { Giza, Chain } from '@gizatech/agent-sdk';

const giza = new Giza({ chain: Chain.BASE });
const agent = await giza.getAgent('0xYourEOA...');
```

## Portfolio

```typescript
const info = await agent.portfolio();
// Returns AgentInfo
```

### AgentInfo

| Field | Type | Description |
|-------|------|-------------|
| `wallet` | `Address` | Smart account address |
| `deposits` | `Deposit[]` | Deposit history |
| `withdraws` | `Withdraw[]?` | Withdrawal history |
| `status` | `AgentStatus` | Current agent status |
| `activation_date` | `string` | ISO date |
| `last_deactivation_date` | `string?` | ISO date |
| `last_reactivation_date` | `string?` | ISO date |
| `selected_protocols` | `string[]` | User-selected protocols |
| `current_protocols` | `string[]?` | Currently active protocols |
| `current_token` | `string?` | Active token |
| `eoa` | `Address?` | Owner EOA |

### Deposit

| Field | Type |
|-------|------|
| `amount` | `number` |
| `token_type` | `string` |
| `date` | `string?` |
| `tx_hash` | `string?` |
| `block_number` | `number?` |

## APR

```typescript
// Overall APR
const apr = await agent.apr();
console.log('APR:', apr.apr); // number

// With date range
const apr = await agent.apr({
  startDate: '2025-01-01',
  endDate: '2025-02-01',
  useExactEndDate: true,        // optional
});

// APR broken down by token
const byToken = await agent.aprByTokens('day');  // Period: 'all' | 'day'
// Returns AllocatedValue[]
```

### WalletAprResponse

| Field | Type |
|-------|------|
| `apr` | `number` |
| `sub_periods` | `WalletAprSubPeriod[]?` |

### WalletAprSubPeriod

| Field | Type |
|-------|------|
| `start_date` | `string` |
| `end_date` | `string` |
| `return_` | `number` |
| `initial_value` | `number` |

### AllocatedValue (aprByTokens item)

| Field | Type |
|-------|------|
| `value` | `number` |
| `value_in_usd` | `number` |
| `base_apr` | `number?` |
| `total_apr` | `number?` |

## Performance

```typescript
const perf = await agent.performance();
// Or with start date filter
const perf = await agent.performance({ from: '2025-01-01' });
```

### PerformanceData (each entry in `perf.performance`)

| Field | Type |
|-------|------|
| `date` | `string` |
| `value` | `number` |
| `value_in_usd` | `number?` |
| `accrued_rewards` | `Record<string, AccruedRewardsWithValue>?` |
| `portfolio` | `Record<string, AllocatedValue>?` |
| `agent_token_amount` | `number?` |

### AccruedRewardsWithValue

| Field | Type |
|-------|------|
| `locked` | `number` |
| `unlocked` | `number` |
| `locked_value` | `number` |
| `locked_value_usd` | `number` |
| `unlocked_value` | `number` |
| `unlocked_value_usd` | `number` |
| `claimed` | `number?` |
| `claimed_value` | `number?` |
| `claimed_value_usd` | `number?` |

## Deposits

```typescript
const deposits = await agent.deposits();
// Returns { deposits: Deposit[] }
```

## Fees

```typescript
const fees = await agent.fees();
// Returns { percentage_fee: number, fee: number }
```

## Paginated Collections

Methods that return a `Paginator<T>` support three access patterns:

```typescript
// 1. Get first N items
const recent = await agent.transactions().first(5);

// 2. Fetch a specific page
const page2 = await agent.transactions({ limit: 10 }).page(2);
// Returns PaginatedResponse<T>: { items, total, page, limit, hasMore }

// 3. Async iteration (auto-pages)
for await (const tx of agent.transactions()) {
  console.log(tx.action, tx.amount);
}
```

### Paginator<T> Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `first(count?)` | `Promise<T[]>` | First N items (default: one page) |
| `page(num, opts?)` | `Promise<PaginatedResponse<T>>` | Specific page. `opts: { limit?: number }` |
| `[Symbol.asyncIterator]()` | `AsyncIterableIterator<T>` | Iterate all items across pages |

### PaginatedResponse<T>

| Field | Type |
|-------|------|
| `items` | `T[]` |
| `total` | `number` |
| `page` | `number` |
| `limit` | `number` |
| `hasMore` | `boolean` |

### PaginationOptions

| Field | Type | Default |
|-------|------|---------|
| `limit` | `number?` | `20` |
| `sort` | `string?` | — |

## Transactions

```typescript
const paginator = agent.transactions({ limit: 20, sort: 'date_desc' });
const first5 = await paginator.first(5);
```

### Transaction

| Field | Type |
|-------|------|
| `action` | `TxAction` |
| `date` | `string` |
| `amount` | `number` |
| `amount_out` | `number?` |
| `token_type` | `string` |
| `status` | `TxStatus` |
| `transaction_hash` | `string?` |
| `protocol` | `string?` |
| `new_token` | `string?` |
| `correlation_id` | `string?` |
| `apr` | `number?` |
| `block_number` | `number?` |

### TxAction Enum

`unknown` | `approve` | `deposit` | `transfer` | `bridge` | `withdraw` | `swap` | `refill_gas_tank` | `wrap` | `unwrap` | `fee_transfer`

### TxStatus Enum

`unknown` | `pending` | `approved` | `cancelled` | `failed`

## Executions

```typescript
const execs = agent.executions({ limit: 10 });
const page = await execs.page(1);
```

### ExecutionWithTransactionsDTO

| Field | Type |
|-------|------|
| `id` | `string` |
| `execution_plan` | `unknown` |
| `execution_type` | `string` |
| `status` | `ExecutionStatus` |
| `created_at` | `string` |
| `transactions` | `Transaction[]` |

### ExecutionStatus Enum

`running` | `failed` | `success`

## Logs

```typescript
// All agent logs
const logs = agent.logs({ limit: 50 });

// Logs for a specific execution
const execLogs = agent.executionLogs('execution-id', { limit: 50 });
```

### LogDTO

| Field | Type |
|-------|------|
| `type` | `string` |
| `data` | `unknown` |

## Rewards

```typescript
// Current rewards
const rewards = agent.rewards();
const first = await rewards.first(10);

// Reward history
const history = agent.rewardHistory();
for await (const reward of history) {
  console.log(reward.ticker, reward.reward_amount);
}
```

### RewardDTO

| Field | Type |
|-------|------|
| `user_id` | `string` |
| `base_apr` | `number` |
| `extra_apr` | `number` |
| `ticker` | `string` |
| `reward_amount` | `number` |
| `group` | `string` |
| `transaction_hash` | `string` |
| `start_date` | `string` |
| `end_date` | `string` |
| `id` | `string` |
| `created_at` | `string` |
| `updated_at` | `string` |

## Full Monitoring Dashboard Example

```typescript
import { Giza, Chain } from '@gizatech/agent-sdk';

const giza = new Giza({ chain: Chain.BASE });
const agent = await giza.getAgent('0xYourEOA...');

// Portfolio snapshot
const info = await agent.portfolio();
console.log('Status:', info.status);
console.log('Protocols:', info.selected_protocols);

// APR
const { apr } = await agent.apr();
console.log('Current APR:', `${(apr * 100).toFixed(2)}%`);

// Recent transactions
const recent = await agent.transactions({ limit: 5 }).first(5);
for (const tx of recent) {
  console.log(`${tx.date} ${tx.action} ${tx.amount} ${tx.token_type}`);
}

// Fees
const fees = await agent.fees();
console.log('Fee:', `${fees.percentage_fee}%`);
```

## Related Skills

- `/giza` — SDK quickstart, configuration, complete API reference
- `/giza-manage` — Agent lifecycle, activation, deactivation, fund management
- `/giza-optimize` — Capital allocation optimizer
- `/giza-mcp` — MCP server for LLM integration
