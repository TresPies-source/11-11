# Technical Specification: Dojo Genesis Sidebar Navigation

## Complexity Assessment: **Medium**

This task involves creating a new persistent navigation sidebar component with moderate complexity. While the UI components and design system are already in place, the implementation requires careful attention to:
- Creating a new navigation paradigm alongside the existing file tree sidebar
- Managing active state across routes using Next.js 14 App Router
- Implementing a 3-tier layout structure
- Ensuring pixel-perfect alignment with mockups

---

## Technical Context

### Environment
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS 3.4 with custom Dojo Genesis design tokens
- **UI Library**: Framer Motion 11.15 for animations
- **Routing**: Next.js `usePathname` hook for active state detection

### Existing Architecture
- **Design System**: Fully implemented in `tailwind.config.ts` with Dojo Genesis brand colors, spacing, and typography
- **UI Components**: Reusable components (`Button`, `Card`, `StatusDot`) already exist in `/components/ui`
- **Layout Structure**: Multiple provider wrappers in `app/layout.tsx`
- **Current Sidebar**: A file tree viewer (`/components/layout/Sidebar.tsx`) for the workbench - this is NOT the navigation sidebar

### Dependencies
- `next`: Navigation and routing
- `framer-motion`: Smooth animations for hover/active states
- `lucide-react`: Icon library (if we choose to use it instead of emojis)
- `clsx`/`tailwind-merge`: Class name utilities (via existing `cn()` util)

---

## Implementation Approach

### 1. Component Architecture

#### New Components to Create

**A. `components/layout/NavigationSidebar.tsx`**
- Primary navigation sidebar component
- Fixed width: 240px
- Full height: 100vh
- Three-tier layout using Flexbox with `justify-between`
- Persistent across all pages

**B. `components/layout/NavItem.tsx`**
- Reusable navigation link component
- Props: `href`, `icon`, `label`
- Uses `usePathname()` for active state detection
- Implements hover and active states per design spec

**Key Decision**: We need to differentiate this from the existing `Sidebar.tsx` (file tree). The new component will be named `NavigationSidebar.tsx` to avoid confusion.

### 2. Component Structure

```
NavigationSidebar.tsx
├── Tier 1: Workspace & User (top)
│   ├── Logo (Bonsai 🌳 + "Dojo Genesis")
│   ├── User email
│   └── Separator line
├── Tier 2: Core Navigation (middle)
│   ├── <nav> container
│   └── NavItem × 4 (Dashboard, Workbench, Librarian, Seeds)
└── Tier 3: Projects & Recent (bottom)
    ├── Projects section (mock data)
    └── Recent section (mock data)
```

### 3. Styling Specifications

