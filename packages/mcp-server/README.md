# Giza MCP Server

MCP server that exposes Giza's DeFi yield optimization agents as conversational tools. Builders self-host this server, connect their own LLM, and get a wallet-authenticated chat-based UX for end users.

```
End User (wallet) <-> Frontend <-> Builder's LLM <-> MCP Server <-> Giza Backend
```

## Prerequisites

- Node.js >= 22
- bun
- A Giza partner API key
- An RPC URL for the target chain (required for smart wallet authentication)

## Setup

```bash
# From the repo root
bun install

# Configure environment
cd packages/mcp-server
cp .env.example .env
# Edit .env with your credentials
```

### Required environment variables

| Variable | Description |
|----------|-------------|
| `GIZA_API_KEY` | Your Giza partner API key |
| `GIZA_API_URL` | Giza backend URL |
| `GIZA_PARTNER_NAME` | Your registered partner name |
| `GIZA_CHAIN_ID` | Target chain (`8453` for Base, `42161` for Arbitrum) |
| `RPC_URL` | Chain RPC endpoint (needed for smart wallet signature verification) |
| `SIWE_DOMAIN` | Domain shown in the SIWE signing message |
| `SIWE_URI` | URI shown in the SIWE signing message |

### Optional environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TRANSPORT` | `http` | `http` for Streamable HTTP, `stdio` for CLI/Claude Desktop |
| `PORT` | `3000` | HTTP server port |
| `RATE_LIMIT_PER_WALLET` | `30` | Max requests per wallet per window |
| `RATE_LIMIT_PER_APP` | `1000` | Max requests per app per window |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit sliding window (ms) |
| `SESSION_TTL_MS` | `3600000` | Authenticated session lifetime (ms) |

## Running

### HTTP transport (for web apps)

```bash
# Development
bun run dev

# Production
bun run build
bun run start
```

The server listens at `http://localhost:3000/mcp` and accepts MCP Streamable HTTP requests (POST, GET for SSE, DELETE for session cleanup).

### stdio transport (for Claude Desktop / local dev)

```bash
TRANSPORT=stdio bun run dev
```

#### Claude Desktop configuration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "giza": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "TRANSPORT": "stdio",
        "GIZA_API_KEY": "your-key",
        "GIZA_API_URL": "https://api.giza.tech",
        "GIZA_PARTNER_NAME": "your-partner",
        "GIZA_CHAIN_ID": "8453",
        "RPC_URL": "https://mainnet.base.org",
        "SIWE_DOMAIN": "localhost",
        "SIWE_URI": "https://localhost"
      }
    }
  }
}
```

## Authentication

The server uses Sign-In with Ethereum (SIWE / EIP-4361) for wallet authentication. This supports EOA wallets, smart wallets (Safe, ZeroDev) via ERC-1271, and MPC/social wallets.

### Flow

1. LLM calls `generate_siwe_challenge` with the user's wallet address
2. Server returns a SIWE message + nonce
3. Frontend presents the message to the user's wallet for signing
4. User signs, frontend sends the signature back to the chat
5. LLM calls `verify_siwe_signature` with the message + signature
6. Server verifies and creates an authenticated session

All subsequent tool calls use the session's wallet address automatically.

## Available tools

### Unauthenticated

| Tool | Description |
|------|-------------|
| `generate_siwe_challenge` | Generate a SIWE message for wallet signing |
| `verify_siwe_signature` | Verify a signed SIWE message and create a session |

### Authenticated

| Tool | Description |
|------|-------------|
| `create_smart_account` | Create a Giza smart account for the authenticated wallet |
| `get_smart_account` | Get the smart account for the authenticated wallet |
| `get_protocols` | List available DeFi protocols for a token |
| `activate_agent` | Activate an agent after depositing funds |
| `deactivate_agent` | Deactivate an agent |
| `top_up` | Add funds to an active agent |
| `run_agent` | Manually trigger an agent rebalance |
| `get_portfolio` | Get agent portfolio details |
| `get_performance` | Get historical performance data |
| `get_apr` | Get APR with optional date range |
| `withdraw` | Partial or full withdrawal |
| `get_withdrawal_status` | Check withdrawal/deactivation status |
| `get_transactions` | Get transaction history (paginated) |
| `get_deposits` | Get deposit history |
| `get_fees` | Get fee information |
| `claim_rewards` | Claim accrued DeFi rewards |

## Frontend integration

Your frontend needs to bridge between the chat UI and the user's wallet for signing:

1. When the LLM response from `generate_siwe_challenge` contains a SIWE message, detect it and show a "Sign Message" button
2. Call `wallet.signMessage(message)` using your wallet library (wagmi, ethers, viem, etc.)
3. Send the resulting signature back as a user message in the conversation

See [`SYSTEM_PROMPT.md`](./SYSTEM_PROMPT.md) for a reference system prompt to configure your LLM with.

## Development

```bash
bun run typecheck    # Type check
bun test             # Run tests
bun run test:watch   # Run tests in watch mode
bun run build        # Build for production
```
