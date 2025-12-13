# Design Guidelines: C# Functional Programming Learning Platform

## Design Approach

**Selected Approach:** Design System Approach inspired by **VS Code + Linear**

**Justification:** This is a utility-focused educational platform requiring maximum clarity, consistency, and usability. The split-pane code editor layout, combined with documentation and test results, demands a developer-centric design language that prioritizes function over decoration. Linear's typography and spacing principles combined with VS Code's developer-friendly interface patterns create the ideal foundation.

**Core Design Principles:**
1. **Clarity First:** Every element serves a clear purpose in the learning workflow
2. **Cognitive Load Reduction:** Minimize visual noise; let code and content breathe
3. **Spatial Hierarchy:** Clear zones for learning, coding, feedback, and visualization
4. **Focused Attention:** Guide learners through concept → code → validation flow

---

## Typography System

**Font Families:**
- **Interface Text:** Inter (Google Fonts) - clean, highly legible for UI
- **Code:** Monaspace Argon (self-hosted) - readable mono with optional FP ligatures (off by default)
- **Documentation:** Inter for consistency

**Type Scale:**
- **Page Title:** 32px, font-weight 700 (lesson title)
- **Section Headers:** 20px, font-weight 600 (pane titles: "Concept", "Editor", "Tests")
- **Body Text:** 15px, font-weight 400, line-height 1.6 (Markdown content)
- **Code Editor:** 14px, font-weight 400, line-height 1.5 (Monaco default)
- **UI Labels:** 13px, font-weight 500 (buttons, tags, metadata)
- **Console Output:** 13px, font-weight 400, font-family monospace
- **Test Results:** 14px, font-weight 500 for status, 13px for messages

---

## Layout System

**Spacing Primitives:** Use Tailwind units: **2, 3, 4, 6, 8, 12, 16**
- Micro spacing (component internals): `p-2`, `gap-2`, `m-3`
- Standard spacing (between elements): `p-4`, `gap-4`, `mb-6`
- Section spacing (pane padding): `p-6`, `p-8`
- Large gaps (between major sections): `gap-8`, `mb-12`, `p-16`

**Main Application Layout:**

**Desktop (lg:):**
```
┌─────────────────────────────────────────────────────┐
│ Header (h-16): Logo, Lesson Nav, Progress          │
├───────────────────┬─────────────────────────────────┤
│                   │                                 │
│  Left Pane        │  Right Split                   │
│  (40% width)      │  (60% width)                   │
│                   │                                 │
│  - Lesson Title   │  ┌─────────────────────────┐   │
│  - Concept Tags   │  │ tldraw Canvas (50% h)   │   │
│  - Markdown Docs  │  │ + Play Button Overlay   │   │
│  - "Run" Button   │  └─────────────────────────┘   │
│                   │  ┌─────────────────────────┐   │
│  (scrollable)     │  │ Monaco Editor (35% h)   │   │
│                   │  │ + Toolbar (Run/Submit)  │   │
│                   │  └─────────────────────────┘   │
│                   │  ┌─────────────────────────┐   │
│                   │  │ Console/Tests (15% h)   │   │
│                   │  └─────────────────────────┘   │
└───────────────────┴─────────────────────────────────┘
```

**Tablet/Mobile (< lg:):** Stack vertically with fixed-height sections, tabs for Canvas/Editor/Console switching

**Container Constraints:**
- Maximum content width: `max-w-screen-2xl` (1536px)
- Pane minimum widths: Left 320px, Right 480px
- Resizable divider between left/right panes (drag handle at 4px width)

---

## Component Library

### Navigation & Header
- **Height:** 64px (h-16), fixed positioning
- **Logo:** 32px height, positioned left with `mr-8`
- **Lesson Navigation:** Horizontal pill-style tabs, `px-4 py-2`, `gap-2`, rounded-lg
- **Progress Indicator:** Compact text "Lesson 2/5" with circular progress icon, positioned right

### Lesson Content Pane (Left)
- **Container:** `p-8`, full height with overflow-y-auto
- **Lesson Title:** `mb-4`, `text-3xl font-bold`
- **Concept Tags:** Inline badges, `px-3 py-1`, `rounded-full`, `text-sm`, `gap-2`
- **Markdown Content:** 
  - Standard prose styling with `max-w-prose`
  - Code snippets: inline rounded containers with `px-2 py-1`, `text-sm`, monospace
  - Code blocks: full-width with `p-4`, `rounded-lg`, line numbers on left

