# Giza Skills Plugin

A Claude plugin for managing DeFi yield on Giza. Provides guided workflows for onboarding, portfolio review, withdrawals, rewards, optimization, and education -- all through natural language.

## Installation

### For OpenClaw

```bash
npx clawhub@latest install giza
```

### For Claude

Add the marketplace (one-time):

```bash
/plugin marketplace add gizatechxyz/giza-hub
```

Install the plugin:

```bash
/plugin install giza-skills
```

### Local development

```bash
claude --plugin-dir ./plugins/giza-skills
```

## What's Included

This plugin bundles both the Giza MCP server and a single comprehensive skill. When installed, the MCP server at `https://mcp.gizatech.xyz/api/mcp` is automatically registered.

The `giza` skill covers:
- **Onboarding** -- guided account setup: login, create account, deposit, activate
- **Portfolio** -- check balance, yield, allocations, and pending rewards
- **Actions** -- withdraw, claim rewards, top up, change protocols, deactivate
- **Optimization** -- compare current vs optimal allocation and apply improvements
- **Education** -- learn about Giza, fees, risks, APR, stablecoins, and protocols

## Supported Networks

- **Base (8453)** -- default, includes Giza Rewards program
- **Arbitrum (42161)** -- USDC
- **Plasma (9745)** -- USDT0
- **HyperEVM (999)** -- USDT0

## Documentation

- [Giza Platform](https://www.gizatech.xyz)
- [Giza Documentation](https://docs.gizatech.xyz)
