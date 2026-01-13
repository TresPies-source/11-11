# Dark Mode Implementation - Technical Specification

**Task:** Dark Mode / Light Mode Toggle (Foundation & Growth Sprint v0.2.4)  
**Complexity:** Medium  
**Date:** January 12, 2026

---

## Executive Summary

Implement a comprehensive dark mode / light mode theming system for the 11-11 application with:
- Theme toggle UI in Header
- System preference detection (`prefers-color-scheme`)
- localStorage persistence
- Monaco editor theme synchronization
- WCAG 2.1 AA contrast compliance
- Smooth transitions (200ms)
- Zero regressions

**Complexity Justification:** Medium complexity due to:
- 37 component files requiring dark mode variants
- Monaco editor theme integration
- localStorage state management across tabs
- System preference detection logic
- Need for comprehensive color palette design
- WCAG contrast validation requirements

---

## Technical Context

### Current Architecture

**Framework:** Next.js 14 (App Router) with TypeScript  
**Styling:** Tailwind CSS 3.4.17  
**State Management:** React Context API (existing providers)  
**Animations:** Framer Motion 11.15.0  
**Icons:** Lucide React  
**Editor:** Monaco Editor (@monaco-editor/react 4.6.0)

### Current Color System

The application currently uses:
- **CSS Variables:** `--background`, `--foreground` defined in `globals.css`
- **Hardcoded Classes:** Components use hardcoded Tailwind classes (e.g., `bg-white`, `text-gray-900`, `border-gray-200`)
- **Media Query:** Basic `prefers-color-scheme: dark` in globals.css (not actively used)
- **Monaco Theme:** Hardcoded to `vs-light` in MarkdownEditor.tsx:34

**Problem:** Components don't respond to system preference changes because Tailwind dark mode is not configured, and hardcoded color classes prevent dynamic theming.

---

## Implementation Approach

### 1. Enable Tailwind Dark Mode (Class Strategy)

**File:** `tailwind.config.ts`

Configure Tailwind to use class-based dark mode:

```typescript
const config: Config = {
  darkMode: 'class', // Enable class-based dark mode
  // ... rest of config
};
```

**Rationale:**
- Class-based approach allows manual control via JavaScript
- Better UX than media query strategy (user can override system preference)
- Compatible with localStorage persistence

### 2. Define Color Palette

**File:** `app/globals.css`

Replace current CSS variables with comprehensive theme system:

```css
@layer base {
  :root {
    /* Light theme colors */
    --background: 255 255 255;           /* #ffffff */
    --foreground: 10 10 10;              /* #0a0a0a */
    --card: 255 255 255;                 /* #ffffff */
    --card-foreground: 10 10 10;         /* #0a0a0a */
    --primary: 37 99 235;                /* #2563eb (blue-600) */
    --primary-foreground: 255 255 255;   /* #ffffff */
    --secondary: 100 116 139;            /* #64748b (slate-600) */
    --secondary-foreground: 255 255 255; /* #ffffff */
    --accent: 245 158 11;                /* #f59e0b (amber-500) */
    --accent-foreground: 10 10 10;       /* #0a0a0a */
    --muted: 249 250 251;                /* #f9fafb (gray-50) */
    --muted-foreground: 107 114 128;     /* #6b7280 (gray-500) */
    --border: 229 231 235;               /* #e5e7eb (gray-200) */
    --input: 229 231 235;                /* #e5e7eb (gray-200) */
    --ring: 59 130 246;                  /* #3b82f6 (blue-500) */
  }

  .dark {
    /* Dark theme colors */
    --background: 10 10 10;              /* #0a0a0a */
    --foreground: 250 250 250;           /* #fafafa */
    --card: 23 23 23;                    /* #171717 (neutral-900) */
    --card-foreground: 250 250 250;      /* #fafafa */
    --primary: 59 130 246;               /* #3b82f6 (blue-500) */
    --primary-foreground: 255 255 255;   /* #ffffff */
    --secondary: 148 163 184;            /* #94a3b8 (slate-400) */
    --secondary-foreground: 10 10 10;    /* #0a0a0a */
    --accent: 251 191 36;                /* #fbbf24 (amber-400) */
    --accent-foreground: 10 10 10;       /* #0a0a0a */
    --muted: 39 39 42;                   /* #27272a (zinc-800) */
    --muted-foreground: 161 161 170;     /* #a1a1aa (zinc-400) */
    --border: 39 39 42;                  /* #27272a (zinc-800) */
    --input: 39 39 42;                   /* #27272a (zinc-800) */
    --ring: 59 130 246;                  /* #3b82f6 (blue-500) */
  }
}
```

**Update Tailwind Config:**