#### NavigationSidebar Container
- `width: 240px` (fixed)
- `height: 100vh`
- `background-color: bg-bg-secondary` (#0f2838)
- `border-right: 1px solid bg-bg-tertiary` (#1a3a4f)
- `padding: spacing-6` (24px)
- `display: flex`
- `flex-direction: column`
- `justify-content: space-between`

#### Tier 1 (Workspace & User)
- Logo text: `font-semibold text-lg text-text-primary`
- User email: `text-sm text-text-secondary`
- Separator: `h-px bg-bg-tertiary mt-6`

#### NavItem Component
- **Container**: `flex items-center gap-3 px-2 py-2 rounded-md transition-all duration-fast`
- **Default state**: `text-text-secondary`
- **Hover state**: `bg-bg-tertiary text-text-primary`
- **Active state**: `bg-bg-tertiary text-text-primary` + `border-l-[3px] border-text-accent` (amber left border)
- **Icon**: 24px size
- **Label**: `text-base font-medium`

#### Tier 3 (Projects & Recent)
- Section headings: `text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-3`
- List items: `text-sm text-text-secondary pl-2 py-1.5 truncate hover:text-text-primary cursor-pointer`

---

## Source Code Structure Changes

### Files to Create

1. **`components/layout/NavigationSidebar.tsx`** (~100 lines)
   - Main navigation sidebar component
   - Three-tier layout implementation
   - Mock data for projects and recent items

2. **`components/layout/NavItem.tsx`** (~40 lines)
   - Reusable navigation link component
   - Active state logic with `usePathname()`
   - Hover and active styling

### Files to Modify

1. **`app/layout.tsx`**
   - Import `NavigationSidebar`
   - Wrap existing layout with flex container
   - Add sidebar alongside main content area

**Current structure:**
```tsx
<body>
  <Providers>
    {children}
    <ActivityStatus />
  </Providers>
</body>
```

**New structure:**
```tsx
<body>
  <Providers>
    <div className="flex h-screen">
      <NavigationSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
    <ActivityStatus />
  </Providers>
</body>
```

---

## Data Model / Interface Changes

### Type Definitions

```typescript
// NavItem.tsx
interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

// NavigationSidebar.tsx (internal mock data structure)
interface ProjectItem {
  id: string;
  name: string;
}

interface RecentItem {
  id: string;
  name: string;
  type: string;
}
```

### Mock Data

Projects (Tier 3):
```typescript
const mockProjects: ProjectItem[] = [
  { id: '1', name: 'Q1 Roadmap' },
  { id: '2', name: 'Blog Posts' },
];
```

Recent Items (Tier 3):
```typescript
const mockRecentItems: RecentItem[] = [
  { id: '1', name: 'Product Roadmap Prompt', type: 'prompt' },
  { id: '2', name: 'Email Template', type: 'template' },
  { id: '3', name: 'API Documentation', type: 'doc' },
];
```

---

## Verification Approach

### 1. Visual Verification
- [ ] Sidebar renders at exactly 240px width
- [ ] Sidebar is visible on all pages (Dashboard, Workbench, Librarian, Seeds)
- [ ] All three tiers are properly spaced with `justify-between`
- [ ] Logo and user info display correctly in Tier 1
- [ ] Separator line renders between Tier 1 and Tier 2
- [ ] All four navigation links render with correct icons and labels
- [ ] Active route is highlighted with amber left border
- [ ] Hover states work on all interactive elements
- [ ] Projects and Recent sections render with mock data

### 2. Functional Verification
- [ ] Clicking navigation links navigates to correct routes
- [ ] Active state correctly reflects current route
- [ ] Hover states apply and remove smoothly
- [ ] No console errors or warnings
- [ ] Component is responsive to route changes

### 3. Code Quality Verification
Run project linting and type checking:
```bash
npm run lint
npm run type-check
```

### 4. Manual Testing Checklist
1. Navigate to `/` (home/dashboard) - Dashboard link should be active
2. Navigate to `/workbench` - Workbench link should be active
3. Navigate to `/librarian` - Librarian link should be active
4. Navigate to `/seeds` - Seeds link should be active
5. Test hover states on all navigation items
6. Verify sidebar doesn't scroll (fixed height)
7. Verify main content area scrolls independently

---

## Implementation Notes

### Potential Issues & Solutions

**Issue 1: Route Conflicts**
- The app currently uses `/` for the CommandCenter
- **Solution**: Navigate to existing routes or create placeholder pages if routes don't exist

**Issue 2: Existing Sidebar Component**
- There's already a `Sidebar.tsx` for the file tree
- **Solution**: Create `NavigationSidebar.tsx` as a separate component
- Both sidebars may need to coexist (navigation + file tree) in the workbench view

**Issue 3: Layout Overflow**
- Adding a 240px sidebar might cause horizontal overflow
- **Solution**: Use `flex` layout and `overflow-y-auto` on main content area

**Issue 4: Active State Edge Cases**
- Nested routes (e.g., `/workbench/project-1`) should still highlight parent
- **Solution**: Use `pathname.startsWith(href)` for matching instead of strict equality

### Performance Considerations
- Navigation sidebar is persistent (doesn't unmount on route change)
- Use `React.memo` for `NavItem` to prevent unnecessary re-renders
- Active state check runs on every route change (acceptable cost)

---

## Acceptance Criteria

- [x] **AC1**: `NavigationSidebar.tsx` component created with 3-tier layout
- [x] **AC2**: Sidebar is fixed at 240px width and full viewport height
- [x] **AC3**: Tier 1 displays logo (🌳 Dojo Genesis) and user email
- [x] **AC4**: Separator line rendered between Tier 1 and Tier 2
- [x] **AC5**: Tier 2 contains 4 navigation links using `NavItem` component
- [x] **AC6**: `NavItem.tsx` created with hover and active state logic
- [x] **AC7**: Active route highlighted with 3px amber left border
- [x] **AC8**: Tier 3 displays mock Projects and Recent sections
- [x] **AC9**: Sidebar integrated into `app/layout.tsx`
- [x] **AC10**: Main content area is scrollable independently
- [x] **AC11**: Navigation works correctly (clicking links changes route)
- [x] **AC12**: `npm run lint` and `npm run type-check` pass with no errors
- [x] **AC13**: Visual design matches mockups (verified against V0.4.0_MOCKUPS_REFINED.md)

---

## Timeline Estimate

- Component creation: 30 minutes
- Layout integration: 15 minutes
- Testing & refinement: 15 minutes
- **Total**: ~60 minutes
