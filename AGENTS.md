# AGENTS.md

## Project Overview

This is the **Giza Agent SDK** - a TypeScript SDK for integrating autonomous DeFi yield optimization agents. The SDK enables partners to create smart accounts, activate agents, and manage capital across multiple lending protocols with automated yield optimization.

## Setup Commands

**Install dependencies:**
```bash
pnpm install
```

**Build the SDK:**
```bash
pnpm build
```

**Run in development mode (watch):**
```bash
pnpm dev
```

**Run tests:**
```bash
pnpm test
pnpm test:watch    # Watch mode
pnpm test:cov      # With coverage
```

**Run examples:**
```bash
pnpm run example:agent      # Complete agent workflow
pnpm run example:optimizer  # Optimizer usage
```

## Project Structure

```
typescript/
├── src/
│   ├── client.ts              # Main GizaAgent client
│   ├── index.ts               # Public exports
│   ├── constants.ts           # Configuration constants
│   ├── auth/                  # Authentication
│   │   └── partner-auth.ts    # Partner API key auth
│   ├── http/                  # HTTP client & error handling
│   │   ├── client.ts          # Axios wrapper
│   │   └── errors.ts          # Custom error classes
│   ├── modules/               # Core modules
│   │   ├── agent.module.ts    # Agent operations (activate, deactivate, etc.)
│   │   └── optimizer.module.ts # Capital optimization service
│   └── types/                 # TypeScript definitions
│       ├── agent.ts           # Agent-related types
│       ├── optimizer.ts       # Optimizer types
│       ├── config.ts          # Configuration types
│       └── common.ts          # Shared types (Chain, Address, errors)
├── examples/                  # Usage examples
├── __tests__/                # Test suite
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   ├── fixtures/             # Test data
│   └── helpers/              # Test utilities
├── package.json
├── tsconfig.json
├── tsup.config.ts            # Build configuration
└── jest.config.js            # Test configuration
```

## Code Style

- **TypeScript**: Strict mode enabled, use explicit types
- **Formatting**: 2-space indentation, single quotes for strings
- **Naming**:
  - Classes: `PascalCase` (e.g., `GizaAgent`, `AgentModule`)
  - Functions/methods: `camelCase` (e.g., `createSmartAccount`, `getAPR`)
  - Constants: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_TIMEOUT`)
  - Types/Interfaces: `PascalCase` (e.g., `ActivateParams`, `Address`)
  - Enums: `PascalCase` for enum name, `UPPER_SNAKE_CASE` for values
- **Error Handling**: Use custom error classes (`ValidationError`, `GizaAPIError`)
- **Async/Await**: Prefer `async/await` over promises for async operations
- **Documentation**: JSDoc comments for all public APIs

## Key Development Patterns

### Module Structure

Each module (Agent, Optimizer) follows this pattern:
- Constructor receives `HttpClient` and `config`
- Private validation methods (e.g., `validateAddress`)
- Public async methods for API operations
- Clear separation of concerns

### Type Safety

- Use branded types for addresses: `type Address = \`0x${string}\``
- Enum-based constants for chain IDs, statuses, etc.
- Strict validation in constructors and methods
- Zod schemas for runtime validation where needed

### Error Handling

Three main error types:
- `ValidationError`: Input validation failures
- `GizaAPIError`: API errors with status codes and details
- `TimeoutError`: Request timeout failures

### Testing Strategy

- **Unit Tests**: Test individual methods with mocked HTTP client
- **Integration Tests**: Test real API calls (requires credentials)
- **Fixtures**: Reusable test data in `__tests__/fixtures/`
- **Mocking**: Use `axios-mock-adapter` for HTTP mocking

## Environment Variables

Required for development and testing:

```bash
# Partner credentials (required)
GIZA_API_KEY=your-partner-api-key
GIZA_API_URL=https://api.giza.tech
GIZA_PARTNER_NAME=your-partner-name
```

Create a `.env` file in the `typescript/` directory. See `.env.example` for reference.

## Testing Instructions

### Running Tests

