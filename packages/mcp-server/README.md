# @gizatech/mcp-server

MCP server that wraps the `@gizatech/agent-sdk` to let LLMs manage DeFi yield optimization through Giza. Partners deploy the server with their API credentials; end users interact via wallet address.

## Quick start

```bash
# From the repo root
bun install
bun run --filter @gizatech/mcp-server build
```

## Configuration

Set these environment variables before starting the server:

| Variable | Required | Description |
|----------|----------|-------------|
| `GIZA_API_KEY` | Yes | Partner API key from Giza |
| `GIZA_PARTNER_NAME` | Yes | Partner identifier |
| `GIZA_CHAIN_ID` | Yes | `8453` (Base) or `42161` (Arbitrum) |
| `GIZA_API_URL` | No | Defaults to Giza production URL |
| `TRANSPORT` | No | `stdio` (default) or `http` |
| `PORT` | No | HTTP port, defaults to `3000` |

One server instance serves one chain. Deploy separate instances for multiple chains.

Copy `.env.example` to `.env` and fill in the required values.

## Running

### Stdio (default)

Used for local integrations like Claude Desktop or Claude Code.

```bash
GIZA_API_KEY=... GIZA_PARTNER_NAME=... GIZA_CHAIN_ID=8453 \
  node packages/mcp-server/dist/index.js
```

### HTTP

Used for remote/multi-session deployments.

```bash
GIZA_API_KEY=... GIZA_PARTNER_NAME=... GIZA_CHAIN_ID=8453 \
  TRANSPORT=http PORT=3000 \
  node packages/mcp-server/dist/index.js
```

The server exposes a single endpoint at `/mcp` that handles:

- `POST /mcp` — JSON-RPC requests (new sessions and existing)
- `GET /mcp` — SSE stream for an existing session
- `DELETE /mcp` — Close a session

Sessions are tracked via the `mcp-session-id` header.

## Claude Desktop integration

Add this to your Claude Desktop MCP config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "giza": {
      "command": "node",
      "args": ["/absolute/path/to/packages/mcp-server/dist/index.js"],
      "env": {
        "GIZA_API_KEY": "your-key",
        "GIZA_PARTNER_NAME": "your-partner",
        "GIZA_CHAIN_ID": "8453"
      }
    }
  }
}
```

## Available tools

The server exposes 18 tools and 1 prompt:

### Wallet

| Tool | Description |
|------|-------------|
| `connect_wallet` | Connect a wallet address to the session |
| `disconnect_wallet` | Disconnect the current wallet |

### Account

| Tool | Description |
|------|-------------|
| `create_smart_account` | Create a new smart account for yield optimization |
| `get_smart_account` | Get smart account details for the connected wallet |

### Protocol

| Tool | Description |
|------|-------------|
| `get_protocols` | List available yield protocols for a given token |

### Lifecycle

| Tool | Description |
|------|-------------|
| `activate_agent` | Activate the yield agent after depositing funds |
| `deactivate_agent` | Stop the agent and optionally transfer remaining funds |
| `top_up` | Register additional deposits to an active agent |
| `run_agent` | Trigger a manual optimization rebalance |

### Portfolio

| Tool | Description |
|------|-------------|
| `get_portfolio` | View current portfolio, status, deposits, and withdrawals |
| `get_performance` | View historical performance data and allocation over time |
| `get_apr` | Get annualized return rate for a position |

### Financial

| Tool | Description |
|------|-------------|
| `withdraw` | Partial (specify amount) or full withdrawal |
| `get_withdrawal_status` | Check progress of a pending withdrawal |
| `get_transactions` | Paginated transaction history |
| `get_deposits` | List all deposits |

### Rewards

| Tool | Description |
|------|-------------|
| `get_fees` | View fee rate and current fee for an account |
| `claim_rewards` | Claim accumulated protocol rewards |

### Prompt

| Prompt | Description |
|--------|-------------|
| `giza-yield-assistant` | System prompt for a friendly, non-technical DeFi yield assistant |

## Typical user flow

```
connect_wallet
  -> create_smart_account (if new user)
  -> get_protocols (choose protocols for a token)
  -> activate_agent (after user deposits to the smart account)
  -> get_portfolio / get_performance / get_apr (monitor)
  -> top_up (optional, add more funds)
  -> withdraw (partial or full)
  -> get_withdrawal_status (track full withdrawal)
```

## Development

```bash
# Run in dev mode (no build step)
GIZA_API_KEY=... GIZA_PARTNER_NAME=... GIZA_CHAIN_ID=8453 \
  bun run --filter @gizatech/mcp-server dev

# Type-check
bun run --filter @gizatech/mcp-server typecheck

# Run tests
bun run --filter @gizatech/mcp-server test
```

## Architecture

```
src/
├── index.ts           # Entry point: stdio or HTTP transport
├── server.ts          # createServer(): wires SDK, tools, and prompt
├── config.ts          # Zod env var schema
├── context.ts         # Per-session wallet tracking
├── format.ts          # Human-readable formatting helpers
├── errors.ts          # SDK errors -> user-friendly MCP responses
├── tools/
│   ├── wallet.tools.ts
│   ├── account.tools.ts
│   ├── protocol.tools.ts
│   ├── lifecycle.tools.ts
│   ├── portfolio.tools.ts
│   ├── financial.tools.ts
│   └── rewards.tools.ts
└── prompts/
    └── system.ts      # giza-yield-assistant prompt
```

Each tool follows the same pattern: resolve session wallet, call SDK, format response as plain text, catch errors via `formatToolError()`. All responses are `{ content: [{ type: "text", text }] }` — no structured output, so the LLM can incorporate the text naturally into conversation.
