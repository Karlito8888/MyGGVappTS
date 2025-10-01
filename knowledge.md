# GGV Progressive Web App - Project Knowledge

## Project Overview
GGV is a Progressive Web App built with React 19, TanStack Router, and Supabase. It's a community platform featuring messaging, marketplace, forums, weather, games, and user profiles.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **Routing**: TanStack Router v1
- **State Management**: TanStack Query (React Query)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Maps**: MapLibre GL JS
- **Styling**: CSS with mobile-first approach
- **Build Tool**: Vite
- **Linting**: Biome

## Architecture Principles
- **DRY, KISS, MINUTIEUX, ETAPE PAR ETAPE**: Keep code simple, thorough, and incremental
- **Mobile-first**: PWA optimized for mobile devices
- **Type-safe**: Full TypeScript coverage
- **Real-time**: Supabase realtime subscriptions for live updates
- **Offline-capable**: PWA with service worker support

## Key Patterns

### Custom Hooks
- All data fetching uses TanStack Query with custom hooks in `src/hooks/`
- Hooks follow naming: `use[Feature].ts` (e.g., `useAuth`, `useMessaging`)
- Export from `src/hooks/index.ts` for centralized imports

### File Organization
- Routes in `src/routes/` with co-located CSS files
- Components in `src/components/` with co-located CSS
- Hooks in `src/hooks/`
- Types in `src/types/database.ts` (auto-generated from Supabase)
- Library utilities in `src/lib/`

### Routing
- Uses TanStack Router file-based routing
- Protected routes wrapped with `<ProtectedRoute>`
- Root layout in `__root.tsx`

### Authentication
- Supabase Auth with email/password
- `useAuth` hook provides user state
- `AuthProvider` wraps app for auth context
- Onboarding flow for new users

### Styling
- Mobile-first responsive design
- CSS variables for theming in `src/styles.css`
- Component-specific CSS co-located with components
- Dark theme by default (`#0c0c0c` background)

## Development Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run Biome linter

## Important Notes
- Always consult official docs before changes:
  - React 19: https://react.dev/
  - TanStack Query: https://tanstack.com/query
  - TanStack Router: https://tanstack.com/router
  - Supabase: https://supabase.com/docs/
  - MapLibre: https://maplibre.org/
- Database schema in `supabase.sql`
- Database triggers/functions in `DATABASE_TRIGGERS_FUNCTIONS.md`
- PWA optimizations in `PWA_OPTIMIZATIONS.md`
- Icon integration in `ICONS_INTEGRATION.md`
- Agent guidelines in `AGENTS.md`

## Common Tasks

### Adding a new route
1. Create `src/routes/[name].tsx` and `src/routes/[name].css`
2. Add navigation link in `Navigation.tsx`
3. Use `<ProtectedRoute>` if auth required

### Adding a new data hook
1. Create hook in `src/hooks/use[Feature].ts`
2. Use TanStack Query for data fetching
3. Export from `src/hooks/index.ts`
4. Define query keys in `src/lib/queryKeys.ts`
5. Define query functions in `src/lib/queryFunctions.ts`

### Working with Supabase
- Client instance: `src/lib/supabase.ts`
- Types auto-generated: `src/types/database.ts`
- RLS policies enforce security at database level
- Use realtime subscriptions for live data

## Performance Optimizations
- Data prioritization with `useDataPrioritization`
- Field selection with `useFieldSelection`
- Optimistic updates with `useOptimisticUpdates`
- Minimum loading times with `useMinLoadingTime`
- Lazy loading for routes

## Testing
- Test setup in `src/test/setup.ts`
- Tests co-located with files: `[file].test.ts`
