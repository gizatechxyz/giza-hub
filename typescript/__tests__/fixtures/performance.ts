import {
  PerformanceChartResponse,
  PerformanceData,
  AgentInfo,
  TransactionHistoryResponse,
  Transaction,
  WalletAprResponse,
  AgentStatus,
  TxAction,
  TxStatus,
} from '../../src/types/performance';
import { VALID_ADDRESSES } from './addresses';

// Performance chart mock data
export const MOCK_PERFORMANCE_DATA_1: PerformanceData = {
  date: '2024-01-01T00:00:00Z',
  value: 1000.5,
  value_in_usd: 1000.5,
  token_distribution: {
    USDC: 1000.5,
  },
  accrued_rewards: {
    USDC: {
      locked: 0,
      unlocked: 0,
      locked_value: 0,
      locked_value_usd: 0,
      unlocked_value: 0,
      unlocked_value_usd: 0,
    },
  },
  portfolio: {
    'aave-v3': {
      value: 500.25,
      value_in_usd: 500.25,
    },
    'compound-v3': {
      value: 500.25,
      value_in_usd: 500.25,
    },
  },
};

export const MOCK_PERFORMANCE_DATA_2: PerformanceData = {
  date: '2024-01-02T00:00:00Z',
  value: 1050.75,
  value_in_usd: 1050.75,
  token_distribution: {
    USDC: 1045.75,
    COMP: 5.0,
  },
  accrued_rewards: {
    COMP: {
      locked: 2.5,
      unlocked: 2.5,
      locked_value: 2.5,
      locked_value_usd: 2.5,
      unlocked_value: 2.5,
      unlocked_value_usd: 2.5,
    },
  },
  portfolio: {
    'aave-v3': {
      value: 520.375,
      value_in_usd: 520.375,
    },
    'compound-v3': {
      value: 525.375,
      value_in_usd: 525.375,
    },
  },
};

export const MOCK_PERFORMANCE_CHART_RESPONSE: PerformanceChartResponse = {
  performance: [MOCK_PERFORMANCE_DATA_1, MOCK_PERFORMANCE_DATA_2],
};

export const MOCK_PERFORMANCE_CHART_EMPTY: PerformanceChartResponse = {
  performance: [],
};

// Agent info / portfolio mock data
export const MOCK_AGENT_INFO: AgentInfo = {
  wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
  deposits: [
    {
      amount: 1000000000,
      token_type: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      date: '2024-01-01T00:00:00Z',
      tx_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    },
  ],
  withdraws: [],
  status: AgentStatus.ACTIVE,
  activation_date: '2024-01-01T00:00:00Z',
  selected_protocols: ['aave-v3', 'compound-v3', 'morpho'],
  current_protocols: ['aave-v3', 'compound-v3'],
  current_token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  origin_wallet: VALID_ADDRESSES.EOA_1,
};

export const MOCK_AGENT_INFO_WITH_WITHDRAWS: AgentInfo = {
  ...MOCK_AGENT_INFO,
  withdraws: [
    {
      date: '2024-02-01T00:00:00Z',
      total_value: 500.0,
      total_value_in_usd: 500.0,
      withdraw_details: [
        {
          token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: 500000000,
          value: 500.0,
          value_in_usd: 500.0,
        },
      ],
    },
  ],
};

export const MOCK_AGENT_INFO_DEACTIVATED: AgentInfo = {
  ...MOCK_AGENT_INFO,
  status: AgentStatus.DEACTIVATED,
  last_deactivation_date: '2024-03-01T00:00:00Z',
};

// Transaction history mock data
export const MOCK_TRANSACTION_1: Transaction = {
  action: TxAction.DEPOSIT,
  date: '2024-01-01T00:00:00Z',
  amount: 1000.0,
  token_type: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  status: TxStatus.SUCCESS,
  transaction_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  correlation_id: 'corr-001',
  apr: 0.0,
};

export const MOCK_TRANSACTION_2: Transaction = {
  action: TxAction.SUPPLY,
  date: '2024-01-01T01:00:00Z',
  amount: 500.0,
  token_type: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  status: TxStatus.SUCCESS,
  transaction_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  protocol: 'aave-v3',
  correlation_id: 'corr-002',
  apr: 5.5,
};

export const MOCK_TRANSACTION_3: Transaction = {
  action: TxAction.SWAP,
  date: '2024-01-02T00:00:00Z',
  amount: 100.0,
  token_type: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  status: TxStatus.SUCCESS,
  transaction_hash: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
  protocol: 'uniswap-v3',
  new_token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  correlation_id: 'corr-003',
  apr: 0.0,
};

export const MOCK_TRANSACTION_PENDING: Transaction = {
  action: TxAction.WITHDRAW,
  date: '2024-01-03T00:00:00Z',
  amount: 200.0,
  token_type: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  status: TxStatus.PENDING,
  transaction_hash: '0x9999999999999999999999999999999999999999999999999999999999999999',
  correlation_id: 'corr-004',
  apr: 0.0,
};

export const MOCK_TRANSACTION_HISTORY_PAGE_1: TransactionHistoryResponse = {
  transactions: [MOCK_TRANSACTION_1, MOCK_TRANSACTION_2, MOCK_TRANSACTION_3],
  pagination: {
    total_items: 25,
    total_pages: 2,
    current_page: 1,
    items_per_page: 20,
  },
};

export const MOCK_TRANSACTION_HISTORY_PAGE_2: TransactionHistoryResponse = {
  transactions: [MOCK_TRANSACTION_PENDING],
  pagination: {
    total_items: 25,
    total_pages: 2,
    current_page: 2,
    items_per_page: 20,
  },
};

export const MOCK_TRANSACTION_HISTORY_EMPTY: TransactionHistoryResponse = {
  transactions: [],
  pagination: {
    total_items: 0,
    total_pages: 0,
    current_page: 1,
    items_per_page: 20,
  },
};

// APR mock data
export const MOCK_APR_RESPONSE: WalletAprResponse = {
  apr: 12.5,
  sub_periods: [
    {
      start_date: '2024-01-01T00:00:00Z',
      end_date: '2024-01-15T00:00:00Z',
      return_: 0.5,
      initial_value: 1000.0,
    },
    {
      start_date: '2024-01-15T00:00:00Z',
      end_date: '2024-01-31T00:00:00Z',
      return_: 0.7,
      initial_value: 1005.0,
    },
  ],
};

export const MOCK_APR_RESPONSE_NO_DETAILS: WalletAprResponse = {
  apr: 15.3,
};

export const MOCK_APR_RESPONSE_ZERO: WalletAprResponse = {
  apr: 0.0,
  sub_periods: [],
};

