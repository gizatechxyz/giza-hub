import { Chain, SortOrder } from '@gizatech/agent-sdk';
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

export const constraintSchema = z.object({
  kind: z.string().describe('Constraint type'),
  params: z
    .record(z.string(), z.unknown())
    .describe('Constraint parameters'),
});

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
