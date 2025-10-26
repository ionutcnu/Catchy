/**
 * ESLint Configuration
 *
 * ESLint checks your code for:
 * - Syntax errors
 * - Potential bugs
 * - Code style issues
 * - Best practices violations
 */
module.exports = {
  // Environment - tells ESLint what global variables exist
  env: {
    browser: true,      // window, document, console, etc.
    es2021: true,       // Modern JavaScript features
    node: true,         // process, __dirname, etc.
    webextensions: true // chrome, browser globals
  },

  // Extend recommended configurations
  extends: [
    'eslint:recommended',                      // ESLint's recommended rules
    'plugin:@typescript-eslint/recommended',   // TypeScript rules
    'prettier'                                 // Disable rules that conflict with Prettier
  ],

  // Use TypeScript parser
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',  // Latest JavaScript syntax
    sourceType: 'module'    // Use ES modules (import/export)
  },

  // Plugins add extra rules
  plugins: [
    '@typescript-eslint',
    'prettier'
  ],

  // Custom rules
  rules: {
    // Prettier as an ESLint rule
    'prettier/prettier': 'warn',

    // Allow console.log (useful for debugging extensions)
    'no-console': 'off',

    // Warn on unused variables (instead of error)
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',  // Allow unused vars starting with _
      varsIgnorePattern: '^_'
    }],

    // Allow any type when necessary
    '@typescript-eslint/no-explicit-any': 'warn',

    // Allow empty functions
    '@typescript-eslint/no-empty-function': 'warn'
  },

  // Ignore patterns
  ignorePatterns: [
    'dist',
    'node_modules',
    '*.config.js',
    '*.config.ts'
  ]
};
