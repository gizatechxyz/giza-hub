---
name: giza-optimize
description: Capital allocation optimizer — find best yield across DeFi protocols
user-invocable: true
---

Your job: help the developer use the Giza capital allocation optimizer to find optimal yield allocation across DeFi protocols. Always produce working TypeScript (ESM). Assume the developer already has a `Giza` instance configured (see `/giza`).

## Quick Example

```typescript
import { Giza, Chain } from '@gizatech/agent-sdk';

const giza = new Giza({ chain: Chain.BASE });
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

const result = await giza.optimize({
  token: USDC,
  capital: '1000000000',                         // 1000 USDC (6 decimals)
  protocols: ['aave-v3', 'morpho-blue', 'compound-v3'],
  currentAllocations: {
    'aave-v3': '500000000',
    'morpho-blue': '500000000',
  },
});

console.log('APR improvement:', result.optimization_result.apr_improvement);
console.log('Allocations:', result.optimization_result.allocations);
```

## OptimizeOptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | `Address` | Yes | Token address to optimize |
| `capital` | `string` | Yes | Total capital in smallest unit (must be positive integer string) |
| `protocols` | `string[]` | Yes | Protocol names to consider (min 1) |
| `currentAllocations` | `Record<string, string>` | Yes | Current allocation per protocol (in smallest unit) |
| `constraints` | `ConstraintConfig[]` | No | Allocation constraints |
| `wallet` | `Address` | No | Wallet address (for wallet-specific optimization) |
| `chain` | `Chain` | No | Defaults to client chain |

## OptimizeResponse

```typescript
interface OptimizeResponse {
  optimization_result: OptimizationResult;
  action_plan: ActionDetail[];
  calldata: CalldataInfo[];
}
```

### OptimizationResult

| Field | Type | Description |
|-------|------|-------------|
| `allocations` | `ProtocolAllocation[]` | Recommended allocation per protocol |
| `total_costs` | `number` | Total rebalancing cost |
| `weighted_apr_initial` | `number` | APR before optimization |
| `weighted_apr_final` | `number` | APR after optimization |
| `apr_improvement` | `number` | Delta between final and initial APR |
| `gas_estimate_usd` | `number?` | Estimated gas cost in USD |
| `break_even_days` | `number?` | Days until gas cost is offset by APR gain |

### ProtocolAllocation

| Field | Type |
|-------|------|
| `protocol` | `string` |
| `allocation` | `string` |
| `apr` | `number` |

### ActionDetail

| Field | Type |
|-------|------|
| `action_type` | `'deposit' \| 'withdraw'` |
| `protocol` | `string` |
| `amount` | `string` |
| `underlying_amount` | `string?` |

### CalldataInfo

| Field | Type |
|-------|------|
| `contract_address` | `string` |
| `function_name` | `string` |
| `parameters` | `string[]` |
| `value` | `string` |
| `protocol` | `string` |
| `description` | `string` |

## WalletConstraints Enum

6 constraint types to control how the optimizer allocates capital:

| Constraint | Params | Description |
|------------|--------|-------------|
| `min_protocols` | `{ value: number }` | Minimum number of protocols to allocate across |
| `max_allocation_amount_per_protocol` | `{ value: string }` | Max amount (smallest unit) in any single protocol |
| `max_amount_per_protocol` | `{ value: string }` | Max total amount per protocol |
| `min_amount` | `{ value: string }` | Minimum allocation amount |
| `exclude_protocol` | `{ protocol: string }` | Exclude a specific protocol |
| `min_allocation_amount_per_protocol` | `{ value: string }` | Min amount per protocol if allocated |

### Constraint Examples

```typescript
import { WalletConstraints } from '@gizatech/agent-sdk';

const constraints = [
  // Spread across at least 3 protocols
  { kind: WalletConstraints.MIN_PROTOCOLS, params: { value: 3 } },

  // No more than 500 USDC in any single protocol
  {
    kind: WalletConstraints.MAX_ALLOCATION_AMOUNT_PER_PROTOCOL,
    params: { value: '500000000' },
  },

  // Skip risky-protocol entirely
  {
    kind: WalletConstraints.EXCLUDE_PROTOCOL,
    params: { protocol: 'risky-protocol' },
  },

  // At least 100 USDC per protocol if allocated
  {
    kind: WalletConstraints.MIN_ALLOCATION_AMOUNT_PER_PROTOCOL,
    params: { value: '100000000' },
  },
];

const result = await giza.optimize({
  token: USDC,
  capital: '2000000000',
  protocols: ['aave-v3', 'morpho-blue', 'compound-v3', 'fluid'],
  currentAllocations: {},
  constraints,
});
```

