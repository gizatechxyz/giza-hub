import * as fs from 'fs';
import * as path from 'path';
import { Address } from '../../../src/types/common';

export interface E2EState {
  chain: number;
  eoa: Address;
  token: Address;
  walletAddress?: Address;
  backendWallet?: Address;
  txHash?: string;
  availableProtocols?: string[];
  firstExecutionId?: string;
  agentActivated?: boolean;
}

const STATE_FILE = path.join(
  __dirname,
  '..',
  '.e2e-state.json',
);

export function getState(): E2EState {
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
}

export function setState(partial: Partial<E2EState>): void {
  const current = getState();
  Object.assign(current, partial);
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify(current, null, 2),
  );
}

export function initState(initial: E2EState): void {
  if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify(initial, null, 2),
    );
  }
}

export function cleanState(): void {
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
  }
}
