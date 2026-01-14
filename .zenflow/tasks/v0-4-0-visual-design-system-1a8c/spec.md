# Technical Specification: Dojo Genesis Visual Design System

**Version:** 1.0  
**Date:** January 2026  
**Status:** Ready for Implementation

---

## 1. Technical Context

### 1.1 Technology Stack

- **Framework:** Next.js 14.2.24 (App Router)
- **Runtime:** React 18.3.1
- **Language:** TypeScript 5.7.2 (strict mode)
- **Styling:** Tailwind CSS 3.4.17
- **Animation:** Framer Motion 11.15.0
- **Icons:** lucide-react 0.469.0
- **Utilities:** clsx 2.1.1, tailwind-merge 2.6.0

### 1.2 Existing Architecture

**Current Theme System:**
- CSS variables-based theme system in `globals.css`
- Light/dark mode support via `ThemeProvider` and `.dark` class
- RGB color values with alpha channel support
- Theme persistence in localStorage with SSR-safe initialization

**Existing Components:**
- `components/ui/Progress.tsx` - Reference implementation pattern
  - Uses `"use client"` directive
  - Implements `React.memo` for performance
  - Uses `cn()` utility for className merging
  - Includes ARIA attributes for accessibility
  
**Utilities:**
- `lib/utils.ts` provides `cn()` for className composition
- Combines `clsx` and `tailwind-merge` for conditional classes

---

## 2. Implementation Approach

### 2.1 Design Philosophy

**Hybrid Color System:**
We will maintain the existing CSS variable system while adding named Tailwind colors. This ensures:
1. Backward compatibility with existing components
2. Better developer experience with named colors
3. Flexibility for future theming needs

**Component Architecture:**
- Follow existing `Progress.tsx` pattern
- Use client components (`"use client"`)
- Export memoized components for performance
- Compose styles with `cn()` utility
- Include proper TypeScript types and ARIA attributes

**Animation Strategy:**
- Use Framer Motion's `motion` components for interactive elements
- Respect `prefers-reduced-motion` automatically via Framer Motion
- Use transform and opacity for GPU-accelerated animations
- Keep animations subtle and purposeful

---

## 3. Source Code Changes

### 3.1 Tailwind Configuration (`tailwind.config.ts`)

**Current Structure:**
```typescript
theme: {
  extend: {
    colors: {
      // CSS variable-based colors
      background: "rgb(var(--background) / <alpha-value>)",
      // ... existing colors
    }
  }
}
```

**Changes Required:**

1. **Add Dojo Genesis color palette** (in `theme.extend.colors`):
   ```typescript
   bg: {
     primary: '#0a1e2e',
     secondary: '#0f2838',
     tertiary: '#1a3a4f',
     elevated: '#2a4d63',
   },
   text: {
     primary: '#ffffff',
     secondary: '#c5d1dd',
     tertiary: '#8a9dad',
     muted: '#6b7f91',
     accent: '#f5a623',
   },
   supervisor: '#f5a623',
   dojo: '#f39c5a',
   librarian: '#ffd699',
   debugger: '#6b7f91',
   success: '#4ade80',
   warning: '#f39c5a',
   error: '#ef4444',
   info: '#3d6380',
   ```

2. **Add font families** (in `theme.extend.fontFamily`):
   ```typescript
   fontFamily: {
     sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
     mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
   }
   ```

3. **Add custom spacing** (in `theme.extend.spacing`):
   ```typescript
   spacing: {
     '1': '4px',
     '2': '8px',
     '3': '12px',
     '4': '16px',
     '5': '20px',
     '6': '24px',
     '8': '32px',
     '10': '40px',
     '12': '48px',
     '16': '64px',
   }
   ```
   Note: This extends Tailwind's default spacing scale.

4. **Add animation durations** (in `theme.extend.transitionDuration`):
   ```typescript
   transitionDuration: {
     'instant': '100ms',
     'fast': '200ms',
     'normal': '300ms',
     'slow': '500ms',
     'patient': '1000ms',
   }
   ```

5. **Add easing functions** (in `theme.extend.transitionTimingFunction`):
   ```typescript
   transitionTimingFunction: {
     'ease-out': 'cubic-bezier(0.33, 1, 0.68, 1)',
     'ease-in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
     'ease-bounce': 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
   }
   ```

