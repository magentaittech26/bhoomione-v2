# Plot Subdivision Generation Algorithms

The Plots Module provides two automated mass subdivision engines:

## 1. Row Alignment Subdivision
Generates plot bounds sequentially along a selected road edge vector.
* **Math Model**:
  1. Retrieves selected road alignment vertices.
  2. Projects perpendicular vectors down/up depending on the specified side (`left` or `right`).
  3. Extrapolates depth and spacing gaps between sequential lots.
* **Corner Treatment**: Allows expanding the first or last lot by a +25% depth factor.
* **Remainder Handling**: Distributes leftovers evenly across generated frontage, terminates with irregular residual slices, or keeps remaining space as green buffer.

## 2. Mass Grid Area Subdivision
Fits a grid of plots inside the site boundary while respecting layout corridors.
* **Math Model**:
  1. Computes the bounding box of the Site Boundary limit.
  2. Sets up a grid mesh rotated to the specified direction slider.
  3. Uses Ray-Casting (`isPointInPolygon`) to ensure each coordinate vertex of a candidate plot lies strictly within the boundary limit.
  4. Avoids overlaps with active roads, parks, and other layout zones using SAT (Separating Axis Theorem) collision detection.
