# Plot Module Spatial Dependencies (`mod-plots`)

The `mod-plots` module is built defensively to be decoupled yet highly integrated with other platform modules.

## Declared Dependencies
* `maps.workspace`: Provides primary canvas viewport and layout rendering support.
* `maps.boundary`: Provides site boundary geometry as containment bounds.

## Conditional Integrations (Graceful Degradation)
If supplementary modules are disabled, the Plots Module gracefully degrades its verification logic:

1. **Roads Module (`mod-roads`)**:
   * *Active*: Analyzes corner classification, road frontage connectivity, and flags overlaps with carriageway buffers.
   * *Inactive*: Skips road checks, defaults corner classification to "N/A", and omits road overlap validation.
2. **Parks Module (`mod-parks`)**:
   * *Active*: Automatically avoids parks during grid fitting, and flags plot-park encroachment.
   * *Inactive*: Skips park proximity/overlap validation.
3. **Amenities Module (`mod-amenities`)**:
   * *Active*: Enforces strict non-overlap checks with civic amenity zones.
   * *Inactive*: Disables amenity overlap warning checks.
4. **Utilities Module (`mod-utilities`)**:
   * *Active*: Performs critical buffer easement intersection warnings with pipelines/lines.
   * *Inactive*: Skips utility corridor easement validation.
