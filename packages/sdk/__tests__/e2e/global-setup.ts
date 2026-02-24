import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

export default function globalSetup(): void {
  // Load env vars
  dotenv.config({
    path: path.resolve(__dirname, '..', '..', '..', '.env'),
  });

  // Validate required env vars
  const required = [
    'GIZA_API_KEY',
    'GIZA_PARTNER_NAME',
    'GIZA_API_URL',
    'E2E_TEST_EOA',
  ] as const;

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(
        `E2E setup: missing required env var ${key}. ` +
          'Ensure packages/.env is populated.',
      );
    }
  }

  // Create initial state file (clean slate each run)
  const stateFile = path.resolve(
    __dirname,
    '.e2e-state.json',
  );
  const initial = {
    chain: 8453,
    eoa: process.env.E2E_TEST_EOA,
    token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  };
  fs.writeFileSync(
    stateFile,
    JSON.stringify(initial, null, 2),
  );
}
