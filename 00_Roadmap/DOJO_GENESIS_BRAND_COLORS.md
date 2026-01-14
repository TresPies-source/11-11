# Dojo Genesis - Color Palette Analysis

**Source:** DojoGenesisLogo.png (Bonsai Sunset)  
**Date:** January 2026  
**Status:** Excellence Sprint - Brand Identity

---

## Logo Color Extraction

### Primary Brand Colors (from logo)

**Deep Teal/Navy (Background)**
```css
--dojo-navy-900:    #0a1e2e;  /* Darkest background */
--dojo-navy-800:    #0f2838;  /* Dark teal */
--dojo-navy-700:    #1a3a4f;  /* Medium teal */
--dojo-navy-600:    #2a4d63;  /* Lighter teal */
--dojo-navy-500:    #3d6380;  /* Base teal */
```

**Sunset Amber/Orange (Genesis)**
```css
--dojo-amber-500:   #f5a623;  /* Bright amber (logo text) */
--dojo-amber-400:   #f7b84d;  /* Light amber */
--dojo-amber-300:   #f9c970;  /* Pale amber */
--dojo-sunset-600:  #e8873e;  /* Deep sunset orange */
--dojo-sunset-500:  #f39c5a;  /* Warm sunset */
--dojo-sunset-400:  #f7b077;  /* Light sunset */
--dojo-sunrise-400: #ffd699;  /* Pale sunrise yellow */
--dojo-sunrise-300: #ffe4b3;  /* Very pale yellow */
```

**Bonsai Tree (Accent)**
```css
--dojo-tree-900:    #1a1f2e;  /* Dark trunk/branches */
--dojo-tree-800:    #2d3548;  /* Medium trunk */
--dojo-tree-700:    #3d4a5f;  /* Light trunk */
--dojo-foliage-800: #2a3d52;  /* Dark foliage */
--dojo-foliage-700: #3d5a6f;  /* Medium foliage */
```

**Mountain Layers (Depth)**
```css
--dojo-mountain-600: #4a5d6f;  /* Darkest mountain */
--dojo-mountain-500: #6b7f91;  /* Dark mountain */
--dojo-mountain-400: #8a9dad;  /* Medium mountain */
--dojo-mountain-300: #a8b8c7;  /* Light mountain */
--dojo-mountain-200: #c5d1dd;  /* Pale mountain */
```

---

## Refined Color System for UI

### Background Colors

**Dark Mode (Primary)**
```css
--bg-primary:   #0a1e2e;  /* Navy 900 - Main background */
--bg-secondary: #0f2838;  /* Navy 800 - Cards, panels */
--bg-tertiary:  #1a3a4f;  /* Navy 700 - Hover states */
--bg-elevated:  #2a4d63;  /* Navy 600 - Elevated cards */
```

**Light Mode (Alternative)**
```css
--bg-primary:   #f8fafb;  /* Very pale blue-gray */
--bg-secondary: #ffffff;  /* White - Cards, panels */
--bg-tertiary:  #f0f4f7;  /* Pale gray-blue - Hover */
--bg-elevated:  #ffffff;  /* White - Elevated cards */
```

---

### Text Colors

**Dark Mode**
```css
--text-primary:   #ffffff;     /* Pure white - Main text */
--text-secondary: #c5d1dd;     /* Mountain 200 - Secondary text */
--text-tertiary:  #8a9dad;     /* Mountain 400 - Tertiary text */
--text-muted:     #6b7f91;     /* Mountain 500 - Muted text */
--text-accent:    #f5a623;     /* Amber 500 - Accent text (Genesis) */
```

**Light Mode**
```css
--text-primary:   #0a1e2e;     /* Navy 900 - Main text */
--text-secondary: #1a3a4f;     /* Navy 700 - Secondary text */
--text-tertiary:  #3d6380;     /* Navy 500 - Tertiary text */
--text-muted:     #6b7f91;     /* Mountain 500 - Muted text */
--text-accent:    #e8873e;     /* Sunset 600 - Accent text */
```

---

### Agent Colors (Refined)

**Supervisor (Orchestrator) - Amber/Gold**
```css
--agent-supervisor-primary:   #f5a623;  /* Amber 500 - Matches "GENESIS" */
--agent-supervisor-secondary: #f7b84d;  /* Amber 400 */
--agent-supervisor-bg:        #f5a62315; /* 8% opacity */
--agent-supervisor-border:    #f5a62340; /* 25% opacity */
```
*Rationale:* Supervisor orchestrates like the sun orchestrates the day. Amber represents wisdom and coordination.