## Interpreting Results

```typescript
const { optimization_result, action_plan, calldata } = result;

// 1. Check if rebalancing is worth it
const { apr_improvement, gas_estimate_usd, break_even_days } = optimization_result;
console.log(`APR improvement: +${(apr_improvement * 100).toFixed(2)}%`);
console.log(`Gas cost: $${gas_estimate_usd}`);
console.log(`Break-even: ${break_even_days} days`);

// 2. Review recommended allocations
for (const alloc of optimization_result.allocations) {
  console.log(`${alloc.protocol}: ${alloc.allocation} (${(alloc.apr * 100).toFixed(2)}% APR)`);
}

// 3. Review action plan (what needs to move)
for (const action of action_plan) {
  console.log(`${action.action_type} ${action.amount} → ${action.protocol}`);
}

// 4. Calldata for on-chain execution
for (const call of calldata) {
  console.log(`${call.description}: ${call.contract_address}.${call.function_name}`);
}
```

## Decision Framework

Execute the rebalance when:
- `apr_improvement` is meaningful (e.g., > 0.5%)
- `break_even_days` is acceptable for your time horizon (e.g., < 30 days)
- `gas_estimate_usd` is reasonable relative to capital

Skip the rebalance when:
- `apr_improvement` is negligible
- `break_even_days` exceeds your investment horizon
- Gas costs eat most of the APR improvement

## IaaS vs Agentic Modes

**IaaS (Infrastructure as a Service):** Use `giza.optimize()` to get recommendations, then execute on-chain transactions yourself using the `calldata` array.

```typescript
// Get optimization recommendation
const result = await giza.optimize({ ... });

// Execute calldata yourself via your wallet/signer
for (const call of result.calldata) {
  // Submit transaction to call.contract_address
}
```

**Agentic mode:** Use the agent lifecycle to let Giza handle execution automatically.

```typescript
// Agent handles the full cycle
const agent = await giza.createAgent(eoa);
await agent.activate({ owner: eoa, token, protocols, txHash });
await agent.run(); // Agent runs optimization + executes
```

## Full Optimization Example

```typescript
import { Giza, Chain, WalletConstraints } from '@gizatech/agent-sdk';

const giza = new Giza({ chain: Chain.BASE });
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// 1. Discover available protocols
const { protocols } = await giza.protocols(USDC);

// 2. Run optimizer with constraints
const result = await giza.optimize({
  token: USDC,
  capital: '5000000000', // 5000 USDC
  protocols,
  currentAllocations: {
    'aave-v3': '3000000000',
    'morpho-blue': '2000000000',
  },
  constraints: [
    { kind: WalletConstraints.MIN_PROTOCOLS, params: { value: 2 } },
    {
      kind: WalletConstraints.MAX_ALLOCATION_AMOUNT_PER_PROTOCOL,
      params: { value: '3000000000' },
    },
  ],
});

// 3. Evaluate
const { optimization_result } = result;
console.log(`Current APR: ${(optimization_result.weighted_apr_initial * 100).toFixed(2)}%`);
console.log(`Optimized APR: ${(optimization_result.weighted_apr_final * 100).toFixed(2)}%`);
console.log(`Improvement: +${(optimization_result.apr_improvement * 100).toFixed(2)}%`);

if (optimization_result.break_even_days && optimization_result.break_even_days < 14) {
  console.log('Rebalance recommended — breaks even in', optimization_result.break_even_days, 'days');
}
```

## Related Skills

- `/giza` — SDK quickstart, configuration, complete API reference
- `/giza-manage` — Agent lifecycle, activation, deactivation, fund management
- `/giza-monitor` — Portfolio monitoring, APR, performance, transaction history
- `/giza-mcp` — MCP server for LLM integration