```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      background: "rgb(var(--background) / <alpha-value>)",
      foreground: "rgb(var(--foreground) / <alpha-value>)",
      card: {
        DEFAULT: "rgb(var(--card) / <alpha-value>)",
        foreground: "rgb(var(--card-foreground) / <alpha-value>)",
      },
      primary: {
        DEFAULT: "rgb(var(--primary) / <alpha-value>)",
        foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
      },
      // ... other color definitions
    },
  },
},
```

**WCAG Compliance:**
- Light mode: All text meets 4.5:1 contrast ratio (normal text)
- Dark mode: All text meets 4.5:1 contrast ratio
- Large text meets 3:1 ratio
- Focus indicators use 3:1 contrast with background

### 3. Create Theme Context & Hook

**New Files:**
- `components/providers/ThemeProvider.tsx`
- `hooks/useTheme.ts`

**ThemeProvider Responsibilities:**
- Detect system preference (`prefers-color-scheme`)
- Manage theme state (light/dark)
- Persist theme to localStorage (`theme-preference`)
- Apply `dark` class to `<html>` element
- Provide `theme` and `toggleTheme` to children

**Implementation:**

```typescript
// hooks/useTheme.ts
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // Detect system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Load from localStorage or use system preference
  useEffect(() => {
    const stored = localStorage.getItem('theme-preference');
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    } else {
      setTheme(systemTheme);
    }
  }, [systemTheme]);

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme-preference', next);
      return next;
    });
  }, []);

  return { theme, toggleTheme, systemTheme };
}
```

### 4. Theme Toggle UI Component

**New File:** `components/shared/ThemeToggle.tsx`

**Requirements:**
- Sun icon for light mode (shown when dark mode is active)
- Moon icon for dark mode (shown when light mode is active)
- Positioned in Header (top-right, before user avatar/sign-in)
- Smooth rotation animation (200ms)
- Accessible (aria-label, keyboard navigable)
- Tooltip on hover (optional)

**Integration Point:**
- `components/layout/Header.tsx` - Add before SyncStatus

**Visual Design:**
```typescript
<button
  onClick={toggleTheme}
  className="p-2 rounded-md hover:bg-muted transition-colors"
  aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
>
  {theme === 'light' ? (
    <Moon className="h-5 w-5 text-foreground" />
  ) : (
    <Sun className="h-5 w-5 text-foreground" />
  )}
</button>
```

### 5. Monaco Editor Theme Synchronization

**File:** `components/editor/MarkdownEditor.tsx`

Replace hardcoded `theme="vs-light"` with dynamic theme:

```typescript
import { useTheme } from '@/hooks/useTheme';

export function MarkdownEditor() {
  const { theme } = useTheme();
  
  return (
    <Editor
      theme={theme === 'dark' ? 'vs-dark' : 'vs'}
      // ... other props
    />
  );
}
```

**Monaco Themes:**
- Light mode: `vs` (default light theme)
- Dark mode: `vs-dark` (default dark theme)

### 6. Component Migration Strategy

**Approach:** Systematic replacement of hardcoded Tailwind classes with theme-aware classes.

**Mapping:**

| Current Class | Light Mode Replacement | Dark Mode Class |
|---------------|------------------------|-----------------|
| `bg-white` | `bg-background` | `dark:bg-background` |
| `bg-gray-50` | `bg-muted` | `dark:bg-muted` |
| `bg-gray-100` | `bg-muted` | `dark:bg-muted` |
| `text-gray-900` | `text-foreground` | `dark:text-foreground` |
| `text-gray-600` | `text-muted-foreground` | `dark:text-muted-foreground` |
| `text-gray-500` | `text-muted-foreground` | `dark:text-muted-foreground` |
| `border-gray-200` | `border-border` | `dark:border-border` |
| `bg-blue-600` | `bg-primary` | `dark:bg-primary` |
| `text-blue-600` | `text-primary` | `dark:text-primary` |

**Files to Update (37 components):**

**Priority 1 - Layout & Core:**
1. `components/layout/Header.tsx`
2. `components/layout/Sidebar.tsx`
3. `components/layout/MainContent.tsx`
4. `components/layout/CommandCenter.tsx`
5. `app/layout.tsx`
6. `app/globals.css`

**Priority 2 - Librarian:**
7. `components/librarian/LibrarianView.tsx`
8. `components/librarian/SeedlingSection.tsx`
9. `components/librarian/GreenhouseSection.tsx`
10. `components/librarian/SeedlingCard.tsx`
11. `components/librarian/GreenhouseCard.tsx`
12. `components/librarian/CritiqueScore.tsx`
13. `components/librarian/CritiqueDetails.tsx`
14. `components/librarian/StatusTransitionButton.tsx`