```bash
# All tests
pnpm test

# Watch mode (useful during development)
pnpm test:watch

# With coverage report
pnpm test:cov

# Integration tests only (requires valid API credentials)
pnpm test:e2e
```

### Writing Tests

1. **Unit Tests**: Place in `__tests__/unit/` matching the source structure
2. **Integration Tests**: Place in `__tests__/integration/`
3. **Use Fixtures**: Import test data from `__tests__/fixtures/`
4. **Mock HTTP**: Use the mock helpers from `__tests__/helpers/mock-responses.ts`

Example test structure:
```typescript
import { GizaAgent, Chain } from '../src';
import { mockHttpClient } from './helpers/mock-responses';

describe('GizaAgent', () => {
  it('should create smart account', async () => {
    const giza = new GizaAgent({ chainId: Chain.BASE });
    // ... test implementation
  });
});
```

## Building and Publishing

### Local Build

```bash
# Clean previous build
pnpm clean

# Build
pnpm build

# Output in dist/ directory
```

### Before Publishing

1. **Update version** in `package.json`
2. **Run all tests**: `pnpm test`
3. **Build**: `pnpm build`
4. **Check exports**: Verify `dist/index.js`, `dist/index.mjs`, `dist/index.d.ts`
5. **Test locally**: `npm link` to test in another project

### Publishing

```bash
npm publish
```

The `prepublishOnly` script automatically runs the build.

## Common Development Tasks

### Adding a New Method to Agent Module

1. Add method signature to `src/modules/agent.module.ts`
2. Define parameter and response types in `src/types/agent.ts`
3. Export new types from `src/index.ts`
4. Add unit tests in `__tests__/unit/modules/agent.spec.ts`
5. Update JSDoc comments
6. Add usage example to documentation

### Adding a New Error Type

1. Define error class in `src/http/errors.ts` or `src/types/common.ts`
2. Export from `src/index.ts`
3. Update error handling in relevant methods
4. Add tests for error scenarios

### Adding Support for New Chain

1. Add chain ID to `Chain` enum in `src/types/common.ts`
2. Add chain name to `CHAIN_NAMES` in `src/constants.ts`
3. Update validation logic if needed
4. Add tests for new chain
5. Update documentation

## Debugging Tips

- **API Errors**: Check `error.response?.data` for detailed error info
- **Validation Errors**: Review parameter types and required fields
- **Integration Tests**: Ensure `.env` is properly configured
- **Type Issues**: Run `tsc --noEmit` to check for type errors
- **Build Issues**: Clear `dist/` and rebuild: `pnpm clean && pnpm build`

## Git Workflow

1. **Branch naming**: `feature/description`, `fix/issue-number`, or `docs/topic`
2. **Commits**: Use conventional commits format
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `test:` for tests
   - `refactor:` for refactoring
3. **Before PR**: Run `pnpm test` and `pnpm build`
4. **PR Description**: Include what changed, why, and how to test

## Dependencies

### Production Dependencies
- `axios`: HTTP client for API requests
- `zod`: Runtime type validation

### Development Dependencies
- `typescript`: TypeScript compiler
- `tsup`: Build tool for bundling
- `jest`: Testing framework
- `ts-jest`: TypeScript support for Jest
- `axios-mock-adapter`: HTTP mocking for tests

## CI/CD Notes

The project uses Jest for testing. All tests must pass before merging PRs.

Ensure your changes:
- Pass `pnpm test`
- Build successfully with `pnpm build`
- Don't introduce type errors (`tsc --noEmit`)
- Follow the existing code style

## Getting Help

- **Documentation**: See `docs/` directory or README.md
- **Examples**: Check `examples/` directory
- **Issues**: Report bugs or request features on GitHub
- **Code Review**: Tag maintainers for review on PRs

## Notes for AI Agents

- The SDK follows a modular architecture with clear separation between HTTP, business logic, and types
- All public APIs are exported from `src/index.ts` - check there for the public interface
- Type definitions in `src/types/` are the source of truth for data structures
- The `HttpClient` class in `src/http/client.ts` handles all HTTP communication
- Validation happens at the module level before making API calls
- The SDK supports both ESM and CJS through dual exports in `package.json`
