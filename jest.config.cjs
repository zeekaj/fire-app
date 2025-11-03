/**
 * Jest configuration for a Vite + TypeScript (ESM) project.
 * Uses ts-jest in ESM mode so we can import .ts/.tsx directly in tests.
 */

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    // Support TypeScript path alias @/* -> src/*
    '^@/(.*)$': '<rootDir>/src/$1',
    // Jest ESM TS path mapping quirk
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  testMatch: [
    '<rootDir>/**/__tests__/**/*.(spec|test).(ts|tsx|js)',
    '<rootDir>/**/?(*.)+(spec|test).(ts|tsx|js)'
  ],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/'],
};
