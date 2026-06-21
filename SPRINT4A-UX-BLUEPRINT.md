# Sprint 4A — Interactive Layout Viewer UX Blueprint

This Blueprint details the User Experience (UX), interactive mechanisms, visual behaviors, and responsive layouts designed for the **Interactive CAD Layout Viewer** (Sprint 4A). It guarantees a highly refined, professional presentation focused on responsive usability, clean geometric feedback, and absolute data traceability.

---

## 1. Desktop Layout Specification
* **Structure**: Dual-pane split viewport configuration optimized for widescreen dimensions (min-width: `1024px`).
* **Visual Grid & Stage**:
  - **Left Area (Main Stage, 75% width)**: Fluid, container-bounded SVG vector layout viewport. The stage is framed by an elegant slate-clean background with a micro-inset drop shadow.
  - **Right Area (Properties/Search Panel, 25% width)**: Collapsible sidebar holding the search inputs, layer checklists, and active document statistics.
* **Side Drawer Panel**: The Plot Details Drawer is anchored to the right border of the viewport. When triggered, it slides smoothly from the right side, compressing the main stage slightly or overlaying the sidebar using an elegant spring transition.

---

## 2. Tablet Layout Specification
* **Structure**: Flex-oriented display optimized for medium touch viewports (`768px` to `1023px`).
* **UI Adjustments**:
  - Layer selectors and search inputs are housed in a collapsible top horizontal utility bar or accessible via a dedicated quick-action floating pill.
  - The viewport utilizes the medium-sized SVG document mapped for the `TABLET` render profile (`800 x 600` viewbox).
* **Details Drawer**: On-screen space is preserved by utilizing a partial modal-over slide panel that emerges from the right margin, occupying exactly `40%` of the viewport width.

---

## 3. Mobile Layout Specification
* **Structure**: Single-pane layout with prioritized vector visibility, designed for narrow screens (under `767px`).
* **Mobile Adaptability**:
  - The viewer pulls compile-ready SVG documents target-configured for the `MOBILE` render profile (`450 x 650` viewbox).
  - Search controls and filter categories collapse entirely into an elegant header search bar with a touch-friendly micro-trigger.
* **Bottom Sheet Panel**: Replaces the side drawer. Click results trigger a slide-up sheet anchored to the bottom of the phone screen, occupying `45%` of the vertical viewport. Users can tap outside or swipe down to easily dismiss the sheet.

---

## 4. Layer Controls
Provide direct toggle pills or stylish checkboxes enabling instant visibility manipulation of CAD layer groups.

| Layer Key | System Scope Target | Default State | Visual Style Target |
| :--- | :--- | :---: | :--- |
| **PLOTS** | Land parcels and boundary limits | **Active** | Mapped style profile fills |
| **ROADS** | Main roads and inner access pathways | **Active** | Soft asphalt and street line paths |
| **AMENITIES** | Public spaces, parks, common gardens | **Active** | Clean emerald or garden violet zones |
| **BOUNDARIES** | Exterior layout outline limits | **Active** | Thin dark alignment boundaries |
| **UTILITIES** | Pipeline systems, electrical grids, ducts | *Inactive* | Fine dotted overlay styles |

* **Interactive Toggle Rule**: Changing any checkbox updates the React viewer's local layer visibility state. Geometries corresponding to turned-off layers are dynamically set to `opacity: 0` or `display: none` without repeating server-side page fetches.

---

## 5. Search Experience
Designed of a three-tier direct action execution flow. Typing in the search input searches for matched items inside standard fields (`plot_number`, CAD labels patterns, and system generated titles).

### 🔍 Search Operational Flow Sequence:
1. **Match Detection**: As the user types, matches are compiled in a fast, low-latency dropdown list.
2. **Auto-Center**: Selecting an index item instantly computes the target plot's boundary box centroids $(\bar{x}, \bar{y})$ and translates the SVG coordinate system to center the target element precisely on the screen.
3. **Trigger Highlight**: The selected geometry's boundaries instantly trigger a blinking hover outline transition.
4. **Trigger Details**: The layout drawer slides into view from the screen border, showing complete properties info mapping the user's focus.

---

## 6. Plot Highlight Behavior
Plot selections utilize coordinate elements and styling states to give responsive feedback.

* **Hover Feedbacks (Cursor enters boundary)**:
  - Transition duration: `150ms` using a clean ease-out curve.
  - Micro-scale elevation effect: Opacity increases to standard `1.00`, and border stroke thickens slightly.
  - Displays a miniature, zero-flicker floating tooltip next to the cursor showing current Plot Number and Status badges.
