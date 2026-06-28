# Marketplace UI Specification

This specification governs the design system, typography, states, layouts, and components that make up the public marketplace frontend.

## 1. Visual Hierarchy & Theme Rules

The Public Discovery portal utilizes a high-contrast, professional, corporate theme with generous negative space to emphasize real estate assets.

* **Colors**:
  * Dark Canvas Backgrounds: `bg-slate-900`, `bg-zinc-950`
  * Typography: Display headings are in Inter (`font-sans font-semibold text-slate-100`) or Outfit for a tech-forward look. Subtext and labels use `text-slate-400`.
  * Accents: Deep Indigo (`text-indigo-400`, `bg-indigo-600`) and Emerald Green (`bg-emerald-500` for `AVAILABLE` status badges).
* **Grid Layouts**:
  * Hero Section: Prominent background overlay displaying high-resolution landscape images, layered with multi-select search and filter forms.
  * Bento Grid (Home Feed): Display items of varied grid sizes to emphasize spotlight listings and developer verification status.

## 2. Interactive Features & State Handling

### A. Responsive Map and Plot Selection
* When interacting with layout grids, individual plots render as color-coded rectangles:
  * **Green (AVAILABLE)**: Interactive, displays hover card showing Plot Number, Area (Sq.Ft), Facing, and Price (INR). Click triggers the Lead Capture drawer.
  * **Red (SOLD)**: Disabled, touch targets non-interactive.
  * **Orange (RESERVED)**: Read-only status indicator.
* Canvas and vector layouts are built using `ResizeObserver` on parent containers to ensure fluidity across desktop and mobile browsers.

### B. Dynamic Search Panel
* Collapsible advanced filter panel supporting sliders for Price Range, Area value, and multiple selection checkbox filters for facing and project types.
* Instantly updates results with smooth exit/entrance animations using `motion` (`motion/react`).
