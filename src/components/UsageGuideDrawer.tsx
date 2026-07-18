import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, BookOpen, HelpCircle, ArrowLeftRight, CheckCircle, 
  Compass, FileCode2, Layers, Building2, Grid, Percent, 
  LayoutGrid, ChevronRight, GraduationCap, Trophy, Play, Plus
} from "lucide-react";

interface UsageGuideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  projects: any[];
  layouts: any[];
  plots: any[];
  onCreateLayout?: () => void;
}

export default function UsageGuideDrawer({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  projects,
  layouts,
  plots,
  onCreateLayout
}: UsageGuideDrawerProps) {
  // Persist user preference for mode and position
  const [mode, setMode] = useState<"beginner" | "expert">(() => {
    const saved = localStorage.getItem("bhoomione_guide_mode");
    return (saved as "beginner" | "expert") || "beginner";
  });

  const [position, setPosition] = useState<"left" | "right">(() => {
    const saved = localStorage.getItem("bhoomione_guide_position");
    return (saved as "left" | "right") || "right";
  });

  useEffect(() => {
    localStorage.setItem("bhoomione_guide_mode", mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("bhoomione_guide_position", position);
  }, [position]);

  // Determine completions dynamically
  const isDashboardDone = true;
  const isProjectsDone = projects.length > 0;
  const isLayoutsDone = layouts.length > 0;
  const isImportsDone = layouts.length > 0 && plots.length > 0; // CAD or drawn plots exist
  const isMapDone = plots.some(p => p.latitude || p.longitude || p.polygon_ref);
  const isPlotsDone = plots.length > 0;
  const isCommercialDone = true; // Commercial rule defaults exist

  const steps = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid, isDone: isDashboardDone },
    { id: "projects", label: "Projects", icon: Building2, isDone: isProjectsDone },
    { id: "layouts", label: "Layouts", icon: Layers, isDone: isLayoutsDone },
    { id: "cad", label: "Imports", icon: FileCode2, isDone: isImportsDone },
    { id: "viewer", label: "Interactive Map", icon: Compass, isDone: isMapDone },
    { id: "plots", label: "Plots", icon: Grid, isDone: isPlotsDone },
    { id: "commercial", label: "Commercial", icon: Percent, isDone: isCommercialDone }
  ];

  const completedCount = steps.filter(s => s.isDone).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  // Context-aware guides matching activeTab
  const getContextGuide = () => {
    switch (activeTab) {
      case "dashboard":
        return {
          title: "ERP Dashboard",
          tagline: "Your Central Operations Hub",
          beginner: {
            description: "Welcome to BhoomiOne! The main dashboard gives you real-time visibility into overall development activities, recent actions, and compliance checks.",
            prerequisites: "A verified developer tenant profile.",
            tips: [
              "Review the physical plots summary chart.",
              "Track active site construction statuses.",
              "Look at compliance audit logs in the footer to verify your schema isolate."
            ],
            nextStep: "Move to the Projects tab to register your primary land tract."
          },
          expert: {
            description: "Operations Console. Monitor regulatory RERA checklists, background GIS sync states, and high-throughput transaction metrics.",
            prerequisites: "Administrator permission level.",
            tips: [
              "Perform micro-audit log checks.",
              "Inspect cross-schema isolation partitions."
            ],
            nextStep: "Review the system database telemetry or jump to Project settings."
          }
        };
      case "projects":
        return {
          title: "Projects Hub",
          tagline: "Register Development Tracts",
          beginner: {
            description: "Projects are the physical master containers for your layouts. Every development site must be registered here with physical boundaries and village matrix locations.",
            prerequisites: "Basic survey documents or village maps.",
            tips: [
              "Click 'Create Project' in the top right.",
              "Input district, taluk, village parameters.",
              "Verify GPS center coordinates (Latitude, Longitude) for map integration."
            ],
            nextStep: "Create a subdivision Layout Plan for this registered project."
          },
          expert: {
            description: "Property Portfolio Registry. Configure state development authorities, escrow bank setups, and legal land parcels bounds.",
            prerequisites: "RERA registration certificates.",
            tips: [
              "Integrate project boundaries using precise shapefiles.",
              "Bind developers' RERA codes into the meta registry."
            ],
            nextStep: "Map the subdivision phase codes in the Layouts catalog."
          }
        };
      case "layouts":
        return {
          title: "Layout Plans Catalog",
          tagline: "Phase and Sector Subdivisions",
          beginner: {
            description: "Layouts represent sub-sectors, layout phases, or zoning areas inside your parent project. It acts as the physical subdivision grid where individual plots reside.",
            prerequisites: "An active Project.",
            tips: [
              "Filter layouts by selecting your parent project in the dropdown.",
              "Click 'Create Layout' to set zoning rules (Residential, Commercial, Mixed Use).",
              "Set standard measurement units (e.g. Sq. Yards or Sq. Feet) early."
            ],
            nextStep: "Import your CAD architectural blueprint (.dxf file) to auto-generate coordinates."
          },
          expert: {
            description: "Subdivision Phase Ledger. Administer development schedules, zoning variances, and municipal approval numbers.",
            prerequisites: "Town planning approvals & Survey coordinates.",
            tips: [
              "Configure custom phase prefixes for automated coding.",
              "Verify the RERA phase completion matrix parameters."
            ],
            nextStep: "Launch Layout Studio drawing canvas or upload the DXF map blueprint."
          }
        };
      case "cad":
        return {
          title: "CAD Blueprint Imports",
          tagline: "Digital CAD Vector Automation",
          beginner: {
            description: "Instead of drawing every single land tract coordinate by hand, import your CAD blueprint. BhoomiOne parses standard DXF files to auto-detect boundary nodes.",
            prerequisites: "A registered Layout and standard DXF file.",
            tips: [
              "Drag and drop your CAD .dxf file onto the drop-zone.",
              "Verify computed scale factors and layer bounds mapping.",
              "Ensure standard architectural layers are clean for auto-parsing."
            ],
            nextStep: "Launch the Interactive Map to inspect and calibrate coordinate pins."
          },
          expert: {
            description: "Digital Blueprint Parser. High-throughput layer filtering, vertex calibration, and spatial database syncing.",
            prerequisites: "Standard CAD layout coordinates in UTM projection.",
            tips: [
              "Filter layers dynamically to extract precise road network segments.",
              "Overprint coordinate benchmarks with land records department data."
            ],
            nextStep: "Calibrate geographic anchor coordinates on the Interactive Map."
          }
        };
      case "viewer":
        return {
          title: "Interactive Map Workspace",
          tagline: "GIS Studio Drawing Engine",
          beginner: {
            description: "Welcome to the Map Workspace! This is a complete geographic map interface. Visually draw, scale, edit, and subdivisions boundaries.",
            prerequisites: "A selected Layout with a calibrated project bounds.",
            tips: [
              "Click 'Launch Layout Studio' to begin visual coordinate editing.",
              "Drag-and-drop roads and physical markers onto the map grid.",
              "Confirm visual overlaps are corrected before saving."
            ],
            nextStep: "Go to the Plots tab to configure commercial pricing and status ledgers."
          },
          expert: {
            description: "Geospatial GIS Canvas. Subdivide plot boundaries visually, manage vertex snap rules, and calculate real area polygons.",
            prerequisites: "Map Studio permissions and project bounds.",
            tips: [
              "Adjust boundary nodes with pixel-perfect snap assistance.",
              "Bind individual vector parcels to automated billing records."
            ],
            nextStep: "Execute split/merge bulk operations in the physical plot ledger."
          }
        };
      case "plots":
        return {
          title: "Land Parcels Inventory",
          tagline: "Marketable Plot Ledgers",
          beginner: {
            description: "This is your list of individual marketable land units. Track status changes (Available, Reserved, Booked, Sold), sizes, and physical facing angles.",
            prerequisites: "Subdivided parcels generated from Interactive Map / CAD.",
            tips: [
              "Filter plots by Layout to find specific inventory instantly.",
              "Click on any row to open the Dynamic Technical Inspector panel on the right.",
              "Configure physical facings (e.g., East Facing, Corner Plot) for custom premiums."
            ],
            nextStep: "Go to the Commercial tab to configure tax rules for booking sales."
          },
          expert: {
            description: "Physical Plot Inventory Matrix. Perform bulk status changes, dimension adjustments, and split/merge operations.",
            prerequisites: "Active developer inventory management clearance.",
            tips: [
              "Select multiple plots using checkboxes to trigger the Bulk Action toolbar.",
              "Trigger 'Split Plot' or 'Merge Selection' to alter physical boundaries."
            ],
            nextStep: "Establish payment structures in the Commercial Tax Console."
          }
        };
      case "commercial":
        return {
          title: "Commercial & Tax Engine",
          tagline: "Taxes and Sales Charges Controls",
          beginner: {
            description: "Configure commercial settings for your real estate developments. Define local development taxes, RERA charges, TDS parameters, and state levies.",
            prerequisites: "An active land parcel ledger database.",
            tips: [
              "Review default builder-specific tax rates.",
              "Ensure TDS parameters are set correctly for plot bookings.",
              "Adjust regional overrides to conform with district municipal policies."
            ],
            nextStep: "Your Tenant ERP setup is complete! Go to Dashboard to monitor active leads."
          },
          expert: {
            description: "Financial Control Console. Administer Escrow accounts, custom tax classes, and progressive payments ledger triggers.",
            prerequisites: "Finance officer access level.",
            tips: [
              "Set custom tax classes for commercial vs residential zones.",
              "Configure receipt template triggers for instant booking ledger sync."
            ],
            nextStep: "Proceed with live plotting sales and buyer registration workflows."
          }
        };
      default:
        return null;
    }
  };

  const guide = getContextGuide();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 transition-opacity"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: position === "right" ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: position === "right" ? "100%" : "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed inset-y-0 ${position === "right" ? "right-0" : "left-0"} w-full sm:w-[440px] bg-white border-${position === "right" ? "l" : "r"} border-slate-200 shadow-2xl z-50 flex flex-col h-full`}
            id="usage-guide-drawer-panel"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">BhoomiOne V3 Guide</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Contextual ERP Onboarding Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Position Switcher */}
                <button
                  onClick={() => setPosition(prev => prev === "right" ? "left" : "right")}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg border border-slate-200 hover:bg-white transition-all"
                  title={`Dock to ${position === "right" ? "Left" : "Right"}`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </button>
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Beginner/Expert Mode Toggle & Overall Progress */}
            <div className="p-5 border-b border-slate-100 space-y-4">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                <button
                  onClick={() => setMode("beginner")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    mode === "beginner" ? "bg-white text-indigo-700 shadow-sm border border-slate-200/30" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Beginner Mode</span>
                </button>
                <button
                  onClick={() => setMode("expert")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    mode === "expert" ? "bg-white text-indigo-700 shadow-sm border border-slate-200/30" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Expert Mode</span>
                </button>
              </div>

              {/* Progress Tracker Card */}
              <div className="bg-gradient-to-br from-indigo-50/60 to-slate-50 border border-indigo-100/80 p-4 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    Workflow Progress
                  </span>
                  <span className="text-xs font-bold font-mono text-indigo-700 bg-white border border-indigo-100 px-2 py-0.5 rounded-lg">
                    {progressPercent}% Complete
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-3">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Micro Steps Map */}
                {layouts.length === 0 ? (
                  <div className="mt-2 bg-white border border-slate-200/60 rounded-xl p-3.5 space-y-2.5 shadow-3xs" id="guide-progress-checklist">
                    <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs">
                      <span className="text-sm">✔</span>
                      <span>Project</span>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-650 font-extrabold text-xs animate-pulse">
                      <span className="text-sm">▶</span>
                      <span>Create Layout</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Remaining steps</span>
                      <ul className="space-y-1.5 text-xs text-slate-500 font-semibold pl-1.5 list-none">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span>Imports</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span>Interactive Map</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span>Plots</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span>Commercial</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {steps.map((step, idx) => {
                      const stepIcon = step.icon;
                      const isStepActive = activeTab === step.id;
                      return (
                        <button
                          key={step.id}
                          onClick={() => setActiveTab(step.id)}
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all ${
                            isStepActive 
                              ? "bg-indigo-650 text-white border-indigo-750 shadow-sm" 
                              : step.isDone
                                ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                          }`}
                          title={`${step.label}: ${step.isDone ? "Done" : "Pending"}`}
                        >
                          {step.isDone ? (
                            <CheckCircle className={`w-3 h-3 ${isStepActive ? "text-white" : "text-emerald-600"}`} />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          )}
                          <span>{idx + 1}. {step.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable Contextual Guidance Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {guide ? (
                <div className="space-y-5 animate-fadeIn">
                  {/* Context Header */}
                  <div>
                    <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Module {steps.findIndex(s => s.id === activeTab) + 1} of {steps.length}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-1">{guide.title}</h4>
                    <p className="text-xs text-slate-500 italic mt-0.5">{guide.tagline}</p>
                  </div>

                  {/* Mode Content */}
                  {mode === "beginner" ? (
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5 shadow-3xs">
                        <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">Description</h5>
                        <p className="text-xs text-slate-600 leading-relaxed">{guide.beginner.description}</p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5 shadow-3xs">
                        <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">Actionable Checklist</h5>
                        <ul className="space-y-2">
                          {guide.beginner.tips.map((tip, i) => (
                            <li key={i} className="flex gap-2 text-xs text-slate-600 leading-normal">
                              <span className="text-indigo-500 font-bold font-mono">[{i + 1}]</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5 shadow-3xs">
                        <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">Prerequisites</h5>
                        <p className="text-xs text-slate-600 bg-amber-50/50 border border-amber-100/60 p-2.5 rounded-lg leading-relaxed">{guide.beginner.prerequisites}</p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-indigo-100 space-y-2.5 shadow-3xs">
                        <h5 className="font-bold text-xs text-indigo-800 uppercase tracking-wider border-b border-indigo-50 pb-1.5 flex items-center gap-1.5">
                          <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                          <span>{layouts.length === 0 ? "Create First Layout" : "Recommended Next Action"}</span>
                        </h5>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">
                          {layouts.length === 0 
                            ? "Configure a subdivision layout design plan for your physical master projects." 
                            : guide.beginner.nextStep}
                        </p>
                        {layouts.length === 0 && onCreateLayout && (
                          <button
                            onClick={onCreateLayout}
                            className="w-full bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer border-0 flex items-center justify-center gap-1.5 mt-2 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create First Layout</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-slate-900 p-4 rounded-xl text-slate-350 space-y-3 shadow-md border border-slate-800 font-sans">
                        <h5 className="font-bold text-xs text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">Enterprise Architecture Note</h5>
                        <p className="text-xs leading-relaxed text-slate-300">{guide.expert.description}</p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5 shadow-3xs">
                        <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">System Administration Checklist</h5>
                        <ul className="space-y-2">
                          {guide.expert.tips.map((tip, i) => (
                            <li key={i} className="flex gap-2 text-xs text-slate-600 leading-normal">
                              <span className="text-emerald-600 font-extrabold font-mono">&bull;</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5 shadow-3xs">
                        <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">Required Clearances</h5>
                        <p className="text-xs text-slate-600 bg-emerald-50/40 border border-emerald-100/60 p-2.5 rounded-lg leading-relaxed">{guide.expert.prerequisites}</p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-indigo-100 space-y-2.5 shadow-3xs">
                        <h5 className="font-bold text-xs text-indigo-800 uppercase tracking-wider border-b border-indigo-50 pb-1.5 flex items-center gap-1.5">
                          <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                          <span>{layouts.length === 0 ? "Create First Layout" : "Recommended Next Action"}</span>
                        </h5>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">
                          {layouts.length === 0 
                            ? "Configure a subdivision layout design plan for your physical master projects." 
                            : guide.expert.nextStep}
                        </p>
                        {layouts.length === 0 && onCreateLayout && (
                          <button
                            onClick={onCreateLayout}
                            className="w-full bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer border-0 flex items-center justify-center gap-1.5 mt-2 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create First Layout</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs">Select any module above to view contextual guidance.</p>
                </div>
              )}
            </div>

            {/* Footer Contact Help Card */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-center text-[11px] text-slate-400 font-mono flex justify-between items-center">
              <span>BhoomiOne Enterprise V3.0</span>
              <span className="text-indigo-600 font-semibold cursor-pointer hover:underline" onClick={() => window.open("mailto:support@bhoomione.in", "_self")}>Get support</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
