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
pnpm check        # Behaviour checks (no test runner): scripts/<suite>/*.ts(x), bundled by scripts/run-checks.mjs
```

## Architecture Overview

### Provider Hierarchy and App Shell
Every signed-in page (`src/app/(main)/`) renders through `src/app/(main)/layout.tsx`:
```
ClientProviders (Toaster, ThreadProvider, StreamProvider)
  └─ AppViewport (theme class, desktop zoom-to-window scaling, Radix portal roots)
      └─ AppShell (desktop sidebar or mobile header + bottom nav, profile overlay)
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

**Portfolio connect card** (`src/lib/portfolio-connect/`, `messages/portfolio-connect/`)
- `get_user_portfolio` / `analyze_user_portfolio` (finsharpe-agents ADR-0014) answer "nothing to read" with `additional_kwargs.portfolio_connect = {reason, asset_classes, labels}`. The chat draws a card in place of the tool's payload: one class opens that class's consent form in place, several (or an unknown one) the class picker, `not_signed_in` goes to `/login?next=<thread>`. One card per distinct block per turn; the tool row stays but neither opens nor reads as failed.
- Copy, casing and routing mirror finsharpe-mobile's `portfolio_connect_card.dart` (#189); change the two together. Checks: `pnpm check:portfolio-connect`.
- The consent journey records the thread (`returnTo` in the `aa-pending` marker, vetted with `safeReturnPath`), so the return modal on Import offers "Back to your chat".

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


### account-deletion module
`src/modules/account-deletion/` backs the public `/delete-account` page — the URL Google Play's Data-safety form links to, so it must render with no app and no session (it is in `PUBLIC_PAGE_PATHS`).

- The policy copy lives in `constants/content.ts` and mirrors finsharpe-mobile `docs/legal/delete-account.md`; change the two together. Play checks the page names the app and developer, gives the deletion steps, and says what is deleted and what is kept for how long.
- `DeleteAccountPanel` adds the web deletion path for a signed-in visitor: type DELETE to confirm, then `useDeleteAccountMutation` calls `DELETE /api/auth/me`, which proxies to the backend's `DELETE /auth/me` (finsharpe-agents#210) and clears the auth cookies on `204`. Every other status leaves the account and the session untouched, so the dialog stays open with the reason.

