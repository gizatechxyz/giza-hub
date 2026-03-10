# @gizatech/mcp-server

MCP (Model Context Protocol) server that exposes the Giza Agent SDK as tools for AI assistants. It lets LLMs create, manage, and monitor DeFi yield agents through natural language.

## Architecture

- **Transport**: Streamable HTTP (`/mcp` endpoint) with per-session state
- **Auth**: OAuth 2.1 via Privy (social/wallet login) with JWT session tokens
- **Runtime**: Bun + Express
- **SDK**: Uses `@gizatech/agent-sdk` (workspace dependency) for all Giza API calls

## Prerequisites

- [Bun](https://bun.sh) >= 1.0
- A Giza partner API key
- Privy app credentials (for OAuth authentication)

## Setup

```bash
# Install dependencies from the repo root
bun install

# Configure environment
cd packages/mcp-server
cp .env.example .env
```

Edit `.env` with your credentials:

```
GIZA_API_KEY=your-api-key
GIZA_PARTNER_NAME=your-partner-name
GIZA_API_URL=https://...
PORT=3000

PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret
JWT_SECRET=your-jwt-secret-min-32-chars
MCP_DOMAIN=http://127.0.0.1:3000
```

| Variable | Description |
|---|---|
| `GIZA_API_KEY` | Partner API key for the Giza platform |
| `GIZA_PARTNER_NAME` | Partner identifier |
| `GIZA_API_URL` | Giza API base URL |
| `PORT` | Server port (default: `3000`) |
| `PRIVY_APP_ID` | Privy application ID for OAuth |
| `PRIVY_APP_SECRET` | Privy application secret |
| `JWT_SECRET` | Secret for signing session JWTs (min 32 characters) |
| `MCP_DOMAIN` | Public base URL of this server (used as OAuth issuer) |

## Running

```bash
# Development (hot reload)
bun run dev

# Production
bun run start
```

The server starts at `http://127.0.0.1:<PORT>/mcp`.

Verify with:

```bash
curl http://127.0.0.1:3000/health
# {"status":"ok"}
```

## Connecting a client

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "giza": {
      "url": "http://127.0.0.1:3000/mcp"
    }
  }
}
```

### Claude Code

Add to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "giza": {
      "url": "http://127.0.0.1:3000/mcp"
    }
  }
}
```

## Tools

### System

| Tool | Description |
|---|---|
| `giza_health` | Check API health |
| `giza_get_config` | Get API configuration |
| `giza_get_stats` | Get chain statistics |
| `giza_get_tvl` | Get total value locked |

### Discovery

| Tool | Description |
|---|---|
| `giza_list_chains` | List supported chains |
| `giza_list_tokens` | List available tokens on a chain |
| `giza_list_protocols` | List active protocols for a token |
| `giza_get_protocol_supply` | Get protocol supply data |

### Agent Management

| Tool | Description |
|---|---|
| `giza_create_agent` | Create a new smart account agent |
| `giza_get_agent` | Look up an existing agent by EOA |
| `giza_get_smart_account` | Get smart account details |

### Lifecycle

| Tool | Description |
|---|---|
| `giza_activate_agent` | Activate an agent with protocols |
| `giza_deactivate_agent` | Deactivate an agent (requires confirmation) |
| `giza_run_agent` | Trigger an agent execution |
| `giza_top_up` | Top up agent wallet |

### Monitoring

| Tool | Description |
|---|---|
| `giza_get_portfolio` | Get agent portfolio |
| `giza_get_performance` | Get performance chart data |
| `giza_get_apr` | Get APR for an agent |
| `giza_get_apr_by_tokens` | Get APR breakdown by token |
| `giza_get_deposits` | Get deposit history |

### Transactions & Logs

| Tool | Description |
|---|---|
| `giza_list_transactions` | List agent transactions |
| `giza_list_executions` | List agent executions |
| `giza_list_execution_logs` | Get logs for a specific execution |
| `giza_list_logs` | List all agent logs |

### Protocols & Constraints

| Tool | Description |
|---|---|
| `giza_get_agent_protocols` | Get agent's active protocols |
| `giza_update_protocols` | Update agent protocols |
| `giza_get_constraints` | Get agent constraints |
| `giza_update_constraints` | Update agent constraints |

### Financial

| Tool | Description |
|---|---|
| `giza_get_fees` | Get fee information |
| `giza_get_limit` | Get limits for an EOA |
| `giza_withdraw` | Withdraw funds (requires confirmation) |
| `giza_get_withdrawal_status` | Check withdrawal status |

### Rewards

| Tool | Description |
|---|---|
| `giza_list_rewards` | List available rewards |
| `giza_list_reward_history` | Get reward history |
| `giza_claim_rewards` | Claim rewards (requires confirmation) |

### Optimizer

| Tool | Description |
|---|---|
| `giza_optimize` | Optimize capital allocation across protocols |

### Auth & Confirmation

| Tool | Description |
|---|---|
| `giza_whoami` | Get current authenticated user info |
| `giza_confirm_operation` | Confirm a pending critical operation |

## Critical operation protection

Destructive operations (`withdraw`, `deactivate`, `claim_rewards`) use a two-step confirmation flow:

1. The tool returns a `confirmation_required` response with a single-use token
2. The client must call `giza_confirm_operation` with that token to execute
3. Tokens expire after 5 minutes and are bound to the originating wallet

This prevents accidental execution of irreversible actions.

## Testing

```bash
bun test              # all tests
bun run test:unit     # unit tests only
bun run test:integration  # integration / handshake tests
```

## Project structure

```
src/
  index.ts              # Express app, transport setup, entry point
  server.ts             # MCP server creation and tool registration
  constants.ts          # Configuration constants
  schemas.ts            # Shared Zod schemas
  auth/
    provider.ts         # OAuth 2.1 provider (Privy integration)
    middleware.ts       # Bearer token middleware
    privy.ts            # Privy token verification
    session.ts          # JWT session management
    clients-store.ts    # OAuth client registration store
    authorize-page.ts   # Login redirect builder
    types.ts            # Auth type definitions
  services/
    sdk-factory.ts      # Giza SDK instance factory
    confirmation.ts     # Critical operation confirmation flow
    error-handler.ts    # Unified error handling
  tools/
    system.ts           # Health, config, stats, TVL
    discovery.ts        # Chains, tokens, protocols
    agent-management.ts # Create/get agents
    lifecycle.ts        # Activate, deactivate, run, top-up
    monitoring.ts       # Portfolio, performance, APR, deposits
    transactions.ts     # Transactions, executions, logs
    rewards.ts          # Rewards listing and claiming
    protocols.ts        # Protocol and constraint management
    optimizer.ts        # Capital optimization
    financial.ts        # Fees, limits, withdrawals
    protected.ts        # Auth-required tools (whoami)
    critical.ts         # Confirmation execution
```
