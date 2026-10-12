# Layout: vertical slices

Each feature gets one folder with everything about it, so an agent changes a feature by opening one folder instead of searching the repo. Organize by feature, not by layer (no top-level `components/`, `hooks/`, `services/`).

## Next.js + Convex

Next.js routes live in `app/` and Convex functions must live in `convex/`, so a feature has up to three places, all with the same name:

```
app/
  (app)/watch-party/page.tsx      # thin: renders the feature, nothing else
features/
  watch-party/
    WatchParty.tsx
    useWatchParty.ts
    watchParty.logic.ts           # pure functions, tested directly
    watchParty.test.ts
convex/
  schema.ts                       # single source of truth for data types
  watchParty/
    queries.ts
    mutations.ts
    watchParty.test.ts
shared/                           # only code two or more features really use
```

## Rules

- Adding a feature means adding its folders; deleting one means deleting them.
- Route files stay thin; the feature lives in `features/<name>`.
- `shared/` only for code two features really use.
- Types come from the Convex schema (`Doc<"table">`, validators); don't redeclare them.
- Pure logic in `*.logic.ts` so it's testable without React or Convex.
- Tests live next to the code they test.
- No barrel `index.ts` files; import from the real file so grep finds it.
