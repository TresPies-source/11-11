# Technical Specification: Dashboard Page (v0.4.0 Wave 1)

## Task Difficulty Assessment
**Complexity: Medium**

This task involves creating a new Dashboard page that composes multiple UI elements using existing base components. While the individual components already exist, the implementation requires careful attention to:
- Layout composition with proper spacing and alignment
- Integration of multiple card components with different content types
- Proper use of Tailwind CSS utilities to match the mockup
- Mock data structure for Recent Activity
- Ensuring pixel-perfect alignment with the design mockup

## Technical Context

### Language & Framework
- **Language**: TypeScript (React)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS 3.4
- **Animation**: Framer Motion (already used in base components)

### Dependencies
All required dependencies are already installed:
- `react` and `react-dom` (v18.3.1)
- `next` (v14.2.24)
- `tailwindcss` (v3.4.17)
- `framer-motion` (v11.15.0)
- `lucide-react` (v0.469.0) - for icons if needed

### Design System
The Dojo Genesis design system is already fully configured in `tailwind.config.ts` with:
- **Colors**: Navy backgrounds, amber accents, agent colors, semantic colors
- **Typography**: Inter (sans) and JetBrains Mono (mono) fonts
- **Spacing**: Custom spacing scale (1-16)
- **Transitions**: Custom timing functions and durations

### Base Components
The following components are already implemented and available:
1. **Card** (`components/ui/Card.tsx`)
   - Props: `children`, `className`, `glow`
   - Glow variant with hover animations
2. **Button** (`components/ui/Button.tsx`)
   - Props: `variant` ('primary' | 'secondary'), `size`, `isLoading`, `children`
   - Hover and tap animations
3. **StatusDot** (`components/ui/StatusDot.tsx`)
   - Props: `status` ('idle' | 'working' | 'error' | 'success'), `size`
   - Pulse animation for 'working' state

## Implementation Approach

### 1. File Structure
Create the following file:
- `app/dashboard/page.tsx` - Main Dashboard page component

### 2. Component Architecture

The Dashboard page will be a **server component** (default in Next.js App Router) with the following structure:

```
Dashboard (page.tsx)
├── Section Container (flex column, gap-8)
│   ├── Page Title (h1)
│   ├── Quick Actions Card
│   │   ├── Card Title (h2)
│   │   └── 2x2 Grid of Action Buttons
│   ├── Agent Status Card
│   │   ├── Card Title (h2)
│   │   └── Vertical List of Agent Rows
│   └── Recent Activity Card
│       ├── Card Title (h2)
│       └── Vertical List of Activity Items
```

### 3. Layout Implementation

**Page Container:**
- Wrapper: `<section>` or `<div>` with full-width padding
- Layout: `flex flex-col gap-8` (32px vertical spacing)
- Padding: `p-12` (48px all sides) to match mockup
- Background: Inherited from layout (`bg-bg-primary`)

**Page Title:**
- Element: `<h1>`
- Styling: `text-4xl font-bold text-text-primary mb-8`
- Content: "Dashboard"

### 4. Component Details

#### Quick Actions Card
- **Wrapper**: `<Card glow={true}>`
- **Title**: `<h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>`
- **Grid Layout**: `grid grid-cols-2 gap-4`
- **Buttons**: Four `<Button variant="secondary">` components:
  1. 🧠 New Dojo Session
  2. ✍️ Write Prompt
  3. 📚 Search Library
  4. 🌱 Plant Seed
- **Button Content**: Emoji + text label, flex layout with gap
- **Behavior**: Buttons will be non-functional in Wave 1 (onclick handlers to be added in future waves)

#### Agent Status Card
- **Wrapper**: `<Card>`
- **Title**: `<h2 className="text-2xl font-semibold mb-6">Agent Status</h2>`
- **List Layout**: `flex flex-col gap-4`
- **Agent Rows**: Four rows, each containing:
  - Icon (emoji): 🎯 (Supervisor), 🧠 (Dojo), 📚 (Librarian), 🔍 (Debugger)
  - Agent Name: 16px medium, white
  - StatusDot: `<StatusDot status="idle" size="md" />`
- **Row Layout**: `flex items-center gap-3`
- **Data**: Hardcoded array of agent objects for Wave 1

