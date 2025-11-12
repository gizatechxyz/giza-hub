# Examples

This directory contains example scripts demonstrating how to use the Giza Agent SDK.

## Setup

1. **Configure environment variables** by creating a `.env` file in the root directory:

```bash
# Copy the template
cp env-template .env

# Edit .env with your credentials
# GIZA_API_KEY=...
# GIZA_API_URL=...
```

2. **Install dependencies** (if not already done):

```bash
pnpm install
```

## Running Examples

### Create Smart Account

Creates a ZeroDev smart account for a given Origin wallet address:

```bash
pnpm run example
```

**Note:** Make sure to update the `userOriginWallet` variable in `create-account.ts` with your actual origin wallet address before running.

## Available Examples

- **`create-account.ts`** - Basic example showing how to create a smart account
