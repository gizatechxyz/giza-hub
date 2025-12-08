module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  // Match numbered test files in order (01-, 02-, etc.) for sequential execution
  testMatch: ['**/__tests__/e2e/**/*.e2e.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Increased timeout for E2E tests (5 minutes for long operations)
  testTimeout: 300000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
      },
    }],
  },
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  setupFiles: ['<rootDir>/__tests__/e2e/dotenv-config.ts'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/e2e/setup.ts'],
  // Force sequential execution to maintain test state across suites
  // This is set in package.json via --runInBand flag
  maxWorkers: 1,
  // Sort test files alphabetically to ensure numbered files run in order
  testSequencer: '<rootDir>/__tests__/e2e/test-sequencer.js',
};

