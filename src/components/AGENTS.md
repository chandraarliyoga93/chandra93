# UI Components

## Package Identity
Reusable UI components using Shadcn/UI, Tailwind, and Framer Motion.

## Patterns & Conventions
- **Naming**: PascalCase for files and functions.
- **Organization**:
  - `ui/`: Base shadcn components.
  - `layout/`: Shared structural components (Sidebar, Header, Navbar).
  - `[feature]/`: Feature-specific components (e.g., `gamification/`, `journals/`).
- **Styling**:
  - Guru: Minimalist, clean (Standard Shadcn).
  - Siswa: Neo-Brutalist (Bold borders, solid shadows).
  - ✅ DO: Use `cn()` helper for class merging.
  - ✅ DO: Use `iconoir-react` for icons.
- **Examples**:
  - Base Component: `src/components/ui/button.tsx`
  - Feature Component: `src/components/leaderboard/LeaderboardClient.tsx`
  - Navigation: `src/components/layout/AppSidebar.tsx`

## JIT Index Hints
- Find a component: `rg -n "export function .*Component" .`
- Find icons: `rg -n "import {.*} from \"iconoir-react\""`

## Special Considerations
- **PageContainer**: Always wrap page content in `PageContainer` for consistent layout.
- **DataTable**: Use `src/components/ui/data-table/` for any lists requiring sort/filter.
