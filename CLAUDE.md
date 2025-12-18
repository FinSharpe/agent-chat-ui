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

## Environment Configuration

The app supports two deployment modes:

### Local Development
```bash
NEXT_PUBLIC_API_URL=http://localhost:2024
NEXT_PUBLIC_ASSISTANT_ID=agent
```

### Production (API Passthrough)
```bash
NEXT_PUBLIC_ASSISTANT_ID="agent"
LANGGRAPH_API_URL="https://my-agent.default.us.langgraph.app"
NEXT_PUBLIC_API_URL="https://my-website.com/api"
LANGSMITH_API_KEY="lsv2_..."  # Server-side only, do NOT prefix with NEXT_PUBLIC_
```

**Important**: Environment variables prefixed with `NEXT_PUBLIC_` are exposed to the client. Keep sensitive keys (like `LANGSMITH_API_KEY`) server-side only.

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

**Using Artifacts in Thread** (`src/components/thread/index.tsx`)

The Thread component demonstrates the full artifact workflow:

1. **Setup artifact hooks**:
   ```tsx
   const [artifactContext, setArtifactContext] = useArtifactContext();
   const [artifactOpen, closeArtifact] = useArtifactOpen();
   ```

2. **Reset artifact state when changing threads**:
   ```tsx
   const setThreadId = (id: string | null) => {
     _setThreadId(id);
     closeArtifact();
     setArtifactContext({});  // Clear artifact context
   };
   ```

3. **Pass artifact context to stream submissions**:
   ```tsx
   const context = Object.keys(artifactContext).length > 0 ? artifactContext : undefined;

   stream.submit(
     { messages: [...toolMessages, newHumanMessage], context },
     {
       streamMode: ["values"],
       optimisticValues: (prev) => ({
         ...prev,
         context,
         messages: [...]
       })
     }
   );
   ```

4. **Render artifact panel with portal targets**:
   ```tsx
   {artifactOpen && (
     <div className="relative flex flex-col border-l">
       <div className="absolute inset-0 flex min-w-[30vw] flex-col">
         <div className="grid grid-cols-[1fr_auto] border-b p-4">
           <ArtifactTitle className="truncate overflow-hidden" />
           <button onClick={closeArtifact}>
             <XIcon className="size-5" />
           </button>
         </div>
         <ArtifactContent className="relative flex-grow" />
       </div>
     </div>
   )}
   ```

5. **Responsive layout with artifact**:
   - Main grid adjusts columns: `grid-cols-[1fr_0fr]` → `grid-cols-[3fr_2fr]` when artifact is open
   - Artifact panel has minimum width of `30vw`
   - Uses Framer Motion for smooth transitions

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
- Tailwind config in `tailwind.config.js` with custom plugins (scrollbar, animate)
- Prettier configured with Tailwind plugin for class sorting
- Component styling uses `cn()` utility from `src/lib/utils.ts` (clsx + tailwind-merge)

## Key Patterns

### URL State Management
- Use `useQueryState` from `nuqs` for URL-based state (e.g., threadId, apiUrl, assistantId)
- Wrapped in `NuqsAdapter` at root layout level

### File Uploads
- Custom `useFileUpload` hook in `src/hooks/use-file-upload.tsx`
- Integrates with thread/stream context for multimodal support

### Responsive Design
- `useMediaQuery` and `useIsMobile` hooks in `src/hooks/` for breakpoint detection
- Mobile-first approach with Tailwind responsive utilities

### Agent Inbox/Interrupts
- Components in `src/components/thread/agent-inbox/` handle LangGraph interrupt patterns
- See `src/lib/agent-inbox-interrupt.ts` for interrupt handling utilities

## Development Notes

- **React 19 Compatibility**: Override for `react-is` in package.json ensures compatibility
- **Edge Runtime**: API routes use Edge runtime by default (see `src/app/api/[..._path]/route.ts`)
- **Strict TypeScript**: Compiler set to strict mode with ES2017 target
- **ESLint Config**: TypeScript ESLint with React Hooks and React Refresh plugins
- **No Unused Vars**: Configured to allow `_` prefix for intentionally unused variables

## Customization

The application has been customized from the original LangChain Agent Chat UI:
- App name changed to "FinSharpe GPT" in `src/configs/app.config.ts`
- Custom client components can be added to the registry in `src/components/thread/messages/client-components/`

## Production Deployment

For production, choose one of two authentication methods:

1. **API Passthrough (Quickstart)**: Already configured via `src/app/api/[..._path]/route.ts`
2. **Custom Auth**: Modify `useTypedStream` in `src/providers/Stream.tsx` to pass custom auth headers via `defaultHeaders` parameter
