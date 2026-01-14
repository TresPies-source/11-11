# Product Requirements Document: Dojo Genesis Visual Design System

**Version:** 1.0  
**Date:** January 2026  
**Status:** Ready for Implementation

---

## 1. Executive Summary

This PRD defines the requirements for implementing the foundational Visual Design System for Dojo Genesis v0.4.0. This is the first step in the UI Unification & Polish release and establishes the complete brand identity, design tokens, typography, and base UI components that will be used throughout the application.

**Key Deliverables:**
1. Updated Tailwind configuration with Dojo Genesis design tokens
2. Font integration (Inter and JetBrains Mono)
3. Global styles matching brand guidelines
4. Three essential UI components: Button, Card, and StatusDot

---

## 2. Background & Context

### 2.1 Current State

The application currently uses:
- Basic Tailwind configuration with CSS variables for theming
- Generic font stack (Arial, Helvetica, sans-serif)
- Light/dark mode toggle support
- Minimal UI component library (only Progress component exists)
- Framer Motion already installed for animations

### 2.2 Brand Foundation

The Dojo Genesis brand is built around the concept of "Sustainable Intelligence" with these core values:
- **Calm, not cluttered:** Focus and well-being over feature bloat
- **Sustainable, not frantic:** Paced, thoughtful approach to creation
- **Premium & polished:** Subtle animations, crisp typography, smooth transitions
- **Transparent & trustworthy:** Clear visual feedback and status indicators

The brand visual identity is derived from the Bonsai Sunset logo:
- **Deep navy backgrounds:** Calm, focused environment
- **Sunset amber accents:** Warmth, new beginnings, key interactions
- **Mountain grays:** Readability, stability
- **Agent colors:** Distinct but harmonious identity for each AI agent

---

## 3. Goals & Success Criteria

### 3.1 Goals

1. **Establish Design Foundation:** Create a complete, brand-aligned design system that can scale
2. **Ensure Visual Consistency:** All colors, fonts, and spacing follow the brand guide
3. **Enable Component Reusability:** Build modular, composable UI components
4. **Maintain Performance:** Ensure fonts and animations are optimized
5. **Preserve Compatibility:** All existing functionality remains intact

### 3.2 Success Criteria

- ✅ Tailwind config includes all Dojo Genesis design tokens (colors, fonts, spacing, timing)
- ✅ Inter and JetBrains Mono fonts load correctly and are applied globally
- ✅ Application background and text colors match brand specifications
- ✅ Button, Card, and StatusDot components are functional and styled per mockups
- ✅ All components use Framer Motion for animations
- ✅ Code follows existing project conventions and patterns
- ✅ All existing tests pass (npm run lint, npm run type-check)

---

## 4. Functional Requirements

### 4.1 Tailwind Configuration Updates

**File:** `tailwind.config.ts`

**Requirements:**

1. **Colors** - Extend theme with complete Dojo Genesis color palette:
   - **Backgrounds:** `bg-primary`, `bg-secondary`, `bg-tertiary`, `bg-elevated`
   - **Text:** `text-primary`, `text-secondary`, `text-tertiary`, `text-muted`, `text-accent`
   - **Agents:** `supervisor`, `dojo`, `librarian`, `debugger`
   - **Semantic:** `success`, `warning`, `error`, `info`

2. **Typography** - Add font families:
   - `sans`: Inter with fallbacks
   - `mono`: JetBrains Mono with fallbacks

3. **Spacing** - Add custom spacing scale:
   - Values: 1 (4px), 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px), 8 (32px), 10 (40px), 12 (48px), 16 (64px)

4. **Animation Timing** - Add duration values:
   - `instant` (100ms), `fast` (200ms), `normal` (300ms), `slow` (500ms), `patient` (1000ms)

5. **Easing Functions** - Add timing functions:
   - `ease-out`, `ease-in-out`, `ease-bounce`

**Constraints:**
- Must extend existing theme, not replace it
- Must maintain compatibility with existing CSS variable system
- Must preserve dark mode functionality

---

### 4.2 Font Integration

**File:** `app/layout.tsx`

**Requirements:**

1. Import Inter and JetBrains Mono using `next/font/google`
2. Configure with:
   - `subsets: ['latin']`
   - CSS variables: `--font-sans` and `--font-mono`
3. Apply font variables to `<html>` tag className
4. Fonts must be self-hosted by Next.js (automatic with next/font)

**Performance Criteria:**
- Fonts should use font-display: swap for optimal loading
- No layout shift during font loading
- Subset to Latin characters only to reduce bundle size

---

### 4.3 Global Styles

**File:** `app/globals.css`

**Requirements:**

1. Apply brand colors to body:
   - Background: `bg-bg-primary`
   - Text: `text-text-primary`
   - Font family: `var(--font-sans)`

2. Must preserve existing:
   - Tailwind directives (@tailwind base, components, utilities)
   - CSS variable definitions for light/dark mode
   - Utility classes (shimmer animation, focus states, scrollbar styles)
   - Smooth color transition on theme change