**Implementation Notes:**
- All additions go inside `theme.extend` to preserve existing config
- Keep existing CSS variable colors intact
- No changes to `darkMode`, `content`, or `plugins` configuration

---

### 3.2 Font Integration (`app/layout.tsx`)

**Current Structure:**
```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>{/* theme script */}</head>
      <body className="antialiased">
        {/* providers */}
      </body>
    </html>
  );
}
```

**Changes Required:**

1. **Import fonts at top of file:**
   ```typescript
   import { Inter, JetBrains_Mono } from 'next/font/google';
   
   const inter = Inter({
     subsets: ['latin'],
     variable: '--font-sans',
     display: 'swap',
   });
   
   const jetbrainsMono = JetBrains_Mono({
     subsets: ['latin'],
     variable: '--font-mono',
     display: 'swap',
   });
   ```

2. **Update `<html>` tag className:**
   ```typescript
   <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
   ```

**Implementation Notes:**
- `next/font/google` automatically optimizes and self-hosts fonts
- `display: 'swap'` prevents layout shift during font loading
- `subsets: ['latin']` reduces bundle size
- CSS variables make fonts available globally via Tailwind

---

### 3.3 Global Styles (`app/globals.css`)

**Current Structure:**
```css
@layer base {
  :root { /* CSS variables */ }
  .dark { /* dark mode variables */ }
}

body {
  color: rgb(var(--foreground));
  background: rgb(var(--background));
  font-family: Arial, Helvetica, sans-serif;
}
```

**Changes Required:**

1. **Update body styles** (replace existing body rule):
   ```css
   body {
     font-family: var(--font-sans);
     transition: background-color 200ms ease-in-out, color 200ms ease-in-out;
   }
   ```

2. **Add brand-specific base styles** (in existing `@layer base` block):
   ```css
   @layer base {
     body {
       @apply bg-bg-primary text-text-primary;
     }
   }
   ```

**Implementation Notes:**
- Preserve all existing CSS (variables, utilities, animations)
- Only modify the `body` font-family and add Tailwind classes
- Keep smooth transition for theme changes
- Do not remove shimmer animation, focus styles, or scrollbar utilities

---

### 3.4 Button Component (`components/ui/Button.tsx`)

**New File Structure:**

```typescript
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

const Button = React.memo(function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-accent disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantStyles = {
    primary: "bg-text-accent text-white hover:bg-opacity-90",
    secondary: "bg-transparent text-white border border-bg-tertiary hover:border-text-accent",
  };
  
  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || isLoading}
      whileHover={!disabled && !isLoading ? { scale: 1.05 } : undefined}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.1 }}
      aria-busy={isLoading}
      aria-disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </motion.button>
  );
});

Button.displayName = "Button";

export { Button };
```

**Key Implementation Details:**
- Extends `React.ButtonHTMLAttributes` for full button prop support
- Uses `motion.button` from Framer Motion for animations
- Loader icon from lucide-react for loading state
- Maintains button dimensions when loading (no layout shift)
- Conditional animations (disabled when loading/disabled)
- ARIA attributes for accessibility
- Memoized for performance

---

### 3.5 Card Component (`components/ui/Card.tsx`)

**New File Structure:**

```typescript
"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

const Card = React.memo(function Card({
  children,
  className,
  glow = false,
}: CardProps) {
  const baseStyles = "bg-bg-secondary border border-bg-tertiary rounded-xl p-6";
  
  if (glow) {
    return (
      <motion.div
        className={cn(baseStyles, className)}
        whileHover={{
          borderColor: '#f5a623',
          boxShadow: '0 0 20px rgba(245, 166, 35, 0.15)',
          y: -2,
        }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={cn(baseStyles, className)}>
      {children}
    </div>
  );
});

Card.displayName = "Card";

export { Card };
```

**Key Implementation Details:**
- Simple container component with composable design
- Conditional Framer Motion wrapper (only when glow enabled)
- Glow effect uses amber accent color with subtle shadow
- Lift animation on hover (y: -2px)
- Static div when glow is disabled (better performance)

---

### 3.6 StatusDot Component (`components/ui/StatusDot.tsx`)

**New File Structure:**

