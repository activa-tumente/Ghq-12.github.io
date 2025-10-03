import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'build', 'coverage', 'node_modules']),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Variables
      'no-unused-vars': ['error', { 
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],
      'no-undef': 'error',
      'no-redeclare': 'error',
      'no-shadow': 'warn',
      
      // Best Practices
      'eqeqeq': ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-return-assign': 'error',
      'no-self-compare': 'error',
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
      'radix': 'error',
      
      // ES6+
      'prefer-const': 'error',
      'no-var': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'template-curly-spacing': ['error', 'never'],
      'object-shorthand': 'error',
      'prefer-destructuring': ['error', {
        array: true,
        object: true
      }, {
        enforceForRenamedProperties: false
      }],
      
      // Code Style
      'indent': ['error', 2, { SwitchCase: 1 }],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'never'],
      'no-trailing-spaces': 'error',
      'eol-last': 'error',
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
      
      // React Specific
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      
      // Performance
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'warn',
      
      // Security
      'no-script-url': 'error',
      'no-inline-comments': 'off',
      
      // Accessibility
      'jsx-a11y/alt-text': 'off', // Will be handled by specific a11y plugin if added
      
      // Import/Export
      'no-duplicate-imports': 'error'
    },
  },
  // TypeScript specific configuration
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // TypeScript handles these
      'no-undef': 'off',
      'no-unused-vars': 'off',
      
      // TypeScript specific
      '@typescript-eslint/no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error'
    }
  },
  // Test files configuration
  {
    files: ['**/*.{test,spec}.{js,jsx,ts,tsx}', '**/__tests__/**/*'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.vitest
      }
    },
    rules: {
      'no-console': 'off'
    }
  }
])
