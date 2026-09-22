# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application based on LangChain's Agent Chat UI, enabling chat interactions with any LangGraph server that has a `messages` key. The application has been customized for FinSharpe GPT (see `src/configs/app.config.ts`).

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Package Manager**: pnpm (v10.5.1)
- **Runtime**: React 19
- **LangGraph SDK**: `@langchain/langgraph-sdk` for graph interactions
- **UI**: Radix UI components + Tailwind CSS v4, framer-motion, recharts
- **State Management**: React Context (Stream, Thread, Artifact providers); zustand for UI state (`src/store/useUiStore.ts`, module stores)
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

### Provider Hierarchy and App Shell
Every signed-in page (`src/app/(main)/`) renders through `src/app/(main)/layout.tsx`:
```
ClientProviders (Toaster, ThreadProvider, StreamProvider)
  └─ AppViewport (theme class, desktop zoom-to-window scaling, Radix portal roots)
      └─ AppShell (desktop sidebar or mobile header + bottom nav, account/assistant overlays)
          └─ the route's page (owns its own scrolling)
```
The chat itself (`/`) wraps `Thread` in `ArtifactProvider`.

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

### Styling and Design System
The UI is a port of the finsharpegpt-desktop-web reference design; that repo's code (web build, `NEXT_PUBLIC_APP_MODE=web`) is the visual source of truth.
- Tokens, surfaces and utilities live in `src/app/design-system.css` (imported by `globals.css`): `glass-card` / `glass-nav` / `glass-tile`, `bg-brand-gradient`, `hover-tint`, `rounded-tile|nested|card`, `v3-display` (Inria Serif) and `v3-eyebrow`, `tone-*`, dark-mode overrides for the literal light classes, and a one-step-up type scale for the small arbitrary sizes (`text-[11px]` etc.). The `slate-*` scale is remapped to navy tints.
- Rules that would leak into PDF templates or public pages are scoped to `[data-app-mode]`, which only `AppViewport` sets. Inside it the root font size is 16px; standalone pages (PDF templates, shared reports, `/welcome`) keep the legacy 14px root.
- Page-specific CSS goes in `src/app/styles/<page>.css`, scoped under `[data-app-mode]`. Prefer Tailwind classes.
- Type rules: Inter for UI (`font-geist` / `font-funnel` both map to it), weights 400–600 only, tabular numbers.
- Dark mode is the `dark` class on `AppViewport`, from `useUiStore().themeMode`. Never use `bg-white/80`, `from-white` or `ring-white` for a surface — the dark overrides only match exact class names; use `bg-background` or `var(--card-bg)`.
- Desktop (≥1024px) is scaled with CSS `zoom` to a 1536×826 reference and `--wx` stretches layout widths. Radix dialogs/sheets portal into the zoomed frame; anchored overlays (popover, select, dropdown, tooltip) portal into an unzoomed sibling root and zoom only their content (`src/components/ui/portal-container.tsx`), because floating-ui offsets inside a zoomed box get scaled twice. Size things in px, not `vw`/`dvh`, inside the frame.
- Prettier is configured with the Tailwind plugin for class sorting; `cn()` in `src/lib/utils.ts` merges classes.

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

### shell module
`src/modules/shell/` is the signed-in frame: `AppViewport`, `AppShell`, the desktop `WebSidebar` (nav, New chat, chat history with search/rename/delete, account footer; collapsible to an icon rail) and the mobile `ChatHistoryDrawer`.
- Navigation is Next routing, wrapped by `useAppNavigation()` (`src/hooks/`): tabs chat `/`, home `/home`, discover `/discover`, import `/import`, memory `/history`. `createNewChat(prompt?)` opens a fresh chat; with a prompt it sets `useUiStore.pendingPrompt`, which the chat page sends once as the first message.
- `useUiStore` (`src/store/`, zustand, persists only theme and sidebar state) holds the shell's overlay flags, `pendingPrompt` and `pendingDiscoverFeature`.
- Reference layout kit shared by the pages: `src/components/shared/{SectionKit,WavePattern,HeroCarousel,Popup,OverlayColumn}`, `src/components/discover/FeatureHeader`, `CarouselDots`, `SoftLoader`. On desktop, detail views open as `PopupFrame`/`OverlayRoot` popups portalled into `<main data-popup-root>`; feature pages sit in the centred `OverlayColumn`.

### auth module
`src/modules/auth/` is the sign-in flow: Welcome `/get-started`, Auth Choice `/get-started/choose`, Sign In `/login`, Sign Up `/register`, OTP `/verify-email` (routes in `constants/routes.ts`, which the middleware imports, so keep it free of React).
- `(auth)/layout.tsx` renders `AuthFlowLayout`, which draws each screen from the pathname (`AuthScreenTransition`) so only the flow animates while the desktop media card stays still; the route `page.tsx` files return `null`. A new auth route needs an entry in that screen map.
- The middleware sends a visitor with no session to Welcome with `?next=`; every screen carries `next` forward and `safeReturnPath` checks it. A session that dies mid-use (401 in `AuthProvider`) goes straight to Sign In; signing out returns to Welcome.

### account module
`src/modules/account/` holds the overlays `AppShell` hosts: `AccountSettingsModal` (Profile / Usage / Security / Billing / Settings — the Settings tab has the theme switch, MCP Access and Delete Account), `ProfileSettingsPage` and `AssistantModeOverlay` (wheel of tools; Start Chat calls `createNewChat` with the tool's prompt). Usage, billing, security and subscription figures are placeholder content in `constants/placeholderContent.ts` until a backend exists.

### home, chat, discover, pipelines, import-data modules
- `home/` — the `/home` page. Market news, publications and videos are placeholder content in `constants/`. The personal-intelligence section follows the accounts linked on Import.
- `chat/` — composer, empty state, toolbar, model picker (the real tiers in `src/configs/models.ts`), Hear Output. Every send goes through `useChatSubmit`; `usePendingPromptHandoff` sends a prompt handed over from another page.
- `discover/` — landing, Explore Investment Ideas on the real strategy catalog, strategy detail, and the placeholder News Impact / Trading Ideas / Global Investing features; the open feature and strategy live in the URL (`?feature=&strategy=`). `components/custom-basket/` is the Build Your Own Portfolios wizard over the real basket APIs.
- `pipelines/` — Agent Workflows (`/discover/research/**`): catalog, quote, run, report, library, shared report.
- `import-data/` — the Import page and its forms/analysis modals. Manual assets and the (hidden) watchlist are kept in browser storage (`store/`).

### history module
`src/modules/history/` renders the Memory page (`/history`). The shell's sidebar and drawer read the same data through `useChatHistory`, which groups chats Today / Yesterday / This Week / Older and exposes rename, bookmark and delete.

- A chat's bookmark and user-set title live in LangGraph thread metadata (`bookmarked`, `bookmarked_at`, `title`), a contract shared with finsharpe-mobile (its ADR-0008 §8 is the authority; `utils/threadMetadata.ts` holds the keys). Change the two apps together.
- `useThreadMetadataMutation` writes them optimistically into every cached `["threads"]` list and does not re-fetch; a refused write restores only the keys it changed. Writes share one mutation scope, so they reach the server in the order they were made. The runtime merges metadata, so an un-bookmark nulls `bookmarked_at` and a cleared rename writes `""`.
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