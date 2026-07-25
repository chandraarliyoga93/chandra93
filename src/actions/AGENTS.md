# Server Actions

## Package Identity
Logic layer for Firestore/Auth operations using Next.js Server Actions.
Primary tech: `firebase-admin`, `zod`.

## Setup & Run
- Add new action: Create file in `src/actions/` or add to existing one.
- Export `async` functions with `"use server"` directive at the top.

## Patterns & Conventions
- **Validation**: Always use `zod` schemas for input validation.
- **Security**: Always check user role and ID from cookies/auth context.
  - ✅ DO: Use `getAuthUser()` helper (see `src/actions/auth.ts`).
- **Standard Result**: Return `{ success: boolean, data?: any, error?: string }`.
- **Examples**:
  - Auth: `src/actions/auth.ts`
  - Gamification: `src/actions/gamification.ts`
  - Analytics: `src/actions/analytics.ts`

## JIT Index Hints
- Find server action: `rg -n "export async function" .`
- Find validation schema: `rg -n "z\.object"`

## Common Gotchas
- Firestore timestamps must be serialized (converted to ISO string or number) before returning to client.
- Always use `revalidatePath` to clear cache after mutations.
