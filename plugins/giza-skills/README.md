# Giza Skills Plugin

A Claude plugin for managing DeFi yield on Giza. Provides guided workflows for onboarding, portfolio review, withdrawals, rewards, optimization, and education -- all through natural language.

## Installation

**Local development:**

```bash
claude --plugin-dir ./plugins/giza-skills
```

**From the plugin marketplace** (when published):

```bash
claude plugin install giza-skills
```

## What's Included

This plugin bundles both the Giza MCP server and the skills. When installed, the MCP server at `https://mcp.gizatech.xyz/api/mcp` is automatically registered -- no manual configuration needed.

## Available Skills

| Skill | Invocable | Description |
|---|---|---|
| `giza` | Model only | Core personality, tone calibration, and tool routing |
| `giza-get-started` | `/giza-get-started` | Guided onboarding: login, create account, deposit, activate |
| `giza-portfolio` | `/giza-portfolio` | Check balance, yield, allocations, and pending rewards |
| `giza-actions` | `/giza-actions` | Withdraw, claim rewards, top up, change protocols, deactivate |
| `giza-learn` | `/giza-learn` | Learn about Giza, fees, risks, APR, stablecoins, and protocols |
| `giza-optimize` | `/giza-optimize` | Compare current vs optimal allocation and apply improvements |

## Supported Networks

- **Base (8453)** -- default, includes Giza Rewards program
- **Arbitrum (42161)** -- USDC
- **Plasma (9745)** -- USDT0
- **HyperEVM (999)** -- USDT0

## Documentation

- [Giza Platform](https://www.gizatech.xyz)
- [Giza Documentation](https://docs.gizatech.xyz)
