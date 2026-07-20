import { PlanningProfile, PlotType } from "../types.ts";

export const LegalComplianceNotice = 
  "Planning defaults are guidance values and must be verified against applicable local authority regulations.";

export const PLANNING_PROFILES: Record<string, PlanningProfile> = {
  generic: {
    id: "generic",
    name: "Generic (Standard)",
    defaultPlotType: "Residential",
    defaultFrontage: 9.0, // 30 feet ~ 9 meters
    defaultDepth: 12.0,   // 40 feet ~ 12 meters
    minArea: 100,        // sqm
    minFrontage: 6.0,    // meters
    minDepth: 9.0,       // meters
    maxAspectRatio: 3.5,
    legalNotice: LegalComplianceNotice
  },
  karnataka: {
    id: "karnataka",
    name: "Karnataka (K Town Planning Act)",
    defaultPlotType: "Residential",
    defaultFrontage: 9.15, // 30 feet
    defaultDepth: 15.24,  // 50 feet
    minArea: 108.0,      // 1200 sqft standard (30x40 is 1200, 30x50 is 1500)
    minFrontage: 9.0,    // 30 ft
    minDepth: 12.0,      // 40 ft
    maxAspectRatio: 3.0,
    legalNotice: `Karnataka Plan: ${LegalComplianceNotice} Refer to K Town & Country Planning (KTCP) regulations.`
  },
  goa: {
    id: "goa",
    name: "Goa (TCP Regulations)",
    defaultPlotType: "Villa",
    defaultFrontage: 12.0,
    defaultDepth: 18.0,
    minArea: 250.0,       // Larger plots for villa layouts
    minFrontage: 10.0,
    minDepth: 15.0,
    maxAspectRatio: 2.5,
    legalNotice: `Goa Plan: ${LegalComplianceNotice} Refer to Goa Land Development and Building Construction Regulations.`
  },
  maharashtra: {
    id: "maharashtra",
    name: "Maharashtra (UDCPR Standards)",
    defaultPlotType: "Residential",
    defaultFrontage: 8.0,
    defaultDepth: 12.0,
    minArea: 150.0,
    minFrontage: 8.0,
    minDepth: 12.0,
    maxAspectRatio: 4.0,
    legalNotice: `Maharashtra Plan: ${LegalComplianceNotice} Refer to Maharashtra Unified Development Control and Promotion Regulations (UDCPR).`
  },
  custom: {
    id: "custom",
    name: "Custom Workspace Profile",
    defaultPlotType: "Residential",
    defaultFrontage: 10.0,
    defaultDepth: 15.0,
    minArea: 150.0,
    minFrontage: 6.0,
    minDepth: 8.0,
    maxAspectRatio: 3.0,
    legalNotice: LegalComplianceNotice
  }
};

export interface PlotModuleSettings {
  activeProfile: string;
  defaultPlotType: PlotType;
  defaultFrontage: number;
  defaultDepth: number;
  minArea: number;
  minFrontage: number;
  minDepth: number;
  maxAspectRatio: number;
  numberingPattern: string; // e.g., "P-{num}" or "B1-{num}" or "001"
  measurementUnits: "metric" | "imperial";
  facingMethod: "road-closest" | "manual";
  snapTolerance: number; // pixels
  autoNumberEnabled: boolean;
  cornerDetectionEnabled: boolean;
  validationProfile: string;
}

export const DEFAULT_PLOT_SETTINGS: PlotModuleSettings = {
  activeProfile: "generic",
  defaultPlotType: "Residential",
  defaultFrontage: 9.0,
  defaultDepth: 12.0,
  minArea: 100,
  minFrontage: 6.0,
  minDepth: 9.0,
  maxAspectRatio: 3.5,
  numberingPattern: "{num}",
  measurementUnits: "metric",
  facingMethod: "road-closest",
  snapTolerance: 10,
  autoNumberEnabled: true,
  cornerDetectionEnabled: true,
  validationProfile: "standard"
};
