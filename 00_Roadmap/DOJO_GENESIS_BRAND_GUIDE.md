# Dojo Genesis - Brand Identity Guide

**Version:** 1.0  
**Date:** January 2026  
**Status:** Excellence Sprint - Complete

---

## 1. Core Vision: The Sustainable Intelligence OS

Dojo Genesis is the definitive realization of a **Sustainable Intelligence Platform**. It is a "Hardworking Workbench" for prompt engineering and a "Global Commons" for collective intelligence, built on a philosophy of calm, patient, and deliberate creation.

**Our Brand Promise:**
- **Think *with* AI, not *for* you:** We empower human thinking, we don't replace it.
- **Calm, not cluttered:** We prioritize focus and well-being over feature bloat.
- **Sustainable, not frantic:** We encourage a paced, thoughtful approach to creation.
- **Transparent, not opaque:** We reveal the inner workings of AI to build trust and understanding.

---

## 2. Logo & Symbolism

The Dojo Genesis logo is the heart of our brand identity. It is a visual metaphor for our core philosophy.

![Dojo Genesis Logo](https://github.com/TresPies/11-11/blob/main/05_Logs/DojoGenesisLogo.png?raw=true)

- **The Bonsai Tree:** Represents **patience, cultivation, and sustainable growth**. It is a living system that requires care and attention to flourish, just like a user's knowledge base.
- **The Sunset (Genesis):** Symbolizes **new beginnings, warmth, and the dawn of a new idea**. It is the "genesis" moment of creation, full of potential and hope.
- **The Dojo Temple:** Represents a place of **practice, mastery, and discipline**. It is the workbench where skills are honed and knowledge is perfected.
- **The Mountains:** Symbolize **stability, grounding, and the vast landscape of knowledge** to be explored.

---

## 3. Color Palette: Calm, Warm, Premium

Our color palette is derived directly from the logo, creating a harmonious and cohesive visual experience. It is designed to be calm, warm, and professional.

### Primary Brand Colors

- **Deep Teal/Navy (Background):** `--dojo-navy-900: #0a1e2e`
- **Sunset Amber (Genesis Accent):** `--dojo-amber-500: #f5a623`

### Full Color System

*(Refer to `DOJO_GENESIS_BRAND_COLORS.md` for the complete color system, including backgrounds, text, agent colors, and semantic colors.)*

### Color Usage

- **Backgrounds:** Use the deep navy tones to create a calm, focused environment. Use the sunset gradient for hero sections and key highlights.
- **Text:** Use white and light mountain grays for high readability against the dark backgrounds.
- **Accent:** Use the sunset amber sparingly for primary CTAs, links, and key interactive elements to draw the user's attention.

---

## 4. Typography: Clarity & Craft

Our typography is chosen for clarity, readability, and a touch of modern craftsmanship.

- **Headings & UI:** **Inter** (sans-serif)
  - **Why:** A highly readable, neutral, and modern typeface perfect for user interfaces.
  - **Weights:** Bold (700) for headings, Medium (500) for subheadings, Regular (400) for body text.

- **Code & Prompts:** **JetBrains Mono** (monospace)
  - **Why:** A beautiful, legible monospace font designed for developers, with clear characters and ligatures.
  - **Usage:** For all code blocks, prompt editors, and technical text.

### Type Scale (Example)

- **h1 (Page Title):** 36px, Bold
- **h2 (Section Title):** 28px, Bold
- **h3 (Subsection Title):** 22px, Medium
- **Body:** 16px, Regular
- **Small Text:** 14px, Regular
- **Code:** 15px, Regular

---

## 5. Voice & Tone: The Wise Guide

The Dojo Genesis voice is **calm, confident, and guiding**. It speaks to the user as a wise partner, not a servant or a dictator.

**Keywords:**
- **Guiding:** "Let's explore some perspectives..."
- **Encouraging:** "That's a great starting point."
- **Transparent:** "The Librarian is now searching for related prompts..."
- **Respectful:** "What would you like to do next?"
- **Calm:** "All set." (instead of "Success!")

**Avoid:**
- Overly casual language ("Gotcha!")
- Condescending praise ("Yay, you did it!")
- Technical jargon without explanation
- Robotic, impersonal commands

---

## 6. Micro-Interactions & Animation: The Soul of the UI

Our animations are subtle, purposeful, and premium. They provide feedback, guide the user, and add a layer of polish that makes the product feel alive and responsive.

*(Refer to `EXCELLENCE_SPRINT_RESEARCH.md` for detailed research and specifications.)*

### Core Principles

1.  **Subtlety is Premium:** Avoid flashy, distracting animations. Real confidence is quiet.
2.  **Acknowledge Instantly:** Every user action should receive immediate feedback (100ms).
3.  **Guide, Don't Decorate:** Transitions should support the user's mental model of the interface.
4.  **Luxury is Calm:** Turn painful moments (like loading) into calm, reassuring ones.

### Animation Library

- **Timing:** Use a consistent timing scale (100ms, 200ms, 300ms, 500ms).
- **Easing:** Prefer `ease-out` and `ease-in-out` for smooth, natural motion.
- **Properties:** Animate `transform` and `opacity` for performance.

### Key Animations

- **Tap/Click:** Tiny shrink (scale: 0.98) + soft glow.
- **Hover:** Gentle lift (translateY: -2px) + soft shadow.
- **Loading:** Skeleton screens, real progress bars, and subtle pulsing/shimmering animations.
- **Transitions:** Directional sliding panels and context-aware fades.
- **Success:** Clean checkmark animation + short, warm message.

---

## 7. Agent Visual Identity: The Thinking Partners

Each agent has a distinct color and icon, derived from the core brand palette, to give them a unique personality while maintaining a cohesive family feel.

| Agent | Icon | Color | Rationale |
| :--- | :--- | :--- | :--- |
| **Supervisor** | 🎯 | **Amber** (`#f5a623`) | The orchestrator, like the sun. Represents wisdom and coordination. |
| **Dojo** | 🧠 | **Sunset Orange** (`#f39c5a`) | The thinking partner. Represents warmth, growth, and mastery. |
| **Librarian** | 📚 | **Sunrise Yellow** (`#ffd699`) | The knowledge keeper. Represents clarity, discovery, and illumination. |
| **Debugger** | 🔍 | **Mountain Blue-Gray** (`#6b7f91`) | The validator. Represents stability, precision, and grounding. |

### Agent UI

- **Agent Cards:** Use the agent's primary color for the icon and a subtle background tint (`8%` opacity).
- **Status Dots:** Use the agent's color to indicate status (pulsing for working, solid for idle).
- **Activity Log:** Prefix each log entry with the agent's icon and color.

---

## 8. UI Application & Mood Board

This brand identity translates into a clean, focused, and beautiful user interface.

### Key Components

- **Buttons:** Primary CTAs use the amber color. Secondary buttons are subtle with a navy background and amber border.
- **Cards:** Use the secondary navy background (`#0f2838`) with soft borders and a gentle lift on hover.
- **Progress Indicators:** Use the sunset gradient for progress bars. For circular indicators, use a clean, animated stroke.
- **Agent Panel:** A vertical stack of agent cards, showing status, progress, and cost in real-time.

### Mood Board Keywords

- **Calm & Focused:** Dark mode, minimal clutter, generous whitespace.
- **Warm & Organic:** Sunset gradients, soft glows, natural animations.
- **Premium & Polished:** Subtle shadows, crisp typography, smooth transitions.
- **Transparent & Trustworthy:** Real-time agent activity, clear cost tracking.

---

**End of Brand Identity Guide**
