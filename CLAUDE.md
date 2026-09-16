# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application based on LangChain's Agent Chat UI, enabling chat interactions with any LangGraph server that has a `messages` key. The application has been customized for FinSharpe GPT (see `src/configs/app.config.ts`).

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Package Manager**: pnpm (v10.5.1)
- **Runtime**: React 19
- **LangGraph SDK**: `@langchain/langgraph-sdk` for graph interactions
- **UI**: Radix UI components + Tailwind CSS
- **State Management**: React Context (Stream, Thread, Artifact providers)
- **URL State**: `nuqs` for query state management
- **TypeScript**: v5.7.2 with strict mode enabled

## Common Commands

### Development
```bash
pnpm dev          # Start development server (localhost:3000)
pnpm build        # Build for production
pnpm start        # Start production server
```

### Code Quality
```bash
pnpm lint         # Run ESLint
pnpm lint:fix     # Run ESLint with auto-fix
pnpm format       # Format code with Prettier
pnpm format:check # Check formatting without changes
```

## Architecture Overview

### Provider Hierarchy
The app uses a nested provider architecture in `src/app/page.tsx`:
```
ThreadProvider (manages thread list and fetching)
  └─ StreamProvider (handles LangGraph streaming and config)
      └─ ArtifactProvider (manages artifact rendering in side panel)
          └─ Thread (main UI component)
```

### Key Providers

**StreamProvider** (`src/providers/Stream.tsx`)
- Wraps `useStream` from LangGraph SDK with type-safe context
- Handles connection configuration (API URL, assistant ID, API key)
- Shows setup form if required env vars are missing
- Manages thread ID via URL query params (`useQueryState`)
- Validates LangGraph server connection on mount
- Custom events reduced via `uiMessageReducer` for UI messages

**ThreadProvider** (`src/providers/Thread.tsx`)
- Manages thread list state and fetching
- Differentiates between `assistant_id` (UUID) and `graph_id` (name) when searching threads
- Uses `createClient` helper to instantiate LangGraph SDK client

**ArtifactProvider** (`src/components/thread/artifact.tsx`)
- Enables rendering artifacts in a side panel using React Portals
- Components use `useArtifact()` hook to access `[ArtifactComponent, { open, setOpen, context }]`
- Artifacts render via `ArtifactSlot` with `ArtifactContent` and `ArtifactTitle` portal targets

### API Passthrough Setup
`src/app/api/[..._path]/route.ts` uses `langgraph-nextjs-api-passthrough` to proxy requests to LangGraph server:
- Reads `LANGGRAPH_API_URL` and `LANGSMITH_API_KEY` from env
- Injects API key server-side to avoid exposing it to clients
- All HTTP methods (GET, POST, PUT, PATCH, DELETE, OPTIONS) proxied

### Message Rendering System

**Message Types** (`src/components/thread/messages/`)
- `ai.tsx`: AI/assistant messages with streaming support
- `human.tsx`: User messages
- `tool-calls.tsx`: Tool invocation display
- `generic-interrupt.tsx`: Interrupt messages

**Message Visibility Controls**
1. Hide streaming: Add `langsmith:nostream` tag to chat model config
2. Permanently hide: Prefix message ID with `do-not-render-` (see `DO_NOT_RENDER_ID_PREFIX` in `src/lib/ensure-tool-responses.ts`)

**Tool Call Handling** (`src/lib/ensure-tool-responses.ts`)
- Ensures every AI message with tool calls is followed by a tool response
- Auto-generates hidden tool responses (`do-not-render-` prefix) if missing
- Prevents UI errors when tool messages are absent

### Client Components Registry
`src/components/thread/messages/client-components/registry.ts` maps component names to implementations for dynamic rendering. Currently includes:
- `sources`: Sources component for displaying reference materials

### Path Aliases
TypeScript configured with `@/*` alias mapping to `./src/*` (see `tsconfig.json`)

