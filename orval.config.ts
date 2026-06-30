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
  'nudge-apis': {
    input: {
      target: './openapi-nudges.json',
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated/nudge-apis',
      schemas: './src/api/generated/nudge-apis/models',
      client: 'react-query',
      httpClient: 'fetch',
      mock: false,
      clean: true,
      prettier: true,
      baseUrl: '/api/utilities',
      override: {
        useDates: false,
        // The nudge endpoints are POSTs but are reads — coerce them to useQuery
        // so they cache, dedupe, and refetch like queries (lazy on accordion open).
        operations: {
          news_nudge_api_nudges_news_post: { query: { useQuery: true } },
          technical_nudge_api_nudges_technical_post: { query: { useQuery: true } },
          fundamental_nudge_api_nudges_fundamental_post: { query: { useQuery: true } },
          finsharpe_score_nudge_api_nudges_finsharpe_score_post: {
            query: { useQuery: true },
          },
        },
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
