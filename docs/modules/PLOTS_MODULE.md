# BhoomiOne V3 Plots Module (`mod-plots`)

## Commercial Identity & Entitlements
* **Module ID**: `mod-plots`
* **Module Name**: Plot Inventory
* **Category**: `SELLABLE`
* **Minimum Plan Tier**: `GROWTH`
* **Entitlement Key**: `maps.plots`

## Functional Summary
The Plots Module is a formal, registry-driven plug-and-play module for the BhoomiOne V3 platform. It manages plot boundaries, automated sequential subdivisions (Row and Grid), multi-road frontage intelligence, regulatory planning standard profiles, and full spatial validation against other layers (roads, parks, amenities, and utilities).

## Architecture Highlights
1. **Model & Contracts**: Implements the domain contract in `src/modules/plots/types.ts`.
2. **Registry-driven**: Bootstrapped inside `BhoomiModuleRegistry` in `src/modules/index.ts`.
3. **Advanced Generators**:
   * **Row Alignment**: Computes precise subdivisions along selected road segments.
   * **Grid Layout**: Solves containment fits inside site boundaries while avoiding active roads/parks.
4. **Intelligence Detectors**:
   * Automated road frontage & facing detection.
   * Corner plot classifications.
5. **Validation Engine**: Runs a 21-point structural geometry suite.