### tldraw Canvas Pane
- **Container:** Embedded iframe/component, `rounded-lg` borders on all sides
- **Play Button:** Floating overlay, bottom-right corner with `m-4`, 48px circular button with play icon
- **Controls:** Minimal - only play/pause, reset positioned as floating toolbar

### Code Editor Pane (Monaco)
- **Toolbar:** `h-12` sticky header with `px-4`, contains:
  - File indicator (read-only "Exercise.cs" text)
  - Action buttons group right-aligned: "Run" (primary), "Submit" (secondary)
  - Button size: `px-4 py-2`, `rounded-md`, `font-medium`
- **Editor Area:** No border, seamless integration, line numbers enabled, minimap disabled for cleaner look
- **Gutter:** 60px width for line numbers

### Console/Test Results Pane
- **Tabs:** Horizontal tabs (`h-10`) to switch between "Console Output" and "Test Results"
- **Console Output:** 
  - Monospace font, `p-4`
  - Line-by-line output with timestamps (13px, muted)
  - Stdout/stderr differentiated by subtle background
- **Test Results:**
  - List layout with `gap-3`
  - Each test: `p-3`, `rounded-md`, flex layout
  - Status icon (16px) + Test name (14px bold) + Message (13px)
  - Summary banner at top: "3/5 tests passed", `p-3`, `rounded-lg`, prominent

### Buttons & Interactive Elements
- **Primary Button:** `px-4 py-2`, `rounded-md`, `font-medium`, `text-sm`
- **Secondary Button:** Same size, outlined style
- **Concept Tags:** `px-3 py-1`, `rounded-full`, `text-xs`, `font-medium`, non-interactive
- **Icon Buttons:** 32px square, rounded, centered icon
- **Resize Handle:** 4px wide vertical bar, hover expands to 8px with drag cursor

### Status & Feedback
- **Loading States:** Subtle spinner (16px) inline with text
- **Success/Error States:** 
  - Inline icons (16px) with corresponding text
  - Toast notifications: bottom-right, `p-4`, `rounded-lg`, `shadow-lg`, auto-dismiss in 5s
- **Hints Panel:** Expandable accordion below test results, `p-4`, `rounded-md`

---

## Interaction Patterns

**Split Pane Behavior:**
- Draggable divider with smooth resize (no snap points)
- Minimum pane widths enforced
- Resize handle shows visual affordance on hover (subtle expand)

**Code Execution Flow:**
1. "Run" button → Disable button, show inline spinner → Stream output to Console → Enable button
2. "Submit" button → Disable, show spinner → Display test results with stagger animation (100ms delay per test) → Enable button

**Animation Playback:**
- Play button → Fade out, show pause button in same position
- Camera movements: smooth easing (cubic-bezier), 1-2s duration
- Shape highlights: subtle pulse/glow effect

**LSP Integration:**
- Autocomplete dropdown: `rounded-md`, `shadow-lg`, max 8 suggestions visible
- Diagnostics: wavy underline (red for errors, yellow for warnings)
- Hover tooltips: `p-2`, `rounded`, `text-xs`, appear with 300ms delay

---

## Accessibility

- **Keyboard Navigation:** Full tab order through all interactive elements, escape to close modals/dropdowns
- **Screen Readers:** All icons have aria-labels, pane sections have clear headings
- **Focus Indicators:** 2px offset outline on all focusable elements
- **High Contrast:** Ensure 4.5:1 contrast ratio for all text
- **Reduced Motion:** Respect prefers-reduced-motion for animations

---

## Responsive Behavior

**Desktop (≥1024px):** Full split-pane layout as described
**Tablet (768px-1023px):** 
- Maintain split layout, reduce left pane to 35%
- Reduce padding to `p-4`
**Mobile (<768px):**
- Stack all panes vertically
- Tab navigation between Canvas/Editor/Console
- Fixed 60vh height for active pane
- Collapsible lesson content (accordion)

---

This design creates a focused, distraction-free learning environment optimized for code comprehension and rapid iteration cycles.
