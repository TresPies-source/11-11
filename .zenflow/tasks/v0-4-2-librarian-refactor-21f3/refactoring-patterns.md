# Librarian Refactoring Patterns

**Version:** 1.0  
**Date:** January 14, 2026

---

## Overview

This document provides standardized patterns for refactoring Librarian components to align with the Dojo Genesis design system. These patterns preserve all existing functionality while updating the presentation layer.

---

## 1. Component File Structure

All refactored components should follow this pattern:

```typescript
"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
// ... other imports

// Keep existing interfaces unchanged
interface ComponentProps {
  // ... existing props
}

const Component = React.memo(function Component({
  // ... props
}: ComponentProps) {
  // Keep all existing hooks and state logic
  
  return (
    // Update JSX structure only
  );
});

Component.displayName = "Component";

export { Component };
```

---

## 2. Global Color Replacements

Replace all hardcoded colors with design system tokens:

### Background Colors
```typescript
// OLD → NEW
"from-green-50" → "bg-bg-secondary"
"to-green-100" → "bg-bg-secondary"
"from-pink-50" → "bg-bg-tertiary"
"to-purple-100" → "bg-bg-tertiary"
"bg-gradient-to-br" → "bg-bg-secondary" // Remove gradients
"bg-white" → "bg-bg-secondary"
"bg-gray-50" → "bg-bg-secondary"
"bg-gray-100" → "bg-bg-tertiary"
```

### Text Colors
```typescript
// OLD → NEW
"text-pink-600" → "text-supervisor"
"text-purple-600" → "text-librarian"
"text-green-600" → "text-success"
"text-orange-500" → "text-warning"
"text-red-600" → "text-error"
"text-blue-600" → "text-info"
"text-gray-900" → "text-text-primary"
"text-gray-700" → "text-text-secondary"
"text-gray-500" → "text-text-tertiary"
"text-gray-400" → "text-text-muted"
```

### Border Colors
```typescript
// OLD → NEW
"border-purple-200" → "border-bg-tertiary"
"border-pink-200" → "border-bg-tertiary"
"border-gray-200" → "border-bg-tertiary"
"hover:border-purple-300" → "hover:border-supervisor"
"hover:border-pink-300" → "hover:border-supervisor"
```

---

## 3. Base Component Replacements

### 3.1 Replace Custom Cards with `<Card>`

**OLD Pattern:**
```typescript
<div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
  {/* content */}
</div>
```

**NEW Pattern:**
```typescript
<Card>
  {/* content */}
</Card>

// With glow effect (for interactive cards)
<Card glow={true}>
  {/* content */}
</Card>
```

### 3.2 Replace Custom Buttons with `<Button>`

**OLD Pattern:**
```typescript
<button 
  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
  onClick={handleClick}
>
  Action
</button>
```

**NEW Pattern:**
```typescript
<Button 
  variant="primary" 
  size="sm"
  onClick={handleClick}
  aria-label="Descriptive action text"
>
  Action
</Button>

// Secondary variant
<Button variant="secondary" size="md">
  Cancel
</Button>
```

### 3.3 Use `<Tag>` Component for Metadata

**OLD Pattern:**
```typescript
<span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
  {tag}
</span>
```

**NEW Pattern:**
```typescript
<Tag label={tag} />

// With custom styling
<Tag label={tag} className="custom-class" />
```

---

## 4. Typography Standardization

### Font Families
```typescript
// OLD → NEW
"font-inter" → "font-sans"
"font-mono" → "font-mono" // Keep
```

### Font Sizes (use design system scale)
```typescript
// Headings
"text-3xl" → "text-2xl" // H1
"text-2xl" → "text-xl"  // H2
"text-xl" → "text-lg"   // H3

// Body text
"text-base" → "text-base" // Keep
"text-sm" → "text-sm"     // Keep
"text-xs" → "text-xs"     // Keep
```

---

## 5. Spacing Standardization

Use design system spacing scale (4px base):

```typescript
// Padding
"p-4" → "p-4"   // 16px
"p-6" → "p-6"   // 24px
"p-8" → "p-8"   // 32px

// Margins
"mt-4" → "mt-4" // 16px
"mb-6" → "mb-6" // 24px

// Gaps
"gap-2" → "gap-2" // 8px
"gap-4" → "gap-4" // 16px
```

---

## 6. Animation Standardization

### Framer Motion Patterns

**Hover Effects:**
```typescript
// OLD
whileHover={{ scale: 1.02 }}
transition={{ duration: 0.3 }}

// NEW
whileHover={{ scale: 1.05 }}
transition={{ duration: 0.2 }}
```

**Tap Effects:**
```typescript
// NEW (add to all interactive elements)
whileTap={{ scale: 0.98 }}
```

**Card Glow Effect (built into Card component):**
```typescript
// Use Card with glow prop instead of custom animation
<Card glow={true}>
  {/* content */}
</Card>
```

---

## 7. Text Content Updates

Update user-facing text to new naming convention:

