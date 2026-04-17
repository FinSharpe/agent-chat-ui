import { defineConfig } from 'orval';

export default defineConfig({
  'strategy-apis': {
    input: {
      target: './openapi-strategy.json',
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated/strategy-apis',
      schemas: './src/api/generated/strategy-apis/models',
      client: 'react-query',
      httpClient: 'fetch',
      mock: false,
      clean: true,
      prettier: true,
      baseUrl: '/api/utilities',
      override: {
        useDates: false,
      },
    },
  },
  'portfolio-apis': {
    input: {
      target: './openapi-portfolio.json',
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated/portfolio-apis',
      schemas: './src/api/generated/portfolio-apis/models',
      client: 'react-query',
      httpClient: 'fetch',
      mock: false,
      clean: true,
      prettier: true,
      baseUrl: '/api/utilities',
      override: {
        useDates: false,
      },
    },
  },
  'mf-portfolio-apis': {
    input: {
      target: './openapi-mf-portfolio.json',
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated/mf-portfolio-apis',
      schemas: './src/api/generated/mf-portfolio-apis/models',
      client: 'react-query',
      httpClient: 'fetch',
      mock: false,
      clean: true,
      prettier: true,
      baseUrl: '/api/utilities',
      override: {
        useDates: false,
      },
    },
  },
  'report-apis': {
    input: {
      target: './openapi-report.json',
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated/report-apis',
      schemas: './src/api/generated/report-apis/models',
      client: 'react-query',
      httpClient: 'fetch',
      mock: false,
      clean: true,
      prettier: true,
      baseUrl: '/api/utilities',
      override: {
        useDates: false,
      },
    },
  },
  'auth-apis': {
    input: {
      target: './openapi-auth.json',
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated/auth-apis',
      schemas: './src/api/generated/auth-apis/models',
      client: 'react-query',
      httpClient: 'fetch',
      mock: false,
      clean: true,
      prettier: true,
      baseUrl: '/api',
      override: {
        useDates: false,
      },
    },
  },
  'mcp-apis': {
    input: {
      target: './openapi-mcp.json',
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated/mcp-apis',
      schemas: './src/api/generated/mcp-apis/models',
      client: 'react-query',
      httpClient: 'fetch',
      mock: false,
      clean: true,
      prettier: true,
      baseUrl: '/api/utilities',
      override: {
        useDates: false,
      },
    },
  },
});