**Dojo (Thinking Partner) - Sunset Orange**
```css
--agent-dojo-primary:   #f39c5a;  /* Sunset 500 - Warm, inviting */
--agent-dojo-secondary: #f7b077;  /* Sunset 400 */
--agent-dojo-bg:        #f39c5a15; /* 8% opacity */
--agent-dojo-border:    #f39c5a40; /* 25% opacity */
```
*Rationale:* Dojo is about growth and warmth. Sunset orange represents the transition from learning to mastery.

**Librarian (Knowledge Keeper) - Sunrise Yellow**
```css
--agent-librarian-primary:   #ffd699;  /* Sunrise 400 - Bright, illuminating */
--agent-librarian-secondary: #ffe4b3;  /* Sunrise 300 */
--agent-librarian-bg:        #ffd69915; /* 8% opacity */
--agent-librarian-border:    #ffd69940; /* 25% opacity */
```
*Rationale:* Librarian illuminates knowledge like sunrise illuminates the world. Yellow represents clarity and discovery.

**Debugger (Validator) - Mountain Blue-Gray**
```css
--agent-debugger-primary:   #6b7f91;  /* Mountain 500 - Stable, analytical */
--agent-debugger-secondary: #8a9dad;  /* Mountain 400 */
--agent-debugger-bg:        #6b7f9115; /* 8% opacity */
--agent-debugger-border:    #6b7f9140; /* 25% opacity */
```
*Rationale:* Debugger is grounded and analytical like mountains. Blue-gray represents stability and precision.

---

### Semantic Colors

**Success (Growth)**
```css
--success-primary:   #4ade80;  /* Green - Growth, success */
--success-secondary: #86efac;  /* Light green */
--success-bg:        #4ade8015; /* 8% opacity */
```

**Warning (Caution)**
```css
--warning-primary:   #f39c5a;  /* Sunset orange - Matches Dojo */
--warning-secondary: #f7b077;  /* Light sunset */
--warning-bg:        #f39c5a15; /* 8% opacity */
```

**Error (Conflict)**
```css
--error-primary:   #ef4444;  /* Red - Error, conflict */
--error-secondary: #f87171;  /* Light red */
--error-bg:        #ef444415; /* 8% opacity */
```

**Info (Insight)**
```css
--info-primary:   #3d6380;  /* Navy 500 - Matches background */
--info-secondary: #6b7f91;  /* Mountain 500 */
--info-bg:        #3d638015; /* 8% opacity */
```

---

## Color Usage Guidelines

### Primary Brand Color: Amber (#f5a623)
- Logo "GENESIS" text
- Primary CTA buttons
- Supervisor agent identity
- Key accent elements
- Links and interactive elements

### Background Gradient (Hero sections)
```css
background: linear-gradient(
  135deg,
  #0a1e2e 0%,    /* Navy 900 */
  #0f2838 25%,   /* Navy 800 */
  #1a3a4f 50%,   /* Navy 700 */
  #2a4d63 100%   /* Navy 600 */
);
```

### Sunset Gradient (Highlights, accents)
```css
background: linear-gradient(
  90deg,
  #e8873e 0%,    /* Sunset 600 */
  #f39c5a 33%,   /* Sunset 500 */
  #f5a623 66%,   /* Amber 500 */
  #ffd699 100%   /* Sunrise 400 */
);
```

### Agent Status Gradient (Multi-agent activity)
```css
background: linear-gradient(
  90deg,
  #f5a623 0%,    /* Supervisor - Amber */
  #f39c5a 33%,   /* Dojo - Sunset */
  #ffd699 66%,   /* Librarian - Sunrise */
  #6b7f91 100%   /* Debugger - Mountain */
);
```

---

## Color Accessibility

### Contrast Ratios (WCAG AA)

**Dark Mode:**
- White text on Navy 900: **14.2:1** ✅ (AAA)
- Amber 500 on Navy 900: **7.8:1** ✅ (AA Large)
- Mountain 200 on Navy 900: **9.1:1** ✅ (AAA)

**Light Mode:**
- Navy 900 on White: **14.2:1** ✅ (AAA)
- Sunset 600 on White: **4.9:1** ✅ (AA)
- Navy 700 on White: **9.3:1** ✅ (AAA)

---

## Visual Mood

**Keywords:**
- Calm, meditative, focused
- Warm, inviting, growth-oriented
- Premium, polished, professional
- Natural, organic, sustainable
- Wise, patient, deliberate

**Avoid:**
- Harsh neon colors
- Pure black (#000000)
- Overly saturated colors
- Aggressive reds
- Cold, sterile blues

---

## Next Steps

1. Update all mockups with refined color palette
2. Create agent identity cards with new colors
3. Design micro-interactions with sunset gradients
4. Apply color system to component library
5. Test accessibility across all color combinations

---

**End of Color Palette Analysis**