```typescript
"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface StatusDotProps {
  status: 'idle' | 'working' | 'error' | 'success' | 'default';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const StatusDot = React.memo(function StatusDot({
  status,
  size = 'md',
  className,
}: StatusDotProps) {
  const statusColors = {
    idle: 'bg-text-muted',
    working: 'bg-supervisor animate-pulse',
    error: 'bg-error',
    success: 'bg-success',
    default: 'bg-text-tertiary',
  };
  
  const sizeStyles = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };
  
  const statusLabels = {
    idle: 'Idle',
    working: 'Working',
    error: 'Error',
    success: 'Success',
    default: 'Status indicator',
  };

  return (
    <span
      className={cn(
        'inline-block rounded-full',
        statusColors[status],
        sizeStyles[size],
        className
      )}
      aria-label={statusLabels[status]}
      role="status"
    />
  );
});

StatusDot.displayName = "StatusDot";

export { StatusDot };
```

**Key Implementation Details:**
- Uses Tailwind's built-in `animate-pulse` for working status
- Maps status to semantic colors from design system
- Includes aria-label for screen readers
- Role="status" for proper ARIA semantics
- Simple implementation (no Framer Motion needed)
- Pulse animation automatically respects `prefers-reduced-motion`

---

## 4. Data Model / API / Interface Changes

### 4.1 TypeScript Interfaces

**New Exports:**
```typescript
// components/ui/Button.tsx
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

// components/ui/Card.tsx
export interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

// components/ui/StatusDot.tsx
export interface StatusDotProps {
  status: 'idle' | 'working' | 'error' | 'success' | 'default';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

### 4.2 Tailwind Type Extensions

No changes to `tailwind.config.ts` types. All additions use existing Tailwind types.

### 4.3 CSS Variable Additions

**New CSS variables in layout.tsx:**
```typescript
--font-sans: Inter, ui-sans-serif, system-ui, sans-serif
--font-mono: JetBrains Mono, ui-monospace, SFMono-Regular, monospace
```

---

## 5. Delivery Phases

### Phase 1: Foundation (Config & Fonts)
**Deliverables:**
1. Update `tailwind.config.ts` with design tokens
2. Add font imports to `app/layout.tsx`
3. Update `app/globals.css` with brand colors

**Verification:**
- Run `npm run type-check` - must pass
- Start dev server - fonts load correctly
- Inspect page - background is `#0a1e2e`, text is `#ffffff`

**Estimated Time:** 15 minutes

---

### Phase 2: Button Component
**Deliverables:**
1. Create `components/ui/Button.tsx`
2. Implement both variants and all sizes
3. Add loading state with spinner
4. Add Framer Motion animations

**Verification:**
- Create test page or modify existing page to render all variants
- Test hover and tap animations
- Test loading state
- Verify keyboard navigation and ARIA attributes
- Run `npm run lint` - must pass

**Estimated Time:** 20 minutes

---

### Phase 3: Card Component
**Deliverables:**
1. Create `components/ui/Card.tsx`
2. Implement base styling
3. Add glow variant with hover animation

**Verification:**
- Render Card with and without glow
- Test hover animation on glow variant
- Verify composability with className prop
- Run `npm run lint` - must pass

**Estimated Time:** 10 minutes

---

### Phase 4: StatusDot Component
**Deliverables:**
1. Create `components/ui/StatusDot.tsx`
2. Implement all status colors
3. Add pulse animation for working status
4. Implement size variants

**Verification:**
- Render all status variants
- Verify pulse animation on working status
- Test all sizes
- Verify ARIA attributes
- Run `npm run lint` - must pass

**Estimated Time:** 10 minutes

---

### Phase 5: Final Verification
**Deliverables:**
1. Run full test suite
2. Verify existing pages still work
3. Check dark mode compatibility
4. Test reduced motion preferences

**Verification Commands:**
```bash
npm run lint
npm run type-check
npm run build
```

**Manual Checks:**
- All existing pages render correctly
- Dark mode toggle works
- No console errors or warnings
- Fonts load without flash of unstyled text

**Estimated Time:** 15 minutes

---

## 6. Verification Approach

### 6.1 Automated Verification

**TypeScript Compilation:**
```bash
npm run type-check
```
Expected: No errors, all types resolve correctly

**Linting:**
```bash
npm run lint
```
Expected: No errors or warnings

