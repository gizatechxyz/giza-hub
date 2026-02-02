import type {
  OptimizeResponse,
  OptimizationResult,
  ProtocolAllocation,
  ActionDetail,
  CalldataInfo,
} from '../../src/types/optimizer';
import { WalletConstraints } from '../../src/types/optimizer';

/**
 * Mock protocol allocations for testing
 */
export const MOCK_PROTOCOL_ALLOCATIONS: ProtocolAllocation[] = [
  {
    protocol: 'aave',
    allocation: '700000000',
    apr: 5.5,
  },
  {
    protocol: 'compound',
    allocation: '300000000',
    apr: 4.8,
  },
];

/**
 * Mock optimization result
 */
export const MOCK_OPTIMIZATION_RESULT: OptimizationResult = {
  allocations: MOCK_PROTOCOL_ALLOCATIONS,
  total_costs: 0.05,
  weighted_apr_initial: 5.0,
  weighted_apr_final: 5.29,
  apr_improvement: 5.8,
};

/**
 * Mock action plan
 */
export const MOCK_ACTION_PLAN: ActionDetail[] = [
  {
    action_type: 'withdraw',
    protocol: 'compound',
    amount: '200000000',
    underlying_amount: '200000000',
  },
  {
    action_type: 'deposit',
    protocol: 'aave',
    amount: '200000000',
  },
];

/**
 * Mock calldata
 */
export const MOCK_CALLDATA: CalldataInfo[] = [
  {
    contract_address: '0xA88594D404727625A9437C3f886C7643872296AE',
    function_name: 'withdraw',
    parameters: ['200000000'],
    value: '0',
    protocol: 'compound',
    description: 'Withdraw 200000000 from Compound',
  },
  {
    contract_address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    function_name: 'approve',
    parameters: [
      '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf',
      '200000000',
    ],
    value: '0',
    protocol: 'aave',
    description: 'Approve USDC for Aave',
  },
  {
    contract_address: '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf',
    function_name: 'supply',
    parameters: [
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      '200000000',
      '0x0000000000000000000000000000000000000000',
      '0',
    ],
    value: '0',
    protocol: 'aave',
    description: 'Deposit 200000000 to Aave',
  },
];

/**
 * Complete mock optimize response
 */
export const MOCK_OPTIMIZE_RESPONSE: OptimizeResponse = {
  optimization_result: MOCK_OPTIMIZATION_RESULT,
  action_plan: MOCK_ACTION_PLAN,
  calldata: MOCK_CALLDATA,
};

/**
 * Sample optimization request parameters
 */
export const SAMPLE_OPTIMIZE_PARAMS = {
  chainId: 8453, // Base
  total_capital: '1000000000',
  token_address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const,
  current_allocations: {
    aave: '500000000',
    compound: '500000000',
  },
  protocols: ['aave', 'compound', 'moonwell', 'fluid'],
  constraints: [
    {
      kind: WalletConstraints.MIN_PROTOCOLS,
      params: { min_protocols: 2 },
    },
  ],
};

/**
 * Sample optimization request parameters with wallet_address
 */
export const SAMPLE_OPTIMIZE_PARAMS_WITH_WALLET = {
  ...SAMPLE_OPTIMIZE_PARAMS,
  wallet_address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as const,
};

