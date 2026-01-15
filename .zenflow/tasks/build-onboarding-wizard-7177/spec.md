# Technical Specification: Onboarding Wizard

## Difficulty Assessment: **Medium**

**Rationale**: This feature requires creating multiple new components, managing multi-step state, integrating with the layout system, and implementing OAuth connections. While it follows established patterns in the codebase, it involves coordination between several subsystems (auth, layout, state management) and requires careful UX considerations.

---

## 1. Technical Context

### Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: Tailwind CSS with custom Dojo Genesis design system
- **Animation**: Framer Motion
- **Authentication**: NextAuth v5 with Google OAuth
- **State Management**: React hooks + localStorage
- **Type Safety**: TypeScript strict mode

### Design System Integration
All components must strictly adhere to:
- **Brand Guide**: `/00_Roadmap/DOJO_GENESIS_BRAND_GUIDE.md`
- **Color System**: `/00_Roadmap/DOJO_GENESIS_BRAND_COLORS.md`
- **Semantic Colors**: Defined in `tailwind.config.ts`
- **Typography**: Inter for UI, JetBrains Mono for code
- **Animation Principles**: Subtle, purposeful, premium (100ms-500ms)

---

## 2. Implementation Approach

### 2.1 Core Architecture

The onboarding wizard will follow the established modal pattern in the codebase:

1. **Portal-based Rendering**: Use `createPortal` for z-index management
2. **Framer Motion Animations**: Consistent with existing modals (200ms transitions)
3. **State Management**: 
   - Step progression tracked in component state
   - Completion status stored in `localStorage`
   - OAuth integration through NextAuth
4. **Accessibility**: Full keyboard navigation, ARIA attributes, focus management

### 2.2 Step-by-Step Flow

**Step 1: Welcome & Introduction**
- Display Dojo Genesis logo and brand messaging
- Brief overview of platform capabilities
- "Get Started" CTA to proceed

**Step 2: Connect Services**
- Google Drive connection button (OAuth via NextAuth)
- GitHub connection button (OAuth via NextAuth)
- Skip option for users who want to connect later
- Visual feedback for connection status

**Step 3: Create First Project**
- Reuse/adapt existing `NewProjectModal` component logic
- Project name input (required)
- Project description textarea (optional)
- "Complete Setup" CTA

### 2.3 User Detection & Display Logic

The wizard should appear when:
- User is authenticated (has valid session)
- No `onboarding_completed` flag in localStorage
- First load of the application