```typescript
// OLD → NEW
"Seedlings" → "Active Prompts"
"Seedling" → "Active Prompt"
"My Seedlings" → "My Active Prompts"
"Greenhouse" → "Saved Prompts"
"My Greenhouse" → "My Saved Prompts"
"Global Commons" → "Global Commons" // Keep
```

---

## 8. Accessibility Pattern

Add ARIA labels to all interactive elements:

### Buttons
```typescript
<Button 
  variant="primary"
  onClick={handleSave}
  aria-label="Save prompt to Saved Prompts"
>
  Save
</Button>
```

### Sections
```typescript
<section aria-label="Active Prompts">
  {/* content */}
</section>

<main aria-label="Librarian">
  {/* content */}
</main>
```

### Interactive Cards
```typescript
<Card 
  glow={true}
  role="article"
  aria-label={`Prompt: ${promptTitle}`}
>
  {/* content */}
</Card>
```

### Inputs
```typescript
<input
  type="text"
  placeholder="Search prompts..."
  aria-label="Search prompts by semantic similarity"
/>
```

---

## 9. Grid Layout Pattern

Use responsive grid for card displays:

```typescript
// OLD
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// NEW (standardized)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* cards */}
</div>
```

---

## 10. Safe Refactoring Checklist

For each component refactor:

- [ ] Keep all existing hooks unchanged
- [ ] Keep all state management logic unchanged
- [ ] Keep all event handlers unchanged
- [ ] Keep all prop interfaces unchanged
- [ ] Only modify JSX structure
- [ ] Only modify className strings
- [ ] Replace custom components with base components
- [ ] Update colors to design system tokens
- [ ] Update text content to new naming
- [ ] Add ARIA labels to interactive elements
- [ ] Test component renders without errors
- [ ] Test all interactive functionality works
- [ ] Verify no console errors

---

## 11. Example: Before & After

### Before (Custom Implementation)
```typescript
<div className="bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 rounded-lg p-4 hover:border-purple-300 transition-all duration-300">
  <h3 className="text-xl text-purple-900 font-bold mb-2">
    Seedling Title
  </h3>
  <div className="flex gap-2 mb-4">
    {tags.map(tag => (
      <span key={tag} className="px-2 py-1 bg-purple-200 text-purple-800 rounded-full text-xs">
        {tag}
      </span>
    ))}
  </div>
  <button 
    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
    onClick={handleSave}
  >
    Save
  </button>
</div>
```

### After (Design System)
```typescript
<Card glow={true}>
  <h3 className="text-xl text-text-primary font-bold mb-2">
    Active Prompt Title
  </h3>
  <div className="flex gap-2 mb-4">
    {tags.map(tag => (
      <Tag key={tag} label={tag} />
    ))}
  </div>
  <Button 
    variant="primary"
    size="sm"
    onClick={handleSave}
    aria-label="Save prompt to Saved Prompts"
  >
    Save
  </Button>
</Card>
```

---

## 12. Testing After Refactor

For each refactored component:

1. **Visual Check**: Component renders with correct styling
2. **Functional Check**: All interactions work (clicks, hovers, etc.)
3. **Console Check**: No errors in browser console
4. **TypeScript Check**: `npm run type-check` passes
5. **Lint Check**: `npm run lint` passes

---

## 13. Common Pitfalls to Avoid

1. **Don't modify hook implementations** - Only change JSX
2. **Don't change prop interfaces** - Keep component APIs stable
3. **Don't remove existing functionality** - This is a visual refactor only
4. **Don't add new features** - Stay focused on design system alignment
5. **Don't skip ARIA labels** - Accessibility is a requirement
6. **Don't use custom colors** - Always use design system tokens
7. **Don't skip testing** - Verify each component works after refactor

---

## 14. Quick Reference: Design System Tokens

### Colors
```typescript
// Backgrounds
bg-bg-primary     // #0a1e2e - Main background
bg-bg-secondary   // #0f2838 - Cards/panels
bg-bg-tertiary    // #1a3a4f - Elevated elements
bg-bg-elevated    // #2a4d63 - Hover states

// Text
text-text-primary    // #ffffff - Headings
text-text-secondary  // #c5d1dd - Body text
text-text-tertiary   // #8a9dad - Muted text
text-text-muted      // #6b7f91 - Disabled text
text-text-accent     // #f5a623 - Accent/CTA

// Agent colors
text-supervisor  // #f5a623 - Amber/gold
text-dojo        // #f39c5a - Coral orange
text-librarian   // #ffd699 - Light amber
text-debugger    // #6b7f91 - Slate gray

// Status colors
text-success  // #4ade80 - Green
text-warning  // #f39c5a - Orange
text-error    // #ef4444 - Red
text-info     // #3d6380 - Blue
```

### Animation Timings
```typescript
duration-100  // instant - 100ms
duration-200  // fast - 200ms (standard)
duration-300  // normal - 300ms
duration-500  // slow - 500ms
duration-1000 // patient - 1000ms
```

---

## Conclusion

Following these patterns ensures:
- **Consistency**: All components look and feel uniform
- **Maintainability**: Standardized code is easier to update
- **Accessibility**: ARIA labels improve usability
- **Safety**: Preserving logic prevents regressions
- **Quality**: Design system compliance creates professional UI