#### Recent Activity Card
- **Wrapper**: `<Card>`
- **Title**: `<h2 className="text-2xl font-semibold mb-6">Recent Activity</h2>`
- **List Layout**: `flex flex-col gap-3`
- **Activity Items**: 3-5 items, each displaying:
  - Bullet point or icon
  - Activity description
  - Relative timestamp (e.g., "2h ago")
- **Item Styling**: `text-sm text-text-secondary`
- **Timestamp Styling**: `text-text-tertiary`
- **Data**: Mock array of activity strings

### 5. Data Model

#### Agent Status (Mock Data)
```typescript
interface Agent {
  id: string;
  name: string;
  icon: string;
  status: 'idle' | 'working' | 'error' | 'success';
}

const agents: Agent[] = [
  { id: 'supervisor', name: 'Supervisor', icon: '🎯', status: 'idle' },
  { id: 'dojo', name: 'Dojo', icon: '🧠', status: 'idle' },
  { id: 'librarian', name: 'Librarian', icon: '📚', status: 'idle' },
  { id: 'debugger', name: 'Debugger', icon: '🔍', status: 'idle' },
];
```

#### Recent Activity (Mock Data)
```typescript
interface ActivityItem {
  id: string;
  description: string;
  timestamp: string;
}

const recentActivity: ActivityItem[] = [
  { id: '1', description: 'Dojo Session: "React performance"', timestamp: '2h ago' },
  { id: '2', description: 'Prompt Saved: "Roadmap Planning"', timestamp: '5h ago' },
  { id: '3', description: 'Librarian Search: "product roadmap"', timestamp: '1d ago' },
];
```

## Source Code Structure Changes

### New Files
1. **`app/dashboard/page.tsx`** - Dashboard page component (main implementation)

### Modified Files
None - all base components and configurations already exist.

## API / Interface Changes
None - this is a static page with mock data for Wave 1.

## Verification Approach

### 1. Visual Testing
- **Manual Browser Test**: Navigate to `/dashboard` and verify:
  - Page title renders correctly
  - All three cards are visible and properly spaced
  - Quick Actions card has 4 buttons in a 2x2 grid
  - Agent Status card shows all 4 agents with idle status
  - Recent Activity card displays mock activity data
  - All styling matches the mockup (colors, spacing, typography)

### 2. Responsive Testing
- Verify the layout works at different viewport sizes (though mobile-first is not a Wave 1 requirement)

### 3. Lint & Type Check
Run the following commands to ensure code quality:
```bash
npm run lint
npm run type-check
```

### 4. Build Verification
Ensure the page builds without errors:
```bash
npm run build
```

### 5. Accessibility Checks
- Verify proper heading hierarchy (h1 → h2)
- Ensure semantic HTML is used
- Check that StatusDot components have appropriate ARIA labels (already implemented)

## Implementation Notes

### Design Mockup Adherence
According to `V0.4.0_MOCKUPS_REFINED.md` (Mockup 2: Dashboard):
- Main content padding: 48px (`p-12`)
- Card styling: `bg-secondary`, `border-radius: 12px`, `padding: 24px`
- Quick Actions: 2x2 grid, buttons with icons and labels
- Agent Status: Vertical list with icon, name, and status dot
- Recent Activity: Simple list of text items with timestamps

### Pixel-Perfect Requirements
The implementation must match the mockup's:
- ✅ Spacing between cards (32px = `gap-8`)
- ✅ Card internal padding (24px = `p-6`)
- ✅ Button sizes and grid layout
- ✅ Typography sizes (4xl for h1, 2xl for h2, base/sm for content)
- ✅ Color usage (backgrounds, text, accents)

### Future Considerations (Not in Wave 1)
- Real-time agent status updates (WebSocket/Supabase Realtime)
- Actual activity feed from database/logging system
- Click handlers for Quick Action buttons (navigation/modals)
- Loading states and error handling
- User-specific data instead of mock data

## Success Criteria

- ✅ Dashboard page accessible at `/dashboard`
- ✅ Page layout matches the mockup structure
- ✅ All three cards render correctly with proper content
- ✅ Quick Actions card uses Card component with glow variant
- ✅ Quick Actions displays 4 buttons in 2x2 grid
- ✅ Agent Status card shows all 4 agents with idle status
- ✅ Recent Activity card displays mock activity data
- ✅ All Tailwind classes match design system values
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Build succeeds
- ✅ Visual output is pixel-perfect match of mockup