The wizard should NOT appear when:
- User has `onboarding_completed: true` in localStorage
- User is not authenticated (they'll see login flow first)

### 2.4 Component Hierarchy

```
OnboardingWizard (Parent)
├── Step1_Welcome
├── Step2_Connect
└── Step3_CreateProject
```

---

## 3. Source Code Structure

### 3.1 New Files to Create

```
components/onboarding/
├── OnboardingWizard.tsx       # Main wizard container with step management
├── Step1_Welcome.tsx          # Welcome screen component
├── Step2_Connect.tsx          # OAuth connection screen
└── Step3_CreateProject.tsx    # Project creation screen
```

### 3.2 Files to Modify

```
app/layout.tsx                 # Add OnboardingWizard component
```

### 3.3 Component Specifications

#### **OnboardingWizard.tsx**
- Props: `isOpen: boolean`, `onClose: () => void`, `onComplete: () => void`
- State: `currentStep: 1 | 2 | 3`
- Features:
  - Step navigation (Next, Back, Skip)
  - Progress indicator (dots or progress bar)
  - Portal rendering with backdrop
  - ESC key to dismiss (with confirmation)
  - Animation transitions between steps

#### **Step1_Welcome.tsx**
- Display: Logo, welcome message, platform overview
- Brand colors: Sunset gradient, amber accents
- CTA: "Let's Begin" button
- Props: `onNext: () => void`

#### **Step2_Connect.tsx**
- OAuth buttons for Google Drive and GitHub
- Connection status indicators (connected/not connected)
- Skip option
- Props: `onNext: () => void`, `onBack: () => void`
- Integration: Uses NextAuth `signIn()` function

#### **Step3_CreateProject.tsx**
- Form: Project name (required), description (optional)
- Validation: Name cannot be empty
- CTA: "Complete Setup" button
- Props: `onComplete: (name: string, description: string) => void`, `onBack: () => void`
- Integration: Calls parent's `onCreate` callback

---

## 4. Data Model / State Changes

### 4.1 LocalStorage Schema

```typescript
{
  "onboarding_completed": boolean,
  "onboarding_step_reached": 1 | 2 | 3,  // Optional: for resuming
  "google_drive_connected": boolean,      // Optional: for tracking connections
  "github_connected": boolean             // Optional: for tracking connections
}
```

### 4.2 Component State

```typescript
interface OnboardingState {
  currentStep: 1 | 2 | 3;
  completedSteps: Set<number>;
  isLoading: boolean;
}
```

---

## 5. Integration Points

### 5.1 Authentication Integration
- Use NextAuth's `signIn('google')` for Google OAuth
- Use NextAuth's `signIn('github')` for GitHub OAuth (if configured)
- Check `session.accessToken` to verify connection status

### 5.2 Layout Integration
- Add `<OnboardingWizard />` to `app/layout.tsx`
- Condition rendering on:
  - `session` existence (from MockSessionProvider)
  - `localStorage.getItem('onboarding_completed')` === null

### 5.3 Project Creation Integration
- Reuse project creation logic from existing dashboard
- May need to create a hook or service for project creation
- Store first project in appropriate state/database

---

## 6. Design Specifications

### 6.1 Color Palette
- **Background**: `bg-bg-secondary` (#0f2838)
- **Backdrop**: `bg-black/50`
- **Text**: `text-text-primary` (white), `text-text-secondary` (#c5d1dd)
- **Accents**: `text-accent` (#f5a623 - amber)
- **Borders**: `border-bg-tertiary` (#1a3a4f)
- **CTA Buttons**: `bg-text-accent` with hover states

### 6.2 Animation Timing
- **Modal entrance/exit**: 200ms ease-out
- **Step transitions**: 300ms ease-in-out with directional slide
- **Button hovers**: 100ms instant feedback
- **Success states**: 300ms with subtle scale

### 6.3 Responsive Design
- **Desktop**: Center modal, max-width: 600px
- **Tablet**: Full-width with padding
- **Mobile**: Full-screen modal with safe areas

---

## 7. Acceptance Criteria

### Functional Requirements
- [ ] Wizard appears for first-time authenticated users
- [ ] Wizard has 3 distinct steps with smooth transitions
- [ ] Step 1 displays welcome message and brand identity
- [ ] Step 2 allows connecting Google Drive (functional OAuth)
- [ ] Step 2 allows connecting GitHub (functional OAuth)
- [ ] Step 2 has a "Skip" option
- [ ] Step 3 allows creating a project with name and description
- [ ] Completing the wizard sets `onboarding_completed` flag
- [ ] Wizard does not appear again after completion
- [ ] Can navigate back/forward between steps
- [ ] ESC key closes wizard (with confirmation if partially completed)

### Non-Functional Requirements
- [ ] Application builds successfully (`npm run build`)
- [ ] Type-check passes (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] No console errors when wizard loads
- [ ] Animations are smooth (60fps)
- [ ] Follows Dojo Genesis design system strictly
- [ ] Fully accessible (keyboard navigation, ARIA labels)
- [ ] Works on mobile, tablet, and desktop

---

## 8. Verification Approach

### 8.1 Build & Type Checking
```bash
npm run build
npm run type-check
npm run lint
```

### 8.2 Manual Testing Checklist
1. Clear localStorage and reload → Wizard should appear
2. Complete all 3 steps → `onboarding_completed` should be set
3. Reload page → Wizard should NOT appear
4. Test Google OAuth connection → Should open OAuth flow
5. Test GitHub OAuth connection → Should open OAuth flow
6. Test "Skip" on Step 2 → Should proceed to Step 3
7. Test back navigation → Should return to previous step
8. Test ESC key → Should show confirmation dialog
9. Test form validation → Empty project name should show error
10. Test project creation → Should complete wizard and create project

### 8.3 Edge Cases
- User closes wizard mid-flow (should not mark as completed)
- OAuth fails (should show error message and allow retry)
- Network error during project creation (should show error)
- User has already connected OAuth before wizard (should show "Connected")

---

## 9. Risk Assessment

### Low Risk
- UI implementation (well-established patterns)
- Animation integration (Framer Motion already in use)
- Styling (design system well-defined)

### Medium Risk
- OAuth integration (depends on correct NextAuth configuration)
- Project creation (may need to build new project creation service)
- State persistence (localStorage reliability)

### Mitigation Strategies
- For OAuth: Implement proper error handling and retry logic
- For project creation: Stub the functionality if backend isn't ready
- For localStorage: Add try-catch blocks and fallback behavior

---

## 10. Future Enhanations (Out of Scope)

- Analytics tracking for wizard completion rates
- A/B testing different wizard flows
- Video tutorials in Step 1
- More granular progress indicators
- "Resume wizard" functionality for partial completions
- Admin panel to customize wizard content

---

**End of Technical Specification**
