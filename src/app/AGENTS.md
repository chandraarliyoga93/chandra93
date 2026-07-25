# App Routes

## Package Identity
Next.js App Router structure defining the dashboard pages for Guru and Siswa.

## Patterns & Conventions
- **Structure**:
  - `(auth)`: Auth-related pages (Login).
  - `dashboard/guru/`: All pages for teachers.
  - `dashboard/siswa/`: All pages for students.
- **Data Fetching**: Prefer Server Components for initial data fetching.
  - ✅ DO: Use Server Actions from `@/actions`.
- **Layouts**:
  - Global: `src/app/layout.tsx`.
  - Guru: `src/app/dashboard/guru/layout.tsx`.
  - Siswa: `src/app/dashboard/siswa/layout.tsx`.
- **Transitions**: Wrap page content in `PageTransition`.

## JIT Index Hints
- Find a page: `find . -name "page.tsx"`
- Find a layout: `find . -name "layout.tsx"`
- Find metadata: `rg -n "export const metadata"`

## Common Gotchas
- Always use `await searchParams` and `await params` in Server Components.
- Use `URLTabs` for stateful tab navigation.
- Middleware handles route protection and role redirection.
