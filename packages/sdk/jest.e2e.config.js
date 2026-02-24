module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/e2e/**/*.e2e.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
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
  globalSetup: '<rootDir>/__tests__/e2e/global-setup.ts',
  globalTeardown: '<rootDir>/__tests__/e2e/global-teardown.ts',
  setupFiles: ['<rootDir>/__tests__/e2e/dotenv-config.ts'],
  testSequencer: '<rootDir>/__tests__/e2e/sequencer.js',
  maxWorkers: 1,
  verbose: true,
  silent: false,
};
