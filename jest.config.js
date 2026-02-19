module.exports = {
  projects: [
    '<rootDir>/apps/backend',
    '<rootDir>/apps/web'
  ],
  collectCoverageFrom: [
    'apps/**/*.{ts,tsx}',
    'packages/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/dist/**'
  ]
};