**Constraints:**
- Do not remove existing CSS variable definitions
- Maintain accessibility features (focus-visible styles)
- Preserve animation performance optimizations

---

### 4.4 Button Component

**File:** `components/ui/Button.tsx`

**Requirements:**

1. **Props:**
   ```typescript
   interface ButtonProps {
     variant: 'primary' | 'secondary';
     size: 'sm' | 'md' | 'lg';
     isLoading?: boolean;
     disabled?: boolean;
     children: React.ReactNode;
     onClick?: () => void;
     type?: 'button' | 'submit' | 'reset';
     className?: string;
   }
   ```

2. **Variant Styles:**
   - **Primary:** Amber background (`bg-text-accent`), white text, hover glow
   - **Secondary:** Transparent background, white text, border (`border-bg-tertiary`), hover amber border

3. **Size Styles:**
   - **sm:** padding 8px 16px, text 14px
   - **md:** padding 12px 24px, text 16px
   - **lg:** padding 16px 32px, text 18px

4. **Animations (Framer Motion):**
   - `whileHover={{ scale: 1.05 }}`
   - `whileTap={{ scale: 0.98 }}`
   - Transition duration: 100ms (instant)

5. **Loading State:**
   - Show spinner icon (use simple CSS or lucide-react icon)
   - Disable button interaction
   - Maintain button dimensions (no layout shift)

6. **Accessibility:**
   - Proper ARIA attributes when disabled/loading
   - Keyboard navigation support
   - Clear focus states

---

### 4.5 Card Component

**File:** `components/ui/Card.tsx`

**Requirements:**

1. **Props:**
   ```typescript
   interface CardProps {
     children: React.ReactNode;
     className?: string;
     glow?: boolean;
   }
   ```

2. **Base Styles:**
   - Background: `bg-bg-secondary`
   - Border: 1px solid `bg-tertiary`
   - Border radius: 12px (rounded-xl)
   - Padding: 24px (p-6)

3. **Glow Variant:**
   - When `glow={true}`:
   - Hover state adds subtle amber border glow
   - Slight lift animation (translateY: -2px)
   - Smooth transition (200ms fast)

4. **Composition:**
   - Must support className prop for additional styling
   - Must allow any children content
   - Must use Framer Motion for hover animations

---

### 4.6 StatusDot Component

**File:** `components/ui/StatusDot.tsx`

**Requirements:**

1. **Props:**
   ```typescript
   interface StatusDotProps {
     status: 'idle' | 'working' | 'error' | 'success' | 'default';
     size?: 'sm' | 'md' | 'lg';
     className?: string;
   }
   ```

2. **Status Colors:**
   - `idle`: `bg-gray-500` (or `bg-text-muted`)
   - `working`: `bg-supervisor` (amber) with pulse animation
   - `error`: `bg-error`
   - `success`: `bg-success`
   - `default`: `bg-text-tertiary`

3. **Size Styles:**
   - **sm:** 6px diameter
   - **md:** 8px diameter (default)
   - **lg:** 12px diameter

4. **Pulse Animation:**
   - Only for `working` status
   - Use CSS keyframes or Framer Motion
   - Subtle, continuous pulse (opacity 0.5 to 1)
   - Duration: 1.5s, infinite loop

5. **Accessibility:**
   - Include aria-label describing status
   - Consider screen reader announcements for status changes

---

## 5. Non-Functional Requirements

### 5.1 Performance

- Font loading must not block rendering (font-display: swap)
- Animations must use transform and opacity (GPU accelerated)
- No layout shifts during component mounting
- Bundle size increase < 50KB (fonts are auto-optimized by Next.js)

### 5.2 Accessibility

- All interactive components must be keyboard navigable
- Color contrast ratios must meet WCAG AA standards (4.5:1 for text)
- Focus states must be clearly visible
- Status indicators must have text alternatives

### 5.3 Browser Compatibility

- Support latest 2 versions of Chrome, Firefox, Safari, Edge
- Graceful degradation for reduced-motion preferences
- Dark mode must work correctly

### 5.4 Code Quality

- TypeScript strict mode compliance
- No ESLint errors
- Component props fully typed
- Consistent code style with existing components

---

## 6. Technical Constraints

### 6.1 Technology Stack

- Next.js 14.2.24
- React 18.3.1
- Tailwind CSS 3.4.17
- Framer Motion 11.15.0
- TypeScript 5.7.2

### 6.2 Existing Conventions

- Use existing utility functions from `lib/utils.ts` (e.g., `cn` for className merging)
- Follow existing component structure (see `components/ui/Progress.tsx`)
- Use lucide-react for icons if needed
- Use `clsx` or `tailwind-merge` for conditional classes

### 6.3 File Structure

```
components/ui/
├── Button.tsx       (NEW)
├── Card.tsx         (NEW)
├── StatusDot.tsx    (NEW)
└── Progress.tsx     (existing)
```

---

## 7. Design Specifications

### 7.1 Color Values (from Brand Guide)

**Exact hex values to use:**