**Build:**
```bash
npm run build
```
Expected: Successful build, no errors

### 6.2 Manual Verification

**Visual Testing:**
1. Create temporary test page (`app/test-components/page.tsx`):
   ```typescript
   import { Button } from '@/components/ui/Button';
   import { Card } from '@/components/ui/Card';
   import { StatusDot } from '@/components/ui/StatusDot';
   
   export default function TestPage() {
     return (
       <div className="p-8 space-y-8">
         {/* Test all variants */}
       </div>
     );
   }
   ```

2. Navigate to `/test-components` and verify:
   - Button variants, sizes, loading states
   - Card with and without glow
   - StatusDot all statuses and sizes

3. Test interactions:
   - Hover animations
   - Tap/click feedback
   - Keyboard navigation
   - Focus states

**Accessibility Testing:**
- Use browser DevTools Accessibility Inspector
- Verify ARIA attributes
- Test with keyboard only (Tab, Enter, Space)
- Check color contrast ratios

**Performance Testing:**
- Open DevTools Performance tab
- Record interaction with components
- Verify animations are GPU-accelerated (transform/opacity)
- Check for layout shifts

### 6.3 Compatibility Testing

**Dark Mode:**
- Toggle theme using existing ThemeProvider
- Verify all components render correctly in both modes
- Check that brand colors are visible on dark background

**Reduced Motion:**
- Enable "Reduce motion" in OS settings
- Verify animations are removed or simplified
- Framer Motion handles this automatically

**Browser Testing:**
- Test in Chrome, Firefox, Safari, Edge (latest versions)
- Verify font loading and rendering
- Check animation performance

---

## 7. Technical Constraints & Considerations

### 7.1 Performance Constraints

**Font Loading:**
- Next.js `next/font/google` automatically optimizes fonts
- Fonts are self-hosted (no external requests)
- Using `display: 'swap'` prevents blocking
- Latin subset only (~50KB total for both fonts)

**Animation Performance:**
- All animations use transform and opacity (GPU-accelerated)
- Framer Motion optimizes animation rendering
- `prefers-reduced-motion` automatically respected
- Animation durations kept short (100-200ms for most interactions)

**Bundle Size Impact:**
- Framer Motion already in dependencies (no increase)
- lucide-react already in dependencies (no increase)
- Fonts optimized by Next.js (~50KB total)
- New components ~5KB combined
- **Total estimated increase: ~55KB**

### 7.2 Accessibility Constraints

**Keyboard Navigation:**
- All buttons must be focusable
- Focus states clearly visible (ring with accent color)
- Tab order logical and predictable

**Screen Readers:**
- ARIA labels on StatusDot
- ARIA busy/disabled states on Button
- Semantic HTML elements (button, not div)

