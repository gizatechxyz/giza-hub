import {
  WithdrawalRequestResponse,
  WithdrawalStatusResponse,
  WithdrawalFeeResponse,
} from '../../src/types/withdrawal';
import { AgentStatus, TransactionHistoryResponse, Transaction, TxAction, TxStatus } from '../../src/types/performance';
import { VALID_ADDRESSES } from './addresses';

// Withdrawal request response mock
export const MOCK_WITHDRAWAL_REQUEST_RESPONSE: WithdrawalRequestResponse = {
  message: 'Wallet deactivation initiated',
};

// Withdrawal status responses
export const MOCK_WITHDRAWAL_STATUS_ACTIVE: WithdrawalStatusResponse = {
  status: AgentStatus.ACTIVE,
  wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
  activation_date: '2024-01-01T00:00:00Z',
};

export const MOCK_WITHDRAWAL_STATUS_DEACTIVATING: WithdrawalStatusResponse = {
  status: AgentStatus.DEACTIVATING,
  wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
  activation_date: '2024-01-01T00:00:00Z',
};

export const MOCK_WITHDRAWAL_STATUS_DEACTIVATED: WithdrawalStatusResponse = {
  status: AgentStatus.DEACTIVATED,
  wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
  activation_date: '2024-01-01T00:00:00Z',
  last_deactivation_date: '2024-03-01T00:00:00Z',
};

export const MOCK_WITHDRAWAL_STATUS_FEE_NOT_PAID: WithdrawalStatusResponse = {
  status: AgentStatus.DEACTIVATED_FEE_NOT_PAID,
  wallet: VALID_ADDRESSES.SMART_ACCOUNT_1,
  activation_date: '2024-01-01T00:00:00Z',
  last_deactivation_date: '2024-03-01T00:00:00Z',
};

// Fee response mocks
export const MOCK_FEE_RESPONSE: WithdrawalFeeResponse = {
  percentage_fee: 0.1, // 10%
  fee: 100.5,
};

export const MOCK_FEE_RESPONSE_ZERO: WithdrawalFeeResponse = {
  percentage_fee: 0.0,
  fee: 0.0,
};

// Withdrawal transaction mocks
export const MOCK_WITHDRAW_TRANSACTION_1: Transaction = {
  action: TxAction.WITHDRAW,
  date: '2024-02-01T00:00:00Z',
  amount: 500.0,
  token_type: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  status: TxStatus.SUCCESS,
  transaction_hash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1',
  correlation_id: 'withdraw-001',
  apr: 0.0,
};

export const MOCK_WITHDRAW_TRANSACTION_2: Transaction = {
  action: TxAction.WITHDRAW,
  date: '2024-02-15T00:00:00Z',
  amount: 250.0,
  token_type: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  status: TxStatus.SUCCESS,
  transaction_hash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa2',
  correlation_id: 'withdraw-002',
  apr: 0.0,
};

export const MOCK_WITHDRAW_TRANSACTION_PENDING: Transaction = {
  action: TxAction.WITHDRAW,
  date: '2024-03-01T00:00:00Z',
  amount: 1000.0,
  token_type: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  status: TxStatus.PENDING,
  transaction_hash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa3',
  correlation_id: 'withdraw-003',
  apr: 0.0,
};

// Non-withdrawal transactions for filtering tests
export const MOCK_DEPOSIT_TRANSACTION: Transaction = {
  action: TxAction.DEPOSIT,
  date: '2024-01-01T00:00:00Z',
  amount: 1000.0,
  token_type: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  status: TxStatus.SUCCESS,
  transaction_hash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  correlation_id: 'deposit-001',
  apr: 0.0,
};

export const MOCK_SUPPLY_TRANSACTION: Transaction = {
  action: TxAction.SUPPLY,
  date: '2024-01-05T00:00:00Z',
  amount: 500.0,
  token_type: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  status: TxStatus.SUCCESS,
  transaction_hash: '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
  protocol: 'aave-v3',
  correlation_id: 'supply-001',
  apr: 5.5,
};

// Transaction history with mixed transactions
export const MOCK_TRANSACTION_HISTORY_WITH_WITHDRAWALS: TransactionHistoryResponse = {
  transactions: [
    MOCK_DEPOSIT_TRANSACTION,
    MOCK_SUPPLY_TRANSACTION,
    MOCK_WITHDRAW_TRANSACTION_1,
    MOCK_WITHDRAW_TRANSACTION_2,
  ],
  pagination: {
    total_items: 4,
    total_pages: 1,
    current_page: 1,
    items_per_page: 20,
  },
};

// Transaction history with only withdrawals
export const MOCK_TRANSACTION_HISTORY_ONLY_WITHDRAWALS: TransactionHistoryResponse = {
  transactions: [MOCK_WITHDRAW_TRANSACTION_1, MOCK_WITHDRAW_TRANSACTION_2],
  pagination: {
    total_items: 2,
    total_pages: 1,
    current_page: 1,
    items_per_page: 20,
  },
};

// Transaction history with no withdrawals
export const MOCK_TRANSACTION_HISTORY_NO_WITHDRAWALS: TransactionHistoryResponse = {
  transactions: [MOCK_DEPOSIT_TRANSACTION, MOCK_SUPPLY_TRANSACTION],
  pagination: {
    total_items: 2,
    total_pages: 1,
    current_page: 1,
    items_per_page: 20,
  },
};

// Empty transaction history
export const MOCK_TRANSACTION_HISTORY_EMPTY: TransactionHistoryResponse = {
  transactions: [],
  pagination: {
    total_items: 0,
    total_pages: 0,
    current_page: 1,
    items_per_page: 20,
  },
};