### Styling
- Global styles in `src/app/globals.css`
- Prettier configured with Tailwind plugin for class sorting
- Component styling uses `cn()` utility from `src/lib/utils.ts` (clsx + tailwind-merge)

### Agent Inbox/Interrupts
- Components in `src/components/thread/agent-inbox/` handle LangGraph interrupt patterns
- See `src/lib/agent-inbox-interrupt.ts` for interrupt handling utilities

## Module Structure
The application follows a feature-based module architecture for better organization and scalability:

### Module Organization Principles
Modules are organized by feature in `src/modules/` with the following structure:
```
src/modules/
  [module-name]/
    components/       # Module-specific UI components
      modals/        # Modal components
      forms/         # Form components
      shared/        # Reusable components within the module
    hooks/           # Custom hooks for the module
    types/           # TypeScript type definitions
    constants/       # Constants and configuration
    utils/           # Utility functions (if needed)
    index.ts         # Public API exports
```

**Hooks:**
- `useConsentQuery.ts` - Real-time localStorage tracking for consent status
- `useFiData.ts` - FI data fetching and consent flow management
- `useImportHoldingsMutation.ts` - Import holdings to chat as markdown table
- `useRefreshFiData` - Manual FI data refresh functionality

### account-deletion module
`src/modules/account-deletion/` backs the public `/delete-account` page — the URL Google Play's Data-safety form links to, so it must render with no app and no session (it is in `PUBLIC_PAGE_PATHS`).

- The policy copy lives in `constants/content.ts` and mirrors finsharpe-mobile `docs/legal/delete-account.md`; change the two together. Play checks the page names the app and developer, gives the deletion steps, and says what is deleted and what is kept for how long.
- `DeleteAccountPanel` adds the web deletion path for a signed-in visitor: type DELETE to confirm, then `useDeleteAccountMutation` calls `DELETE /api/auth/me`, which proxies to the backend's `DELETE /auth/me` (finsharpe-agents#210) and clears the auth cookies on `204`. Every other status leaves the account and the session untouched, so the dialog stays open with the reason.

### history module
`src/modules/history/` renders the Memory page and the drawer's chat list from `useThreadsQuery`.

- A chat's bookmark and user-set title live in LangGraph thread metadata (`bookmarked`, `bookmarked_at`, `title`), a contract shared with finsharpe-mobile (its ADR-0008 §8 is the authority; `utils/threadMetadata.ts` holds the keys). Change the two apps together.
- `useThreadMetadataMutation` writes them optimistically into every cached `["threads"]` list and does not re-fetch; a refused write restores only the keys it changed. The runtime merges metadata, so an un-bookmark nulls `bookmarked_at` and a cleared rename writes `""`.
- `useLegacyBookmarkMigration` moves the old `localStorage.bookmarked_threads` ids into metadata once, only for threads in the signed-in user's list; ids it cannot place stay in storage.

### Component Decomposition Guidelines

When creating or modifying components:
- **Soft limit**: Aim for 150-200 lines per file (not a strict requirement)
- **Extract logic**: Move complex state management to custom hooks
- **Reusable components**: Place in `shared/` or component-specific folders
- **Single responsibility**: Each component should have one clear purpose
- **Co-locate related code**: Keep component-specific types, utils near components

### Adding New Modules

1. Create folder structure in `src/modules/[module-name]/`
2. Implement components following decomposition guidelines
3. Create custom hooks for state management
4. Define TypeScript types in `types/` folder
5. Export public API through `index.ts`
6. Import and integrate in main application components
7. Update this documentation with module details

## Production Deployment
For production, choose one of two authentication methods:
1. **API Passthrough (Quickstart)**: Already configured via `src/app/api/[..._path]/route.ts`
2. **Custom Auth**: Modify `useTypedStream` in `src/providers/Stream.tsx` to pass custom auth headers via `defaultHeaders` parameter

# Git Guidelines
1. Never mention yourself in commit messages