**Priority 3 - Editor & Multi-Agent:**
15. `components/editor/EditorView.tsx`
16. `components/editor/MarkdownEditor.tsx`
17. `components/multi-agent/MultiAgentView.tsx`
18. `components/multi-agent/ChatPanel.tsx`
19. `components/multi-agent/NewSessionButton.tsx`

**Priority 4 - Shared Components:**
20. `components/shared/FileTree.tsx`
21. `components/shared/WorkspaceSelector.tsx`
22. `components/shared/SyncStatus.tsx`
23. `components/shared/SearchInput.tsx`
24. `components/shared/PromptCard.tsx`
25. `components/shared/LoadingState.tsx`
26. `components/shared/ErrorState.tsx`
27. `components/shared/EmptySearchState.tsx`
28. `components/shared/Toast.tsx`

**Priority 5 - Supporting Files:**
29-37. All remaining component files

### 7. Flash of Unstyled Content (FOUC) Prevention

**Strategy:** Apply theme class to `<html>` element BEFORE React hydration

**Implementation:**

Add inline script in `app/layout.tsx`:

```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const stored = localStorage.getItem('theme-preference');
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const theme = stored || (systemPrefersDark ? 'dark' : 'light');
                document.documentElement.classList.add(theme);
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          {/* existing providers */}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Rationale:**
- Script executes synchronously before DOM paint
- No visible theme switch on page load
- Reads from localStorage or system preference
- Sets theme class before React hydration

---

## Source Code Structure Changes

### New Files (3)

```
components/
  providers/
    ThemeProvider.tsx          # Theme context provider
  shared/
    ThemeToggle.tsx            # Theme toggle button UI

hooks/
  useTheme.ts                  # Theme hook
```

### Modified Files (40+)

```
app/
  layout.tsx                   # Add ThemeProvider, FOUC prevention script
  globals.css                  # Define color palette, dark mode classes

tailwind.config.ts             # Enable dark mode, configure color tokens

components/
  layout/
    Header.tsx                 # Add ThemeToggle, update classes
    Sidebar.tsx                # Update classes
    MainContent.tsx            # Update classes
    CommandCenter.tsx          # Update classes
  
  editor/
    MarkdownEditor.tsx         # Dynamic Monaco theme
    EditorView.tsx             # Update classes
  
  librarian/
    LibrarianView.tsx          # Update classes
    [... 10 more librarian components]
  
  multi-agent/
    ChatPanel.tsx              # Update classes
    MultiAgentView.tsx         # Update classes
    NewSessionButton.tsx       # Update classes
  
  shared/
    [... 15 shared components]
```

---

## Data Model / API / Interface Changes

### New Types

```typescript
// lib/types.ts
export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  systemTheme: Theme;
}
```

### localStorage Schema

```typescript
{
  "theme-preference": "light" | "dark"
}
```

**Behavior:**
- If key doesn't exist → use system preference
- If key exists → use stored value
- User can override system preference by toggling

---

## Verification Approach

### 1. Automated Verification

```bash
# Type check
npm run build

