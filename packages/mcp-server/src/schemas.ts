import { Chain, CHAIN_NAMES, SortOrder } from '@gizatech/agent-sdk';
import * as z from 'zod/v4';

export const chainSchema = z
  .nativeEnum(Chain)
  .describe(
    'Network to use: 8453 (Base), 42161 (Arbitrum), or another supported network ID',
  );

export const addressSchema = z
  .string()
  .regex(
    /^0x[a-fA-F0-9]{40}$/,
    'Must be a valid Ethereum address (0x + 40 hex chars)',
  );

export const constraintSchema = z.object({
  kind: z.string().describe('Constraint type'),
  params: z
    .record(z.string(), z.unknown())
    .describe('Constraint parameters'),
});

export function chainDisplayName(chainId: number): string {
  // Cast is safe: unknown chain IDs fall through to the ?? fallback
  return CHAIN_NAMES[chainId as Chain] ?? `Chain ${chainId}`;
}

export const paginationSchema = z.object({
  page: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Page number (1-based)'),
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe('Items per page (max 100)'),
  sort: z.nativeEnum(SortOrder).optional().describe('Sort order'),
});
