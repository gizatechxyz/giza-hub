import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(dir, '../../../.env');

try {
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const raw = trimmed.slice(eqIdx + 1).trim();
    const value = raw.replace(/^("|')(.*)\1$/, '$2');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
} catch {
  // .env file not found — rely on env vars already set
}

// Create initial e2e state file if missing (bun test skips jest globalSetup)
const stateFile = resolve(dir, '.e2e-state.json');
if (!existsSync(stateFile)) {
  const initial = {
    chain: 8453,
    eoa: process.env.E2E_TEST_EOA,
    token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  };
  writeFileSync(stateFile, JSON.stringify(initial, null, 2));
}