### shell module
`src/modules/shell/` is the signed-in frame: `AppViewport`, `AppShell`, the desktop `WebSidebar` (nav, New chat, chat history with search/rename/delete; collapsible to an icon rail) and the mobile `ChatHistoryDrawer`.
- `SidebarAccountFooter` carries the light/dark switch and the identity row — the name opens Profile, a separate button signs out — or a Login button when signed out. On mobile the header avatar opens the same actions as a bottom sheet (`MobileAccountMenu`, after finsharpe-mobile's `account_sheet.dart`); the bottom tab bar holds navigation only. MCP Access and Delete Account are not in the nav — they are on the Profile page.
- Navigation is Next routing, wrapped by `useAppNavigation()` (`src/hooks/`): tabs chat `/`, home `/home`, discover `/discover`, import `/import`, memory `/history`. `createNewChat(prompt?)` opens a fresh chat; with a prompt it sets `useUiStore.pendingPrompt`, which the chat page sends once as the first message.
- `useUiStore` (`src/store/`, zustand, persists only theme and sidebar state) holds the shell's overlay flags, `pendingPrompt` and `pendingDiscoverFeature`.
- Reference layout kit shared by the pages: `src/components/shared/{SectionKit,WavePattern,HeroCarousel,Popup,OverlayColumn,PageLoader}`, `src/components/discover/FeatureHeader`, `CarouselDots`. On desktop, detail views open as `PopupFrame`/`OverlayRoot` popups portalled into `<main data-popup-root>`; feature pages sit in the centred `OverlayColumn`.

### auth module
`src/modules/auth/` is the sign-in flow: Welcome `/get-started`, Auth Choice `/get-started/choose`, Sign In `/login`, Sign Up `/register`, OTP `/verify-email` (routes in `constants/routes.ts`, which the middleware imports, so keep it free of React).
- `(auth)/layout.tsx` renders `AuthFlowLayout`, which draws each screen from the pathname (`AuthScreenTransition`) so only the flow animates while the desktop media card stays still; the route `page.tsx` files return `null`. A new auth route needs an entry in that screen map.
- The middleware sends a visitor with no session to Welcome with `?next=`; every screen carries `next` forward and `safeReturnPath` checks it. A session that dies mid-use (401 in `AuthProvider`) goes straight to Sign In; signing out returns to Welcome.

### account module
`src/modules/account/` holds `ProfileSettingsPage` (real user data only — name, email, roles — then MCP Access, sign out and, last, a destructive-but-quiet Delete account; the two rows reuse `useAccountActions`' handlers and close the overlay before leaving). There is no Account Settings screen and no Assistant Mode: identity, sign out and the theme switch live in the shell's nav (see the shell module); MCP Access and Delete Account live on Profile.

### home, chat, discover, pipelines, import-data modules
- `home/` — the `/home` page: features carousel, what-you-can-do, starter questions, the market-news carousel (`MarketNewsRow`, drawn from discover's real feed), FinSharpe Publications and Watch & Learn. The last two are finsharpe-mobile's curated lists of real articles and talks (`constants/learn.ts`, mirroring `learn_content.dart`; change the two together). A card opens a detail popup (`modals/PublicationReader`, `modals/VideoDetail`, after the reference's Reader and VideoDetail): an article whose publisher allows framing (`embeddable`, only Moneycontrol — Medium and LinkedIn refuse) opens in an iframe in the popup, the rest show the cover and a "Read full article" link out (we hold no body text), a talk plays in a youtube-nocookie embed.
- `chat/` — composer, empty state, toolbar, model picker (the real tiers in `src/configs/models.ts`), Hear Output. Every send goes through `useChatSubmit`; `usePendingPromptHandoff` sends a prompt handed over from another page. A send that cannot connect, an answer that stops early and a chat that cannot load each say so in the thread with a Retry (`components/thread/messages/stream-error.tsx`).
- `discover/` — landing, Market news on `/api/utilities/news/market`, IPO Watch on `/api/utilities/ipo/*`, Explore Investment Ideas on the real strategy catalog, and strategy detail; the open feature and strategy live in the URL (`?feature=&strategy=`). `components/custom-basket/` is the Build Your Own Portfolios wizard over the real basket APIs. The strategy row and detail mirror finsharpe-mobile's `strategy_api.dart` / `strategy_detail_screen.dart`: they draw only the point-in-time `snapshot` (day move, movers, scores, fundamentals, concentration, rebalance history — types in `types/strategy-api.ts`) and never the list's `stats`/`spark` or the detail's `returns_chart_data`/`stats`, which price today's holdings backwards (finsharpe-agents#92); change the two apps together. **Only Created by Advisors is enterable** — every other idea category, and the Coming Soon rows, are drawn disabled because nothing backs them. Do not add illustrative figures to fill them.
- `pipelines/` — Agent Workflows (`/discover/research/**`): catalog, quote, run, report, library, shared report. `utils/errors.ts` decides "the server answered and refused" vs "we never reached it"; only the first may state a fact about the thing being asked for.
- `import-data/` — the Import page, the connected accounts list and the analysis modals. The Account Aggregator flow goes through the backend's `/api/aa/*` under the session JWT, the same transport finsharpe-mobile uses — see below.
  - The analysis hand-offs to chat send the request, never the holdings (#85): the agent reads the book itself through `get_user_portfolio` / `analyze_user_portfolio`. The sentences live in `utils/chat-handoffs.ts` and mirror finsharpe-mobile's `chat_messages.dart` byte for byte; change the two together. Bank accounts still paste their figures until finsharpe-agents#238. Checks: `pnpm check:chat-handoffs`.
  - The My net worth card (`NetworthGraph`) quotes today's move of the invested book, never a longer return: each invested class's holdings go through the same analysis request the Analyse view makes (`useDayMove`, shared cache in `api/holdings-analysis.ts`), and `snapshot.day_move.pct` becomes rupees against the class's value. Every invested class must report a move or the line is left out. The rules live in `utils/day-move.ts` and mirror finsharpe-mobile's `_SummaryCard` / `ClassAnalytics.dayMoveInr`; change the two together. Checks: `pnpm check:day-move`.
  - Smart Alerts (`components/nudges/`) is one card grouped by asset class (Equities, Mutual funds, ETFs, SIPs; no Bank group), fed by `POST /api/nudges/alerts` — ETFs are sent as `etf` there, while the Deep Dive feeds (News / Technical / Fundamental) keep equity + MF only. SIP alerts (missed / upcoming installment) are worked out in the browser from the MF blob's `activeSips` and `transactionsEnd`. A failed alerts request leaves the served classes out rather than calling them clear. The rules live in `utils/smart-alerts.ts` and mirror finsharpe-mobile's `smart_alerts.dart` / `local_alerts.dart` (#173); change the two together. Checks: `pnpm check:smart-alerts`.

### Account Aggregator (Import)
Five consent types and no others: `EQUITIES, MUTUAL_FUNDS, ETF, BANK_ACCOUNTS, SIP`. The user never picks a FIP; that happens on OneMoney's hosted page, and FIP scoping is backend env (`MONEY_ONE_*_FIPS`).
- Backend routes reach this app at **`/api/utilities/<path>`** (`src/app/api/utilities/[..._slug]/route.ts` re-adds `/api` and injects the JWT + `X-Fgp`). The `[..._path]` catch-all strips `/api` and cannot reach them.
- `api/aa-client.ts` wraps discover / create / resolve / fi-data / refresh / list / revoke. Error mapping: `detail.kind`, else 410 → consent dead, 425 → data missing, else transient.
- The return leg: the backend's `_redirect_url_for` sends MoneyOne to `{MONEY_ONE_REDIRECT_ORIGIN}/moneyone/{TYPE}~{accountID}~mobile`, which forwards the raw `ecres/resdate/fi` to `/app/consent-return`. A per-tab `sessionStorage` marker distinguishes a web journey from the Android App Link. **`MONEY_ONE_REDIRECT_ORIGIN` must be set per environment** or a consent started anywhere returns to production.
- Never put consents or FI data in browser storage — that was the old transport and the reason a portfolio was per-browser.
- The analysis modals still read raw MoneyOne shapes via `?includeRaw=true`; everything the page derives comes from `normalized`.

### When there is no backend for something
Do not ship invented figures. A screen with no data source is drawn disabled or left out — never filled with illustrative returns, fabricated news or placeholder billing. FinSharpe is a SEBI-registered investment adviser, so a made-up number on screen is a regulatory problem, not placeholder copy. The same goes for claims: every security or capability statement has to be traceable to something real.

### Failure states
`src/components/shared/SectionErrorState.tsx` is the shared inline error state (full and `compact`). Every list or section that can fail must tell **empty** (loaded, nothing there) from **failed** (we could not load) — a failed query must never render the empty copy, because that states a fact about the user's account. Root and shell error boundaries live in `src/app/{global-error,(main)/error}.tsx`; the shell shows `ServerUnreachableBanner` when `useAuth().authError` is set. React Query retries network/5xx twice and never a 4xx.

### Loading states
`src/components/shared/PageLoader.tsx` is the one full-page loader, after finsharpe-mobile's `FsPageLoader` (#153, `fs_page_loader.dart`; change the two together): the Welcome ribbon with the logo mark centred — no wordmark, no copy. It fills the region that is waiting (the body under a screen's header, an analysis popup's body), never the header. Wrap the page in `PageLoaderSwitch loading={…}`: nothing shows for a 200ms grace, a loader that did show stays 400ms, then cross-fades to the content. A section still arriving inside a page that is already drawn keeps its skeleton; chat's assistant turn keeps its own loader.

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