```
Backgrounds:
- bg-primary: #0a1e2e
- bg-secondary: #0f2838
- bg-tertiary: #1a3a4f
- bg-elevated: #2a4d63

Text:
- text-primary: #ffffff
- text-secondary: #c5d1dd
- text-tertiary: #8a9dad
- text-muted: #6b7f91
- text-accent: #f5a623

Agents:
- supervisor: #f5a623
- dojo: #f39c5a
- librarian: #ffd699
- debugger: #6b7f91

Semantic:
- success: #4ade80
- warning: #f39c5a
- error: #ef4444
- info: #3d6380
```

### 7.2 Animation Specifications

**Timing:**
- Instant: 100ms (tap feedback, hovers)
- Fast: 200ms (page transitions, fades)
- Normal: 300ms (sliding panels)
- Slow: 500ms (success animations)
- Patient: 1000ms (loading states)

**Easing:**
- ease-out: `cubic-bezier(0.33, 1, 0.68, 1)` - Decelerating
- ease-in-out: `cubic-bezier(0.65, 0, 0.35, 1)` - Smooth both ends
- ease-bounce: `cubic-bezier(0.68, -0.55, 0.27, 1.55)` - Subtle bounce

---

## 8. Implementation Notes

### 8.1 Order of Implementation

1. Update `tailwind.config.ts` (foundation)
2. Add fonts to `app/layout.tsx`
3. Update `app/globals.css`
4. Create Button component
5. Create Card component
6. Create StatusDot component
7. Test all components
8. Run lint and type-check

### 8.2 Testing Strategy

**Manual Testing:**
- Visual inspection against mockups
- Test all component variants and states
- Verify animations are smooth
- Check dark mode compatibility
- Test keyboard navigation

**Automated Testing:**
- Run `npm run lint`
- Run `npm run type-check`
- Ensure no TypeScript errors
- Ensure no ESLint warnings

### 8.3 Edge Cases

1. **Long button text:** Button should not break layout
2. **Missing children:** Components should handle empty children gracefully
3. **Rapid status changes:** StatusDot animation should not stutter
4. **Reduced motion:** Respect prefers-reduced-motion media query
5. **Font loading failure:** Fallback fonts must be readable

---

## 9. Out of Scope

The following are explicitly NOT part of this task:
- Sidebar navigation component
- Dashboard page
- Onboarding wizard
- Workbench interface
- Integration with existing pages
- Data fetching or state management
- Additional UI components beyond Button, Card, StatusDot
- Documentation files (README, CHANGELOG)

These items are planned for subsequent tasks in the v0.4.0 roadmap.

---

## 10. Assumptions & Decisions

### 10.1 Assumptions

1. The existing CSS variable system for light/dark mode will be preserved alongside the new color tokens
2. Framer Motion is already installed and working correctly
3. The application will primarily use dark mode (brand colors are optimized for dark backgrounds)
4. The existing font loading infrastructure in Next.js is functioning properly

### 10.2 Decisions Made

1. **Font Loading:** Use `next/font/google` for automatic optimization and self-hosting
2. **Color System:** Extend Tailwind theme with named colors (not CSS variables) for better DX
3. **Component API:** Keep props minimal and composable for maximum flexibility
4. **Animation Library:** Use Framer Motion for all interactive animations (already in use)
5. **Icon Library:** Use lucide-react for consistency (already in dependencies)

### 10.3 Open Questions

None - all requirements are clearly specified in the Tech Spec and Brand Guide.

---

## 11. Dependencies & Risks

### 11.1 Dependencies

- Tech Spec document (`02_Specs/V0.4.0_WAVE1_TECH_SPEC.md`)
- Brand Guide document (`00_Roadmap/DOJO_GENESIS_BRAND_GUIDE.md`)
- Mockups document (`00_Roadmap/V0.4.0_MOCKUPS_REFINED.md`)

### 11.2 Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Font loading performance | Medium | Use next/font optimization, subset to Latin |
| Color contrast issues | Low | Colors are from tested brand guide |
| Breaking existing components | Medium | Preserve CSS variables, extend don't replace |
| Animation performance | Low | Use transform/opacity, respect reduced motion |

---

## 12. Acceptance Checklist

- [ ] Tailwind config includes all colors, fonts, spacing, and timing from spec
- [ ] Inter font loads and displays correctly
- [ ] JetBrains Mono font loads and displays correctly
- [ ] Body has correct background and text colors
- [ ] Button component supports both variants (primary, secondary)
- [ ] Button component supports all sizes (sm, md, lg)
- [ ] Button component has working loading state
- [ ] Button component has smooth hover/tap animations
- [ ] Card component renders with correct styling
- [ ] Card component glow variant works on hover
- [ ] StatusDot component shows all status colors correctly
- [ ] StatusDot working status has pulse animation
- [ ] StatusDot respects size prop
- [ ] All components are TypeScript strict compliant
- [ ] No ESLint errors or warnings
- [ ] Type check passes (npm run type-check)
- [ ] No visual regressions in existing pages
- [ ] Dark mode still functions correctly
- [ ] Reduced motion preferences are respected

---

**End of PRD**
