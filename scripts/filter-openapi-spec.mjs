#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENAPI_URL = process.env.LANGGRAPH_API_URL || "http://127.0.0.1:2024";

// Generate separate specs for each API group
const API_GROUPS = [
  {
    name: "Strategy APIs",
    tags: ["Strategy APIs"],
    outputPath: path.join(__dirname, "../openapi-strategy.json"),
  },
  {
    name: "Portfolio APIs",
    tags: ["Portfolio APIs"],
    outputPath: path.join(__dirname, "../openapi-portfolio.json"),
  },
  {
    name: "MF Portfolio APIs",
    tags: ["MF Portfolio APIs"],
    outputPath: path.join(__dirname, "../openapi-mf-portfolio.json"),
  },
  {
    name: "Report APIs",
    tags: ["Report APIs"],
    outputPath: path.join(__dirname, "../openapi-report.json"),
  },
  {
    name: "Nudge APIs",
    tags: ["Nudge APIs"],
    outputPath: path.join(__dirname, "../openapi-nudges.json"),
  },
  {
    name: "Auth APIs",
    tags: ["auth"],
    outputPath: path.join(__dirname, "../openapi-auth.json"),
  },
  {
    name: "MCP APIs",
    tags: ["me-mcp"],
    outputPath: path.join(__dirname, "../openapi-mcp.json"),
  },
  {
    name: "Pipeline APIs",
    tags: ["Pipeline APIs"],
    outputPath: path.join(__dirname, "../openapi-pipelines.json"),
    // The share routes are deliberately public on the backend (they serve a
    // frozen report to anyone holding the token). The generated client talks
    // to the authed `/api/utilities` proxy, which would turn a public link
    // into a 401 — so they are excluded here and served by the hand-written
    // public client in `src/modules/pipelines/api/pipelines-client.ts` instead.
    excludePathPrefixes: ["/shared/"],
  },
];

async function fetchOpenAPISpec() {
  console.log(`Fetching OpenAPI spec from ${OPENAPI_URL}/openapi.json...`);
  const response = await fetch(`${OPENAPI_URL}/openapi.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch OpenAPI spec: ${response.statusText}`);
  }
  return response.json();
}

function filterPaths(spec, tags, excludePathPrefixes = []) {
  const filteredPaths = {};
  const usedSchemas = new Set();

  // Filter paths by tags
  for (const [pathKey, pathValue] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(pathValue)) {
      if (typeof operation === "object" && operation.tags) {
        const hasMatchingTag = operation.tags.some((tag) => tags.includes(tag));
        if (hasMatchingTag) {
          // Strip /api prefix from paths for proxy compatibility
          // /api/strategies -> /strategies
          const normalizedPath = pathKey.replace(/^\/api/, "");

          if (excludePathPrefixes.some((p) => normalizedPath.startsWith(p))) {
            continue;
          }

          if (!filteredPaths[normalizedPath]) {
            filteredPaths[normalizedPath] = {};
          }
          filteredPaths[normalizedPath][method] = operation;

          // Collect schema references
          collectSchemaRefs(operation, usedSchemas);
        }
      }
    }
  }

  return { filteredPaths, usedSchemas };
}

function collectSchemaRefs(obj, usedSchemas) {
  if (!obj || typeof obj !== "object") return;

  if (obj.$ref && typeof obj.$ref === "string") {
    const match = obj.$ref.match(/#\/components\/schemas\/(.+)/);
    if (match) {
      usedSchemas.add(match[1]);
    }
  }

  for (const value of Object.values(obj)) {
    if (typeof value === "object") {
      collectSchemaRefs(value, usedSchemas);
    }
  }
}

function filterSchemas(spec, usedSchemas) {
  const filteredSchemas = {};
  const schemasToProcess = Array.from(usedSchemas);
  const processedSchemas = new Set();

  // Recursively collect all referenced schemas
  while (schemasToProcess.length > 0) {
    const schemaName = schemasToProcess.pop();
    if (processedSchemas.has(schemaName)) continue;

    processedSchemas.add(schemaName);
    const schema = spec.components?.schemas?.[schemaName];
    if (schema) {
      filteredSchemas[schemaName] = schema;

      // Find more schema refs within this schema
      const nestedRefs = new Set();
      collectSchemaRefs(schema, nestedRefs);
      for (const ref of nestedRefs) {
        if (!processedSchemas.has(ref)) {
          schemasToProcess.push(ref);
        }
      }
    }
  }

  return filteredSchemas;
}

async function main() {
  try {
    const spec = await fetchOpenAPISpec();

    // Generate a separate spec file for each API group
    for (const group of API_GROUPS) {
      const { filteredPaths, usedSchemas } = filterPaths(
        spec,
        group.tags,
        group.excludePathPrefixes,
      );
      const filteredSchemas = filterSchemas(spec, usedSchemas);

      const filteredSpec = {
        ...spec,
        paths: filteredPaths,
        components: {
          schemas: filteredSchemas,
          // Only include component sections that are actually needed
          // Omit responses, requestBodies, etc. to avoid unused schema references
          securitySchemes: spec.components?.securitySchemes || {},
        },
      };

      fs.writeFileSync(group.outputPath, JSON.stringify(filteredSpec, null, 2));
      console.log(`✅ ${group.name} spec written to ${group.outputPath}`);
      console.log(
        `   Included ${Object.keys(filteredPaths).length} paths with tags: ${group.tags.join(", ")}`,
      );
      console.log(
        `   Included ${Object.keys(filteredSchemas).length} schemas (down from ${Object.keys(spec.components?.schemas || {}).length})`,
      );
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