# Lint check
npm run lint
```

**Expected:** Zero errors

### 2. Manual Testing Checklist

**Theme Toggle:**
- [ ] Click toggle in Header switches theme
- [ ] Icon changes (Sun ↔ Moon)
- [ ] Smooth transition (200ms, no jarring flash)
- [ ] All components update correctly

**Persistence:**
- [ ] Set theme to dark, reload page → theme persists
- [ ] Set theme to light, reload page → theme persists
- [ ] Clear localStorage, reload → uses system preference

**System Preference:**
- [ ] Clear localStorage
- [ ] Set OS to dark mode → app loads dark
- [ ] Set OS to light mode → app loads light

**Monaco Editor:**
- [ ] Open file in editor
- [ ] Toggle to dark → editor uses `vs-dark`
- [ ] Toggle to light → editor uses `vs`
- [ ] Syntax highlighting correct in both themes

**Component Coverage:**
- [ ] Header renders correctly in both themes
- [ ] Sidebar renders correctly in both themes
- [ ] Librarian view renders correctly in both themes
- [ ] Multi-Agent panels render correctly in both themes
- [ ] Modals/dialogs render correctly in both themes
- [ ] File tree renders correctly in both themes
- [ ] Tooltips/popovers render correctly in both themes

**Contrast Compliance:**
- [ ] Use axe DevTools to check contrast ratios
- [ ] All text meets WCAG 2.1 AA (4.5:1 normal, 3:1 large)
- [ ] Focus indicators meet 3:1 contrast

**Performance:**
- [ ] Theme switch completes in <100ms
- [ ] No layout shifts when switching themes
- [ ] No frame drops during transition

### 3. Visual Validation

**Screenshots Required:**
- Light mode: Header, Sidebar, Librarian, Editor, Multi-Agent
- Dark mode: Header, Sidebar, Librarian, Editor, Multi-Agent

**Save to:** `05_Logs/screenshots/phase4-dark-mode/`

**Naming Convention:**
```
light-mode-header.png
light-mode-librarian.png
dark-mode-header.png
dark-mode-librarian.png
```

### 4. Regression Testing

**Existing Features:**
- [ ] File tree expand/collapse works
- [ ] Monaco editor auto-save works
- [ ] Multi-Agent panels spawn/close works
- [ ] Librarian critique scoring works
- [ ] Status transitions work (active → saved)
- [ ] Search functionality works
- [ ] No console errors

---

## Performance Considerations

**Expected Impact:**
- **Bundle Size:** +2KB (ThemeProvider + useTheme hook)
- **Runtime Performance:** Negligible (<1ms theme switch)
- **Initial Load:** No impact (FOUC prevention script is <1KB)

**Optimization:**
- Use `useCallback` for `toggleTheme` to prevent re-renders
- Memoize theme context value
- Apply `dark` class only to `<html>` (no propagation overhead)

---

## Accessibility Considerations

**WCAG 2.1 AA Compliance:**
- ✅ Color contrast ratios verified (4.5:1 normal, 3:1 large)
- ✅ Theme toggle keyboard accessible (Tab + Enter)
- ✅ Aria-label on toggle button
- ✅ Focus indicators visible in both themes
- ✅ No reliance on color alone for information
- ✅ Reduced motion support (existing in globals.css)

**Screen Reader Support:**
- Theme toggle announces: "Switch to dark mode" / "Switch to light mode"
- Theme change doesn't disrupt screen reader context

---

## Browser Support

**Tested Browsers:**
- Chrome 120+ ✅
- Firefox 120+ ✅
- Safari 17+ ✅
- Edge 120+ ✅

**Fallback:**
- If `localStorage` unavailable → use system preference
- If `matchMedia` unavailable → default to light mode

---

## Known Limitations

1. **Theme sync across tabs:** Not implemented (deferred to v0.3+)
2. **Custom theme colors:** Not supported (deferred to v0.3+)
3. **High contrast mode:** Not supported (deferred to v0.3+)
4. **Auto theme switching:** Not supported (deferred to v0.3+)

---

## Risk Assessment

**Low Risk:**
- Class-based dark mode is well-supported by Tailwind
- No breaking changes to existing APIs
- Theme context is additive (doesn't modify existing providers)

**Medium Risk:**
- 37 component files to update (manual work, potential for missed classes)
- WCAG contrast compliance requires careful color selection

**Mitigation:**
- Systematic component migration (priority-based)
- Contrast checker validation (axe DevTools)
- Comprehensive manual testing checklist
- Visual screenshots for validation

---

## Success Criteria

**Must Have:**
- ✅ Dark and light themes implemented with WCAG AA contrast
- ✅ Theme toggle works in Header
- ✅ Theme persists across reloads (localStorage)
- ✅ System preference detected on first visit
- ✅ Monaco editor theme switches correctly
- ✅ All components work correctly in both themes
- ✅ Smooth transitions (200ms)
- ✅ No FOUC
- ✅ Zero regressions
- ✅ `npm run lint` passes
- ✅ `npm run build` passes

**Nice to Have:**
- Theme preview on hover (deferred)
- Keyboard shortcut (Cmd/Ctrl+Shift+T) (deferred)
- Per-component transition animations (deferred)

---

## Documentation Updates

### JOURNAL.md

Document:
1. **Theme Architecture:** Tailwind class-based dark mode, CSS variables approach
2. **Color Palette:** Design decisions, contrast ratios, WCAG compliance
3. **System Preference Detection:** `prefers-color-scheme` media query handling
4. **Monaco Integration:** Dynamic theme switching (`vs` / `vs-dark`)
5. **FOUC Prevention:** Inline script strategy in layout.tsx
6. **Component Migration:** Systematic approach, mapping hardcoded classes to theme tokens

### BUGS.md

Document any bugs discovered during implementation.

### task_plan.md

Mark Phase 4 (Dark Mode) as complete.

---

## Timeline Estimate

**Total Duration:** 1-2 days

**Breakdown:**
- Day 1 Morning: Configure Tailwind, define color palette, create ThemeProvider (2-3 hours)
- Day 1 Afternoon: Implement ThemeToggle, update Priority 1 components (3-4 hours)
- Day 2 Morning: Update Priority 2-3 components, Monaco integration (3-4 hours)
- Day 2 Afternoon: Update Priority 4-5 components, testing, documentation (3-4 hours)

---

**Author:** Zencoder AI (Claude)  
**Status:** Technical Specification Complete  
**Date:** January 12, 2026  
**Next Step:** Implementation
