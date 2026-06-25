# Mobile Applet Architecture & Responsiveness

BhoomiOne is engineered to be fully responsive, supporting surveyor tablets on-site and buyer smartphones on-the-go.

---

## 📱 Responsive Layout Strategy

The platform employs a Mobile-First layout configuration utilizing Tailwind CSS breakpoints:

* **Smartphone Views (`< 768px`)**:
  * Persistent drawer menus collapse into an overlay sidebar.
  * CAD drawing canvases default to single-finger touch-and-drag panning gestures.
  * Plot tables transform into swipeable card arrays.
* **Tablet Views (`768px - 1024px`)**:
  * Unlocks side-by-side splits displaying maps on the left and dynamic CRM detail sliders on the right.
  * Adjusts touch targets to a minimum of 44px to prevent miss-clicks during on-site surveying.
* **Desktop Views (`> 1024px`)**:
  * Fixed, dense control rails.
  * Unlocks full CAD layer mapping studios.

---

## 👆 Touch Navigation & Gesture Translators

The React Canvas component utilizes custom pointer listeners to detect and transform gestures:
* **Single Touch Drag**: Translated to grid coordinates translation vectors, enabling smooth panning.
* **Pinch Gesture**: Detects the distance changes between two coordinates, calculating responsive canvas zoom vectors.
* **Double Tap**: Resolves targeted elements instantly, centering views directly onto the selected plot boundary.
* **Debouncing Window Resizes**: `ResizeObserver` monitors canvas bounds dynamically, refreshing coordinates mappings to prevent vector blurring during device rotation.
