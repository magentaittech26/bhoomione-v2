# BhoomiOne V3 – Master UI Standard

To maintain a consistent, predictable admin experience across the BhoomiOne platform, every Master Data Management console must inherit the layout, styling, and action flows outlined in this visual specification.

---

## 1. Core Layout and Views

Each Master Console must support two primary view modes, toggled by a segmented tab controller in the header:
1.  **Table View (Default)**: Optimized for fast, dense, cross-row scanning. Recommended for power users.
2.  **Card View**: Optimized for highly scannable, visually distinct, block-based navigation. Recommended for tablet screens or simple masters with custom properties.

```
+-------------------------------------------------------------------------------+
|  Administration  >  Master Data Management  >  [Master Module Title]          |
+-------------------------------------------------------------------------------+
|  [Search Input]  [Filter: Status]  [Filter: Region]      [Grid / List Toggle]  |
+-------------------------------------------------------------------------------+
|  [Bulk Actions bar: (Activate | Deactivate | Export | Delete) ] (Visible on multi-select)|
+-------------------------------------------------------------------------------+
|                                                                               |
|  [                     Main Records Area: Table / Cards                     ] |
|                                                                               |
+-------------------------------------------------------------------------------+
|  Showing 1 - 50 of 241 records                         [Prev] Page 1 of 5 [Next] |
+-------------------------------------------------------------------------------+
```

---

## 2. Mandatory Console Features

### A. Integrated Search and Filtering
*   **Omni-Search Bar**: Case-insensitive instant filtering against `code`, `name`, `display_name`, and `short_code`.
*   **Status Filter**: Dropdown filtering to toggle between "All Statuses", "Active Only", and "Inactive Only".
*   **Regional Scope Filter**: Dropdown selection to filter by geographic region (Country/State).

### B. Bulk Selection and Multi-Actions
Users must be able to select multiple master records via standard row/card checkboxes. Selecting two or more records triggers the **Floating Bulk Actions Bar**:
*   **Bulk Activate**: Toggle status to active for all selected records.
*   **Bulk Deactivate**: Toggle status to inactive for all selected records.
*   **Bulk Export**: Export only selected rows into a CSV or JSON payload.

### C. Dependency Viewer & Usage Indicator
Every row/card must display a **Usage Indicator** badge:
*   Shows the number of connected entities using this record (e.g., `"Used in 14 Plots"`).
*   Clicking the indicator opens a sliding side drawer or modal detailing the connected elements (the **Dependency Viewer**).
*   If the usage count is greater than zero, the "Delete" action is deactivated and visually struck through, displaying a tooltip explaining the delete lock.

### D. Audit Trail Panel
Every record editor modal or detail page must contain a link to the **Audit History**:
*   Renders a timeline of who created, edited, activated, or deactivated the record.
*   Shows a visual diff of changed values (e.g., changes to conversion factors or display orders).

---

## 3. Styling and Design Tokens

All master consoles are built using Tailwind CSS and inherit the primary **BhoomiOne Enterprise Slate** aesthetic:
*   **Canvas Background**: Soft off-white (`bg-slate-50/50`) or subtle dark slate (`bg-slate-900`) when dark mode is explicitly loaded.
*   **Containers**: Clean white panels (`bg-white`) bordered with fine borders (`border-slate-100` or `border-slate-200`) and rounded corners (`rounded-xl` or `rounded-2xl`).
*   **Typography Pairing**: Display titles use **Space Grotesk** (`font-sans tracking-tight font-semibold text-slate-800`), while data/code cells use **JetBrains Mono** (`font-mono text-xs text-slate-500`).
*   **Interaction States**: Hover actions on buttons and rows must provide smooth, deliberate, micro-animated feedback (`transition-all duration-200 hover:bg-slate-100`).
