import { Chain } from '@gizatech/agent-sdk';
import * as z from 'zod/v4';

export const chainSchema = z
  .nativeEnum(Chain)
  .describe(
    'Blockchain chain ID. Common values: 1 (Ethereum), 137 (Polygon), 8453 (Base), 42161 (Arbitrum), 11155111 (Sepolia)',
  );

export const addressSchema = z
  .string()
  .regex(
    /^0x[a-fA-F0-9]{40}$/,
    'Must be a valid Ethereum address (0x + 40 hex chars)',
  );