* **Single Click Interaction**:
  - **Action**: Highlight Selected.
  - **Visual Change**: Applies a solid, high-contrast, glowing stroke overlay (defined in styling models) to separate the selected polygon from nearby parcels. Other plots dim slightly to highlight focus.
* **Double Click Interaction**:
  - **Action**: Active Selection + Open Information Drawer.
  - **Visual Change**: Translates view coordinates to center the polygon on screen, flashes boundary colors, and opens the **Plot Details Drawer**.

---

## 7. Plot Details Drawer
The details drawer represents a read-only metadata inspector utilizing Inter and JetBrains Mono typography pairings with generous padding layouts.

### Metadata Rows to Render:
* **Plot Number**: Displayed at the top in large, bold space-grotesque display typography (e.g., `Plot 402-A`).
* **Area**: Calculated value rendered in mono font paired with units (e.g., `2,450.00 Sq.Ft.`).
* **Measurement Unit**: Dynamic standard symbol display (e.g., `Sq.Ft.`, `Sq.M.`).
* **Status Badge**: Heavy high-contrast pill labeled with active states tints (e.g., `AVAILABLE` in emerald green, `RESERVED` in gold amber, etc.).
* **Facing / Orientation**: Direction details (e.g., `Facing: East-North-East`).
* **Road Width**: Dimensions describing access roads widths (e.g., `12.0 Meter Road Width`).
* **Dimensions**: Linear dimensions list describing boundary widths (e.g., `40' x 60'`).
* **Project Context**: Fully-resolved master project name linking layout details.
* **Layout Reference**: Source layout drawing name context.

---

## 8. Future Action Panel Placeholder
To ensure strict scope compliance while guaranteeing easy forward upgrades, a static, descriptive, and read-only **Future Action Panel** is reserved at the bottom of the Plot Details Drawer.

* **Contextual Consideration**: When inventory status is updated dynamically, specific user action configurations will reside here during later phases:
  - **Reserve Trigger Action**: Placeholder button styled in secondary muted gold tints.
  - **Book Trigger Action**: Placeholder button styled in corporate royal blue.
  - **Sell Sales Action**: Placeholder button styled in emerald colors.
* **Compliance Safeguard**: All future actions are explicitly rendered with a clear, unclickable, secondary hover tooltip noting: `"Administrative Actions (Booking, Cashiering, and Contract Sales) will be enabled in Sprint 4B."` No checkout gates, Stripe webhooks, or database mutations are executed.

---

## 9. Accessibility Rules
The Interactive Layout Viewer is designed with inclusive semantic HTML, structured keyboard flows, and strict contrast targets:

* **Screen Reader Traceability**: Every SVG polygon, path, or label tag embeds correct ARIA mapping tags:
  - Root SVG element uses role `"img"` with associated dynamic aria-label (e.g. `aria-label="Responsive Layout Map Vector Version 2"`).
  - Individual polygons use `role="button"` and `aria-label="Plot 402-A, Status: Available, Area: 2450 square feet"`.
* **Keyboard Navigation & Outlines**: Tab key cycling focuses elements in sequence. Focused elements render a default high-contrast dashed accessibility focus ring.
* **Contrast Checks**: All text and state badges maintain a contrast ratio of at least `4.5:1` against their containing container background elements.

---

## 10. Performance Rules
To guarantee fluid rendering and quick interaction feedback under heavy canvas layouts:

* **Styles Resolution**: Geometries must **never** bundle inline hardcoded presentation tags or inline style lists. All properties (fill, stroke, opacity) are resolved from CSS token names linked directly to custom `svg_style_profiles` database templates.
* **DOM Throttling**: Tooltips, hover checks, and click actions are throttled to run within standard animation loops.
* **Debounced Inputs**: Search queries are debounced by `300ms` before triggering database index checks, avoiding continuous re-renders of large SVG coordinate paths.
* **Layout Isolation**: Changes to selection focuses utilize local states, bypassing heavy React context trees to avoid layout reflows across distant application sidebars.

---
*End of UX Blueprint. Clean, structured, accessible, and certified responsive.*
TargetFile: /SPRINT4A-UX-BLUEPRINT.md
Overwrite: true
toolSummary: Create UX Blueprint Design
toolAction: Creating SPRINT4A-UX-BLUEPRINT.md File