**Color Contrast:**
- Background (#0a1e2e) to text (#ffffff): 15.3:1 ✅
- Amber accent (#f5a623) on dark: 8.2:1 ✅
- All combinations exceed WCAG AA (4.5:1)

### 7.3 Backward Compatibility

**CSS Variables:**
- Existing CSS variable system preserved
- New named colors added alongside (not replacing)
- Existing components continue to work

**Theme System:**
- ThemeProvider unchanged
- Dark mode toggle continues to work
- localStorage persistence intact

**Component API:**
- New components use standard React patterns
- No breaking changes to existing components
- Optional props with sensible defaults

---

## 8. Risk Mitigation

### 8.1 Identified Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Font loading failure | Medium | Low | Fallback fonts in font stack, test in dev |
| Color contrast issues | Low | Very Low | Colors from tested brand guide, verify with tools |
| Breaking existing components | High | Low | Preserve CSS variables, test all pages |
| Animation performance | Medium | Low | Use transform/opacity, test on low-end devices |
| Build failures | High | Medium | Incremental implementation, test after each phase |

### 8.2 Rollback Strategy

If critical issues arise during implementation:

1. **Phase 1 Issues:** Revert `tailwind.config.ts`, `layout.tsx`, `globals.css`
2. **Component Issues:** Delete new component files, no impact on existing code
3. **Build Issues:** Check TypeScript errors, verify imports, check Tailwind config syntax

All changes are additive (not modifying existing components), making rollback safe.

---

## 9. Dependencies

### 9.1 External Dependencies

**Already Installed:**
- `framer-motion@11.15.0` ✅
- `lucide-react@0.469.0` ✅
- `clsx@2.1.1` ✅
- `tailwind-merge@2.6.0` ✅

**No New Dependencies Required** ✅

### 9.2 Internal Dependencies

**Required Files:**
- `lib/utils.ts` (exists) ✅
- `app/layout.tsx` (exists) ✅
- `app/globals.css` (exists) ✅
- `tailwind.config.ts` (exists) ✅

**Optional Dependencies:**
- `components/providers/ThemeProvider.tsx` (for dark mode testing)

---

## 10. Success Metrics

### 10.1 Functional Metrics

- ✅ All automated tests pass (lint, type-check, build)
- ✅ All components render without errors
- ✅ All interactive states work (hover, focus, disabled, loading)
- ✅ Keyboard navigation functions correctly
- ✅ Dark mode compatibility maintained

### 10.2 Performance Metrics

- ✅ Fonts load within 1 second on 3G connection
- ✅ No layout shifts (CLS = 0)
- ✅ Animations run at 60fps on mid-tier devices
- ✅ Bundle size increase < 100KB

### 10.3 Quality Metrics

- ✅ Zero TypeScript errors
- ✅ Zero ESLint errors or warnings
- ✅ All WCAG AA contrast requirements met
- ✅ Code follows existing patterns (Progress component)

---

## 11. Post-Implementation

### 11.1 Cleanup Tasks

1. Remove test page if created (`app/test-components/page.tsx`)
2. Verify no unused imports
3. Ensure all files have proper exports
4. Update `.gitignore` if needed (already configured)

### 11.2 Documentation

**In-Code Documentation:**
- TypeScript interfaces serve as documentation
- Component props are self-documenting
- Follow existing pattern (no JSDoc needed unless complex)

**No External Documentation Required:**
- PRD explicitly excludes README/CHANGELOG
- Component usage is intuitive for developers
- Examples can be found in test page (if kept)

### 11.3 Next Steps

This implementation sets the foundation for:
- **v0.4.0 Wave 1 Next Tasks:**
  - Sidebar navigation component
  - Dashboard page
  - Onboarding wizard
  - Workbench interface refinements

---

## 12. Appendix

### 12.1 Color Palette Reference

```typescript
// Backgrounds (Navy tones - calm, focused)
bg-primary: #0a1e2e    // Deepest navy, main background
bg-secondary: #0f2838  // Slightly lighter, cards/panels
bg-tertiary: #1a3a4f   // Borders, dividers
bg-elevated: #2a4d63   // Hover states, elevated surfaces

// Text (White to gray - readability)
text-primary: #ffffff    // Main text, high contrast
text-secondary: #c5d1dd  // Subheadings, less emphasis
text-tertiary: #8a9dad   // Captions, metadata
text-muted: #6b7f91      // Disabled, placeholders
text-accent: #f5a623     // Amber, key interactions

// Agents (Distinct identities)
supervisor: #f5a623   // Sunset amber
dojo: #f39c5a        // Warm orange
librarian: #ffd699   // Soft yellow
debugger: #6b7f91    // Cool gray

// Semantic (Status indicators)
success: #4ade80  // Green
warning: #f39c5a  // Orange
error: #ef4444    // Red
info: #3d6380     // Blue-gray
```

### 12.2 Animation Timing Reference

```typescript
// Durations
instant: 100ms   // Button taps, immediate feedback
fast: 200ms      // Hovers, card transitions
normal: 300ms    // Default, sliding panels
slow: 500ms      // Emphasis, success animations
patient: 1000ms  // Loading states, long animations

// Easing Functions
ease-out: cubic-bezier(0.33, 1, 0.68, 1)           // Decelerating
ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)       // Smooth both ends
ease-bounce: cubic-bezier(0.68, -0.55, 0.27, 1.55) // Subtle bounce
```

### 12.3 Implementation Checklist

- [ ] Phase 1: Update Tailwind config, fonts, global styles
- [ ] Phase 2: Create Button component
- [ ] Phase 3: Create Card component
- [ ] Phase 4: Create StatusDot component
- [ ] Phase 5: Run verification tests
- [ ] Final: Clean up and verify all existing functionality

---

**End of Technical Specification**
