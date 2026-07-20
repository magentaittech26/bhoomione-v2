import React, { useState, useEffect } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import api from "../lib/api.ts";
import { useMeasurementUnits } from "../hooks/useMeasurementUnits.ts";
import { BhoomiModuleRegistry } from "../modules/spatial-core/registry/index.ts";
import { UserProfile } from "../types/auth.ts";
import { CADImportManager } from "./CADImportManager.tsx";
import LayoutWorkspace from "./LayoutWorkspace.tsx";
import InteractiveLayoutViewer from "./InteractiveLayoutViewer.tsx";
import MapWorkspaceIndex from "./MapWorkspace/index.tsx";
import { EnterpriseTaxConsole } from "./saas/EnterpriseTaxConsole.tsx";
import UsageGuideDrawer from "./UsageGuideDrawer.tsx";
import {
  BookOpen,
  Building2,
  FileCode2,
  Layers,
  Compass,
  Trash2,
  Edit,
  Plus,
  RefreshCw,
  AlertCircle,
  Check,
  Scale,
  Calendar,
  Tag,
  MapPin,
  FileText,
  User,
  Info,
  Maximize2,
  ChevronRight,
  Search,
  Filter,
  CheckSquare,
  Square,
  Grid,
  Settings2,
  SlidersHorizontal,
  Activity,
  LayoutGrid,
  Download,
  List,
  Percent,
  Archive,
  RotateCcw,
  Copy,
  Move,
  Scissors,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Users,
  BarChart3,
  FolderOpen,
  Settings,
  X,
  Sliders,
  Cpu,
  ShieldCheck,
  ChevronDown,
  AlignLeft,
  Award,
  Zap
} from "lucide-react";

interface InventoryManagerProps {
  user: UserProfile;
  onAuditLogged?: (log: any) => void;
}

// Safe JSON conversion wrapper
const tryParseJSON = (val: any, fallback: any = {}) => {
  if (val === null || val === undefined) {
    return fallback;
  }
  if (typeof val === "object") {
    return val;
  }
  try {
    if (typeof val === "string") {
      return JSON.parse(val);
    }
  } catch {
    // ignore parsing error, return fallback
  }
  return fallback;
};

export default function InventoryManager({ user, onAuditLogged }: InventoryManagerProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "projects" | "layouts" | "plots" | "cad" | "viewer" | "marketplace" | "commercial">("dashboard");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [projectWorkspaceTab, setProjectWorkspaceTab] = useState<"overview" | "layouts" | "plots" | "sales" | "customers" | "documents" | "reports" | "settings">("overview");
  const [plotDisplayMode, setPlotDisplayMode] = useState<"spreadsheet" | "card">("spreadsheet");
  const hasSetInitialTab = React.useRef(false);

  // --- MARKETPLACE STATES (Phase 2B) ---
  const [developerProfile, setDeveloperProfile] = useState<any>({
    company_name: "",
    logo: "",
    cover_image: "",
    description: "",
    rera_number: "",
    office_address: "",
    website: "",
    phone: "",
    email: "",
    social_links: "{}",
    completed_projects: 0,
    active_projects: 0,
    years_in_business: 0,
    verification_status: "PENDING",
    rating: "4.5"
  });
  const [marketplaceLeads, setMarketplaceLeads] = useState<any[]>([]);
  const [mStats, setMStats] = useState<any>(null);
  const [seoForm, setSeoForm] = useState<{ id: string; name: string; title: string; desc: string; keywords: string } | null>(null);
  
  // Dynamic Datasets
  const [projects, setProjects] = useState<any[]>([]);
  const [layouts, setLayouts] = useState<any[]>([]);
  const [plots, setPlots] = useState<any[]>([]);
  const { units } = useMeasurementUnits();

  // Selection/Dropdown references (Lookup Tables)
  const [lookupProjects, setLookupProjects] = useState<any[]>([]);
  const [lookupLayouts, setLookupLayouts] = useState<any[]>([]);

  // Total server record counts matching filters
  const [totalProj, setTotalProj] = useState(0);
  const [totalLay, setTotalLay] = useState(0);
  const [totalPlot, setTotalPlot] = useState(0);

  // Sorting configurations
  const [projSortBy, setProjSortBy] = useState("created_at");
  const [projSortDir, setProjSortDir] = useState<"asc" | "desc">("desc");

  const [laySortBy, setLaySortBy] = useState("created_at");
  const [laySortDir, setLaySortDir] = useState<"asc" | "desc">("desc");

  const [plotSortBy, setPlotSortBy] = useState("created_at");
  const [plotSortDir, setPlotSortDir] = useState<"asc" | "desc">("desc");
  
  // Loading & Feedback
  const [loading, setLoading] = useState<boolean>(false);
  const [isSavingProject, setIsSavingProject] = useState<boolean>(false);
  const [errorMess, setErrorMess] = useState<string | null>(null);
  const [successMess, setSuccessMess] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState<boolean>(false);

  const handleStateChange = async (stateIdOrOther: string) => {
    if (stateIdOrOther === "OTHER" || !stateIdOrOther) {
      setSelectedStateId(stateIdOrOther);
      setSelectedDistrictId("");
      setSelectedTalukId("");
      setDistricts([]);
      setTaluks([]);
      setCities([]);
      setVillages([]);
      setManualState(stateIdOrOther === "OTHER");
      setManualDistrict(true);
      setManualTaluk(true);
      setManualCity(true);
      setManualVillage(true);
      setFormProj((prev) => ({
        ...prev,
        state: stateIdOrOther === "OTHER" ? prev.state : "",
        district: "",
        taluk: "",
        location: "",
        village: ""
      }));
      return;
    }

    const stateObj = states.find((s) => String(s.id) === stateIdOrOther);
    setSelectedStateId(stateIdOrOther);
    setSelectedDistrictId("");
    setSelectedTalukId("");
    setManualState(false);
    setManualDistrict(false);
    setDistricts([]);
    setTaluks([]);
    setCities([]);
    setVillages([]);
    setFormProj((prev) => ({
      ...prev,
      state: stateObj ? stateObj.name : "",
      district: "",
      taluk: "",
      location: "",
      village: ""
    }));

    setLoadingLoc((prev) => ({ ...prev, districts: true }));
    setLocationApiError(null);
    try {
      const res = await api.fetchDistricts(stateIdOrOther);
      setDistricts(res.data || res || []);
    } catch (err) {
      console.error("Error loading districts:", err);
      setLocationApiError("Failed to fetch districts.");
    } finally {
      setLoadingLoc((prev) => ({ ...prev, districts: false }));
    }
  };

  const handleDistrictChange = async (districtIdOrOther: string) => {
    if (districtIdOrOther === "OTHER" || !districtIdOrOther) {
      setSelectedDistrictId(districtIdOrOther);
      setSelectedTalukId("");
      setTaluks([]);
      setCities([]);
      setVillages([]);
      setManualDistrict(districtIdOrOther === "OTHER");
      setManualTaluk(true);
      setManualCity(true);
      setManualVillage(true);
      setFormProj((prev) => ({
        ...prev,
        district: districtIdOrOther === "OTHER" ? prev.district : "",
        taluk: "",
        location: "",
        village: ""
      }));
      return;
    }

    const distObj = districts.find((d) => String(d.id) === districtIdOrOther);
    setSelectedDistrictId(districtIdOrOther);
    setSelectedTalukId("");
    setManualDistrict(false);
    setManualTaluk(false);
    setManualCity(false);
    setTaluks([]);
    setCities([]);
    setVillages([]);
    setFormProj((prev) => ({
      ...prev,
      district: distObj ? distObj.name : "",
      taluk: "",
      location: "",
      village: ""
    }));

    setLoadingLoc((prev) => ({ ...prev, taluks: true, cities: true }));
    setLocationApiError(null);
    try {
      const [talukRes, cityRes] = await Promise.all([
        api.fetchTaluks(districtIdOrOther),
        api.fetchCities(districtIdOrOther)
      ]);
      setTaluks(talukRes.data || talukRes || []);
      setCities(cityRes.data || cityRes || []);
    } catch (err) {
      console.error("Error loading taluks/cities:", err);
      setLocationApiError("Failed to fetch taluks and cities.");
    } finally {
      setLoadingLoc((prev) => ({ ...prev, taluks: false, cities: false }));
    }
  };

  const handleTalukChange = async (talukIdOrOther: string) => {
    if (talukIdOrOther === "OTHER" || !talukIdOrOther) {
      setSelectedTalukId(talukIdOrOther);
      setVillages([]);
      setManualTaluk(talukIdOrOther === "OTHER");
      setManualVillage(true);
      setFormProj((prev) => ({
        ...prev,
        taluk: talukIdOrOther === "OTHER" ? prev.taluk : "",
        village: ""
      }));
      return;
    }

    const talukObj = taluks.find((t) => String(t.id) === talukIdOrOther);
    setSelectedTalukId(talukIdOrOther);
    setManualTaluk(false);
    setManualVillage(false);
    setVillages([]);
    setFormProj((prev) => ({
      ...prev,
      taluk: talukObj ? talukObj.name : "",
      village: ""
    }));

    setLoadingLoc((prev) => ({ ...prev, villages: true }));
    setLocationApiError(null);
    try {
      const res = await api.fetchVillages(talukIdOrOther);
      setVillages(res.data || res || []);
    } catch (err) {
      console.error("Error loading villages:", err);
      setLocationApiError("Failed to fetch villages.");
    } finally {
      setLoadingLoc((prev) => ({ ...prev, villages: false }));
    }
  };

  const handleCityChange = (cityIdOrOther: string) => {
    if (cityIdOrOther === "OTHER" || !cityIdOrOther) {
      setManualCity(cityIdOrOther === "OTHER");
      setFormProj((prev) => ({
        ...prev,
        location: cityIdOrOther === "OTHER" ? prev.location : ""
      }));
      return;
    }

    const cityObj = cities.find((c) => String(c.id) === cityIdOrOther || c.name === cityIdOrOther);
    setManualCity(false);
    setFormProj((prev) => ({
      ...prev,
      location: cityObj ? cityObj.name : cityIdOrOther,
      latitude: cityObj && cityObj.latitude ? String(cityObj.latitude) : prev.latitude,
      longitude: cityObj && cityObj.longitude ? String(cityObj.longitude) : prev.longitude,
    }));

    if (cityObj) {
      api.fetchPincodes(cityObj.id, undefined).then((pincodesRes) => {
        const pincodesList = pincodesRes.data || pincodesRes || [];
        if (pincodesList.length > 0) {
          setFormProj((prev) => ({
            ...prev,
            pincode: pincodesList[0].pincode,
          }));
        }
      }).catch(err => console.error("Error fetching pincodes for city:", err));
    }
  };

  const handleVillageChange = (villageIdOrOther: string) => {
    if (villageIdOrOther === "OTHER" || !villageIdOrOther) {
      setManualVillage(villageIdOrOther === "OTHER");
      setFormProj((prev) => ({
        ...prev,
        village: villageIdOrOther === "OTHER" ? prev.village : ""
      }));
      return;
    }

    const vilObj = villages.find((v) => String(v.id) === villageIdOrOther || v.name === villageIdOrOther);
    setManualVillage(false);
    setFormProj((prev) => ({
      ...prev,
      village: vilObj ? vilObj.name : villageIdOrOther,
      latitude: vilObj && vilObj.latitude ? String(vilObj.latitude) : prev.latitude,
      longitude: vilObj && vilObj.longitude ? String(vilObj.longitude) : prev.longitude,
    }));

    if (vilObj) {
      api.fetchPincodes(undefined, vilObj.id).then((pincodesRes) => {
        const pincodesList = pincodesRes.data || pincodesRes || [];
        if (pincodesList.length > 0) {
          setFormProj((prev) => ({
            ...prev,
            pincode: pincodesList[0].pincode,
          }));
        }
      }).catch(err => console.error("Error fetching pincodes for village:", err));
    }
  };

  // Inspection Drawer Focus
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<any | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<any | null>(null);
  const [returnToViewerAfterSave, setReturnToViewerAfterSave] = useState(false);

  const hasRestoredSession = React.useRef(false);
  const prevProjectIdRef = React.useRef<string | null>(null);

  // Sync selectedProject and selectedLayout state changes back to URL parameters
  useEffect(() => {
    const url = new URL(window.location.href);
    let changed = false;

    const currentProjId = selectedProject ? String(selectedProject.id) : null;
    const currentLayId = selectedLayout ? String(selectedLayout.id) : null;

    if (url.searchParams.get("projectId") !== currentProjId) {
      if (currentProjId) {
        url.searchParams.set("projectId", currentProjId);
      } else {
        url.searchParams.delete("projectId");
        url.searchParams.delete("layoutId");
      }
      changed = true;
    }

    if (url.searchParams.get("layoutId") !== currentLayId) {
      if (currentLayId) {
        url.searchParams.set("layoutId", currentLayId);
      } else {
        url.searchParams.delete("layoutId");
      }
      changed = true;
    }

    if (changed) {
      window.history.pushState(null, "", url.pathname + url.search);
    }
  }, [selectedProject, selectedLayout]);

  // Sync state from URL parameters or restore session when lookup lists are populated
  useEffect(() => {
    if (lookupProjects.length > 0 && !hasRestoredSession.current) {
      const urlParams = new URLSearchParams(window.location.search);
      const projIdFromUrl = urlParams.get("projectId");
      const layIdFromUrl = urlParams.get("layoutId");

      if (projIdFromUrl) {
        // URL takes precedence over stored session
        const matchedProj = lookupProjects.find(p => String(p.id) === String(projIdFromUrl));
        if (matchedProj && (!selectedProject || String(selectedProject.id) !== String(projIdFromUrl))) {
          setSelectedProject(matchedProj);
        }
        if (layIdFromUrl && lookupLayouts.length > 0) {
          const matchedLay = lookupLayouts.find(l => String(l.id) === String(layIdFromUrl));
          if (matchedLay && (!selectedLayout || String(selectedLayout.id) !== String(layIdFromUrl))) {
            setSelectedLayout(matchedLay);
          }
        }
      } else {
        // Restore from stored session
        const lastProjId = localStorage.getItem("bhoomi_last_project_id");
        const lastActiveTab = localStorage.getItem("bhoomi_last_active_tab") as any;
        const lastProjWorkspaceTab = localStorage.getItem("bhoomi_last_project_workspace_tab") as any;

        if (lastProjId) {
          const matchedProj = lookupProjects.find(p => String(p.id) === String(lastProjId));
          if (matchedProj) {
            setSelectedProject(matchedProj);
            
            if (lastActiveTab) {
              setActiveTab(lastActiveTab);
            }
            if (lastProjWorkspaceTab) {
              setProjectWorkspaceTab(lastProjWorkspaceTab);
            }

            const lastLayoutId = localStorage.getItem("bhoomi_last_layout_id");
            if (lastLayoutId && lookupLayouts.length > 0) {
              const matchedLay = lookupLayouts.find(l => String(l.id) === String(lastLayoutId));
              if (matchedLay) {
                setSelectedLayout(matchedLay);
              }
            }
          }
        } else if (lastActiveTab) {
          setActiveTab(lastActiveTab);
        }
      }
      hasRestoredSession.current = true;
    }
  }, [lookupProjects, lookupLayouts]);

  // Restore project-specific module session when project selection changes
  useEffect(() => {
    if (selectedProject) {
      if (prevProjectIdRef.current !== String(selectedProject.id)) {
        prevProjectIdRef.current = String(selectedProject.id);
        const savedProjState = localStorage.getItem(`bhoomi_project_module_${selectedProject.id}`);
        if (savedProjState) {
          try {
            const restored = JSON.parse(savedProjState);
            if (restored.activeTab) {
              setActiveTab(restored.activeTab);
            }
            if (restored.projectWorkspaceTab) {
              setProjectWorkspaceTab(restored.projectWorkspaceTab);
            }
            if (restored.layoutId && lookupLayouts.length > 0) {
              const matchedLay = lookupLayouts.find(l => String(l.id) === String(restored.layoutId));
              if (matchedLay) {
                setSelectedLayout(matchedLay);
              }
            }
          } catch (e) {
            console.error("Failed to restore project module state", e);
          }
        }
      }
    } else {
      prevProjectIdRef.current = null;
    }
  }, [selectedProject, lookupLayouts]);

  // Continuously save session state to localStorage
  useEffect(() => {
    if (hasRestoredSession.current) {
      if (selectedProject) {
        localStorage.setItem("bhoomi_last_project_id", String(selectedProject.id));
        
        // Save project-specific module context
        const projState = {
          activeTab,
          projectWorkspaceTab,
          layoutId: selectedLayout ? String(selectedLayout.id) : null
        };
        localStorage.setItem(`bhoomi_project_module_${selectedProject.id}`, JSON.stringify(projState));
      } else {
        localStorage.removeItem("bhoomi_last_project_id");
      }

      if (selectedLayout) {
        localStorage.setItem("bhoomi_last_layout_id", String(selectedLayout.id));
      } else {
        localStorage.removeItem("bhoomi_last_layout_id");
      }

      localStorage.setItem("bhoomi_last_active_tab", activeTab);
      localStorage.setItem("bhoomi_last_project_workspace_tab", projectWorkspaceTab);
    }
  }, [selectedProject, selectedLayout, activeTab, projectWorkspaceTab]);

  // Handle popstate events to keep URL and selection state in perfect sync
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const projId = urlParams.get("projectId");
      const layId = urlParams.get("layoutId");

      if (projId) {
        const proj = lookupProjects.find(p => String(p.id) === String(projId));
        if (proj) setSelectedProject(proj);
      } else {
        setSelectedProject(null);
      }

      if (layId) {
        const lay = lookupLayouts.find(l => String(l.id) === String(layId));
        if (lay) setSelectedLayout(lay);
      } else {
        setSelectedLayout(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [lookupProjects, lookupLayouts]);

  // Sync parent project context when a layout is selected directly (e.g. from global Layouts catalog)
  useEffect(() => {
    if (selectedLayout && (!selectedProject || selectedProject.id !== selectedLayout.project_id)) {
      const parentProj = lookupProjects.find(p => p.id === selectedLayout.project_id);
      if (parentProj) {
        setSelectedProject(parentProj);
      }
    }
  }, [selectedLayout, lookupProjects, selectedProject]);

  // Derived safe metadata for plot details panel to prevent rendering crashes
  const plotMeta = selectedPlot ? tryParseJSON(selectedPlot.dimensions_metadata, {}) : {};

  // Global search input
  const [globalSearch, setGlobalSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [recentAudits, setRecentAudits] = useState<any[]>([
    { id: "audit-1", action: "LAYOUT_PUBLISH", model: "layouts", summary: "Successfully updated and published Layout Plan: 'Royal Orchard Phase 1' live!", created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: "audit-2", action: "PROJECT_CREATE", model: "projects", summary: "Created New Real estate Project registry: Bhoomi One Heights", created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: "audit-3", action: "PLOT_UPDATE", model: "plots", summary: "Toggled extensible attribute 'corner_plot' on plot: 104", created_at: new Date(Date.now() - 10800000).toISOString() }
  ]);
  const [projectLeads, setProjectLeads] = useState<any[]>([
    { id: "lead-1", name: "Ananya Sharma", email: "ananya.sharma@gmail.com", phone: "+91 98765 43210", plotNum: "101", paidAmount: "₹2,50,000", rep: "Vikram Singh", status: "Booked", date: "2026-07-10" },
    { id: "lead-2", name: "Rohan Verma", email: "rohan.v@outlook.com", phone: "+91 87654 32109", plotNum: "102", paidAmount: "₹50,000", rep: "Meera Nair", status: "Reserved", date: "2026-07-11" },
    { id: "lead-3", name: "Dr. Sandeep Patel", email: "sandeep.patel@aiims.edu", phone: "+91 76543 21098", plotNum: "105", paidAmount: "₹0", rep: "Vikram Singh", status: "Lead", date: "2026-07-09" }
  ]);
  const [projectDocuments, setProjectDocuments] = useState<any[]>([
    { id: "doc-1", name: "RERA_Registration_Approved_Certificate.pdf", category: "RERA Certificate", size: "2.4 MB", status: "Approved", date: "2026-06-15" },
    { id: "doc-2", name: "Municipal_Layout_Subdivision_Drawing_V2.pdf", category: "Approved Drawing", size: "14.8 MB", status: "Completed", date: "2026-07-01" },
    { id: "doc-3", name: "Environmental_Clearance_NOC_Draft.pdf", category: "NOC Certificate", size: "1.1 MB", status: "Pending", date: "2026-07-08" }
  ]);
  const [completedTasks, setCompletedTasks] = useState<Record<string, Record<string, boolean>>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    project: false,
    location: false,
    approvals: false,
    statistics: false,
    coordinates: false,
    description: false,
  });

  // Debounce search input to avoid API slamming
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(globalSearch);
    }, 400);
    return () => clearTimeout(handler);
  }, [globalSearch]);

  // Synchronize layout/plot filters and formProj state with selectedProject context
  useEffect(() => {
    if (selectedProject) {
      setFilterLayProject(selectedProject.id);
      setLayoutPage(1);

      // Populate layout and plot states
      const projectLayouts = lookupLayouts.filter(l => String(l.project_id) === String(selectedProject.id));
      if (projectLayouts.length > 0) {
        setFilterPlotLayoutId(projectLayouts[0].id);
      } else {
        setFilterPlotLayoutId("ALL");
      }
      setPlotPage(1);

      // Prepopulate formProj for Settings tab
      const meta = typeof selectedProject.approvals_metadata === "string"
        ? tryParseJSON(selectedProject.approvals_metadata)
        : (selectedProject.approvals_metadata || {});

      setFormProj({
        name: selectedProject.name || "",
        code: selectedProject.code || "",
        developer_name: selectedProject.developer_name || "",
        project_type: selectedProject.project_type || meta.project_type || "RESIDENTIAL",
        status: selectedProject.status || "PLANNING",
        state: selectedProject.state || meta.state || "",
        district: selectedProject.district || meta.district || "",
        taluk: selectedProject.taluk || meta.taluk || "",
        location: selectedProject.location || "",
        village: selectedProject.village || meta.village || "",
        pincode: selectedProject.pincode || meta.pincode || "",
        latitude: selectedProject.latitude || meta.latitude || "",
        longitude: selectedProject.longitude || meta.longitude || "",
        description: selectedProject.description || meta.description || "",
        rera_number: selectedProject.rera_number || "",
        approval_status: selectedProject.approval_status || "PENDING",
        approval_authority: selectedProject.approval_authority || "",
        launch_date: selectedProject.launch_date ? selectedProject.launch_date.split("T")[0] : "",
        possession_target_date: selectedProject.possession_target_date ? selectedProject.possession_target_date.split("T")[0] : "",
        approvals_metadata: typeof selectedProject.approvals_metadata === "string" ? selectedProject.approvals_metadata : JSON.stringify(meta),
        country: selectedProject.country || meta.country || "IN"
      });
    } else {
      setFilterLayProject("ALL");
      setFilterPlotLayoutId("ALL");
    }
  }, [selectedProject]);

  // Grid Paginations (Current Page)
  const [projectPage, setProjectPage] = useState(1);
  const [layoutPage, setLayoutPage] = useState(1);
  const [plotPage, setPlotPage] = useState(1);
  const pageSize = 6; // Standard layout size

  // --- Filter states ---
  // Project Filters
  const [filterProjLocation, setFilterProjLocation] = useState("ALL");
  const [filterProjAppr, setFilterProjAppr] = useState("ALL");
  const [filterProjStatus, setFilterProjStatus] = useState("ALL");

  // Layout Filters
  const [filterLayProject, setFilterLayProject] = useState("ALL");
  const [filterLayType, setFilterLayType] = useState("ALL");
  const [filterLayStatus, setFilterLayStatus] = useState("ALL");

  // Plot Filters
  const [filterPlotStatus, setFilterPlotStatus] = useState("ALL");
  const [filterPlotFacing, setFilterPlotFacing] = useState("ALL");
  const [filterPlotCorner, setFilterPlotCorner] = useState("ALL");
  const [filterPlotMinArea, setFilterPlotMinArea] = useState("");
  const [filterPlotMaxArea, setFilterPlotMaxArea] = useState("");
  const [filterPlotRoadWidth, setFilterPlotRoadWidth] = useState("");
  const [filterPlotLayoutId, setFilterPlotLayoutId] = useState("ALL");

  // Selectable row IDs for bulk actions
  const [selectedPlotIds, setSelectedPlotIds] = useState<string[]>([]);

  // Modals & Forms states
  const [currModal, setCurrModal] = useState<string | null>(null); // "create_project", "edit_project", "create_layout", "edit_layout", "create_plot", "edit_plot", "bulk_create_plots", "bulk_update_plots", "bulk_status_plots"
  const [editId, setEditId] = useState<string | null>(null);

  // Form Fields
  const [formProj, setFormProj] = useState({
    name: "", code: "", developer_name: "", location: "", status: "PLANNING",
    rera_number: "", approval_status: "PENDING", approval_authority: "",
    launch_date: "", possession_target_date: "", approvals_metadata: "{}",
    project_type: "RESIDENTIAL", state: "", description: "",
    village: "", taluk: "", district: "", country: "INDIA", pincode: "",
    latitude: "", longitude: ""
  });

  // India Location Master states
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [taluks, setTaluks] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  const [selectedStateId, setSelectedStateId] = useState<string | number>("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | number>("");
  const [selectedTalukId, setSelectedTalukId] = useState<string | number>("");

  const [manualState, setManualState] = useState<boolean>(false);
  const [manualDistrict, setManualDistrict] = useState<boolean>(false);
  const [manualTaluk, setManualTaluk] = useState<boolean>(false);
  const [manualCity, setManualCity] = useState<boolean>(false);
  const [manualVillage, setManualVillage] = useState<boolean>(false);

  const [loadingLoc, setLoadingLoc] = useState({
    states: false,
    districts: false,
    taluks: false,
    cities: false,
    villages: false,
  });
  const [locationApiError, setLocationApiError] = useState<string | null>(null);

  const loadStates = async () => {
    setLoadingLoc((prev) => ({ ...prev, states: true }));
    setLocationApiError(null);
    try {
      const res = await api.fetchStates();
      const list = res.data || res || [];
      setStates(list);
      
      // If we are editing, auto-populate cascading levels
      if (currModal === "edit_project") {
        await autoPopulateLocationHierarchy(
          formProj.state,
          formProj.district,
          formProj.taluk,
          formProj.location,
          formProj.village,
          list
        );
      }
    } catch (err) {
      console.error("Error loading states:", err);
      setLocationApiError("Failed to load location hierarchy. Please check your database/network.");
    } finally {
      setLoadingLoc((prev) => ({ ...prev, states: false }));
    }
  };

  const autoPopulateLocationHierarchy = async (
    stateName: string,
    districtName: string,
    talukName: string,
    cityName: string,
    villageName: string,
    allStates: any[]
  ) => {
    setLocationApiError(null);
    try {
      // Find matching state
      const matchedState = allStates.find((s) => s.name.toLowerCase() === (stateName || "").trim().toLowerCase());
      if (!matchedState) {
        setManualState(true);
        setManualDistrict(true);
        setManualTaluk(true);
        setManualCity(true);
        setManualVillage(true);
        return;
      }

      setManualState(false);
      setSelectedStateId(matchedState.id);

      // Fetch districts
      setLoadingLoc((prev) => ({ ...prev, districts: true }));
      const distRes = await api.fetchDistricts(matchedState.id);
      const distList = distRes.data || distRes || [];
      setDistricts(distList);
      setLoadingLoc((prev) => ({ ...prev, districts: false }));

      const matchedDist = distList.find((d: any) => d.name.toLowerCase() === (districtName || "").trim().toLowerCase());
      if (!matchedDist) {
        setManualDistrict(true);
        setManualTaluk(true);
        setManualCity(true);
        setManualVillage(true);
        return;
      }

      setManualDistrict(false);
      setSelectedDistrictId(matchedDist.id);

      // Fetch taluks and cities in parallel
      setLoadingLoc((prev) => ({ ...prev, taluks: true, cities: true }));
      const [talukRes, cityRes] = await Promise.all([
        api.fetchTaluks(matchedDist.id),
        api.fetchCities(matchedDist.id)
      ]);
      const talukList = talukRes.data || talukRes || [];
      const cityList = cityRes.data || cityRes || [];
      setTaluks(talukList);
      setCities(cityList);
      setLoadingLoc((prev) => ({ ...prev, taluks: false, cities: false }));

      // Check matched city
      const matchedCity = cityList.find((c: any) => c.name.toLowerCase() === (cityName || "").trim().toLowerCase());
      if (!matchedCity) {
        setManualCity(true);
      } else {
        setManualCity(false);
      }

      // Check matched taluk
      const matchedTaluk = talukList.find((t: any) => t.name.toLowerCase() === (talukName || "").trim().toLowerCase());
      if (!matchedTaluk) {
        setManualTaluk(true);
        setManualVillage(true);
        return;
      }

      setManualTaluk(false);
      setSelectedTalukId(matchedTaluk.id);

      // Fetch villages
      setLoadingLoc((prev) => ({ ...prev, villages: true }));
      const vilRes = await api.fetchVillages(matchedTaluk.id);
      const vilList = vilRes.data || vilRes || [];
      setVillages(vilList);
      setLoadingLoc((prev) => ({ ...prev, villages: false }));

      const matchedVil = vilList.find((v: any) => v.name.toLowerCase() === (villageName || "").trim().toLowerCase());
      if (!matchedVil) {
        setManualVillage(true);
      } else {
        setManualVillage(false);
      }
    } catch (err) {
      console.error("Error auto-populating location hierarchy:", err);
      setLocationApiError("Failed to fetch cascading master locations. Defaulted to manual fields.");
      setManualState(true);
      setManualDistrict(true);
      setManualTaluk(true);
      setManualCity(true);
      setManualVillage(true);
    }
  };

  useEffect(() => {
    if (currModal === "create_project" || currModal === "edit_project") {
      loadStates();
      if (currModal === "create_project") {
        setSelectedStateId("");
        setSelectedDistrictId("");
        setSelectedTalukId("");
        setManualState(false);
        setManualDistrict(false);
        setManualTaluk(false);
        setManualCity(false);
        setManualVillage(false);
        setDistricts([]);
        setTaluks([]);
        setCities([]);
        setVillages([]);
      }
    } else if (currModal === "create_layout" || currModal === "edit_layout") {
      fetchUnitsOnOpen();
    }
  }, [currModal]);



  const [formLay, setFormLay] = useState({
    project_id: "", name: "", code: "", layout_type: "RESIDENTIAL",
    approval_number: "", approval_date: "", total_area_value: "",
    total_area_unit_id: "", measurement_unit_id: "", status: "DRAFT",
    survey_number: "", phase: "", description: ""
  });

  const [formPlot, setFormPlot] = useState({
    layout_id: "", plot_number: "", area_value: "", measurement_unit_id: "",
    length: "", width: "", road_width: "", corner_plot: false,
    facing: "NORTH", dimensions: "", dimensions_metadata: "{}", status: "AVAILABLE",
    plc: "", remarks: "", latitude: "", longitude: "", polygon_ref: ""
  });

  // Bulk parameters states
  const [bulkCreate, setBulkCreate] = useState({
    layout_id: "", prefix: "PL-", startNo: 101, endNo: 110,
    area_value: "1200", measurement_unit_id: "", facing: "NORTH",
    road_width: "40", corner_plot: false, default_attributes: '{"Premium Plot": true}'
  });

  const [bulkUpdateProps, setBulkUpdateProps] = useState({
    area_value: "", facing: "", road_width: ""
  });

  // Plot Move, Split and Merge states
  const [movePlotTarget, setMovePlotTarget] = useState({
    plotId: "",
    plotNumber: "",
    layoutId: ""
  });

  const [splitPlotTarget, setSplitPlotTarget] = useState({
    plotId: "",
    plotNumber: "",
    areaValue: 0,
    unitId: "",
    layoutId: "",
    facing: "",
    plotANumber: "",
    plotAArea: 0,
    plotBNumber: "",
    plotBArea: 0
  });

  const [mergePlotTarget, setMergePlotTarget] = useState({
    sourcePlotIds: [] as string[],
    layoutId: "",
    newPlotNumber: "",
    newAreaValue: 0,
    unitId: "",
    facing: "NORTH"
  });

  const [enabledFeatures, setEnabledFeatures] = useState<string[]>([]);

  // Permissions validation
  const roleUpper = (user.role || "").toUpperCase().trim();
  const isTenantOwnerOrAdmin = roleUpper === "DEVELOPER_OWNER" || 
    roleUpper === "DEVELOPER_ADMIN" || 
    roleUpper === "PROJECT_MANAGER" || 
    roleUpper === "PLATFORM_ADMIN" || 
    roleUpper === "TENANT_OWNER" || 
    roleUpper === "TENANT_ADMIN" || 
    roleUpper === "OWNER" || 
    roleUpper === "ADMIN" || 
    roleUpper.includes("OWNER") || 
    roleUpper.includes("ADMIN") || 
    roleUpper.includes("MANAGER");

  const hasProjView = user.permissions?.includes("projects.view") || isTenantOwnerOrAdmin || false;
  const hasProjManage = user.permissions?.includes("projects.manage") || user.permissions?.includes("projects.create") || isTenantOwnerOrAdmin || false;
  const hasLayView = user.permissions?.includes("layouts.view") || isTenantOwnerOrAdmin || false;
  const hasLayManage = user.permissions?.includes("layouts.manage") || isTenantOwnerOrAdmin || false;

  // Centralized Plots permission auditor with dynamic SaaS entitlement fallback
  const hasPermission = (permission: string): boolean => {
    const registry = BhoomiModuleRegistry.getInstance();
    if (!registry.isModuleActive("mod-plots")) {
      return false;
    }

    const rUpper = (user.role || "").toUpperCase().trim();
    if (
      rUpper === "DEVELOPER_OWNER" || 
      rUpper === "DEVELOPER_ADMIN" || 
      rUpper === "PLATFORM_ADMIN" || 
      rUpper === "TENANT_OWNER" || 
      rUpper === "TENANT_ADMIN" || 
      rUpper === "OWNER" || 
      rUpper === "ADMIN"
    ) {
      return true;
    }

    if (user.permissions && user.permissions.includes(permission)) {
      return true;
    }

    return false;
  };

  const hasPlotView = hasPermission("plots.view");
  const hasPlotManage = hasPermission("plots.edit") || hasPermission("plots.create");
  const hasDxfView = user.permissions?.includes("dxf.view") || isTenantOwnerOrAdmin || false;

  // Measurement Units reference caching helper
  const getUnitCode = (unitId: string) => {
    const matched = units.find(u => u.id === unitId);
    return matched ? matched.code : "SQFT";
  };

  const getDefaultUnitId = (projId?: string) => {
    if (projId && lookupProjects) {
      const proj = lookupProjects.find(p => p.id === projId);
      if (proj && (proj.default_unit_id || proj.measurement_unit_id)) {
        return proj.default_unit_id || proj.measurement_unit_id;
      }
    }
    return "";
  };

  const fetchUnitsOnOpen = async () => {
    // Handled by useMeasurementUnits hook reactively
  };

  // Reactive defaults population when units are loaded/fetched
  useEffect(() => {
    if (units && units.length > 0) {
      setFormLay(prev => {
        const defUnit = getDefaultUnitId(prev.project_id) || units[0]?.id || "";
        return {
          ...prev,
          total_area_unit_id: prev.total_area_unit_id || defUnit,
          measurement_unit_id: prev.measurement_unit_id || defUnit
        };
      });
      setFormPlot(prev => ({
        ...prev,
        measurement_unit_id: prev.measurement_unit_id || getDefaultUnitId() || units[0]?.id || ""
      }));
      setBulkCreate(prev => ({
        ...prev,
        measurement_unit_id: prev.measurement_unit_id || getDefaultUnitId() || units[0]?.id || ""
      }));
    }
  }, [units]);

  // Dynamic seeding flag check from backend server environments (Sprints 1 and 2 check)
  const [isSeeding, setIsSeeding] = useState(false);

  const loadLookups = async () => {
    try {
      // Load active features list first
      try {
        const summary = await api.fetchMySubscriptionSummary();
        if (summary && summary.enabled_features) {
          const rawFeats = summary.enabled_features.map((f: string) => f.toLowerCase());
          const expandedFeats = [...rawFeats];
          
          if (rawFeats.includes("plots.view") || rawFeats.includes("plots.manage")) {
            expandedFeats.push("plot_grid_view");
          }
          if (rawFeats.includes("interactive_map.view") || rawFeats.includes("interactive_map.manage") || rawFeats.includes("maps.view")) {
            expandedFeats.push("gis_maps");
            expandedFeats.push("satellite_view");
          }
          if (rawFeats.includes("dxf.view") || rawFeats.includes("dxf.manage") || rawFeats.includes("dxf_upload") || rawFeats.includes("layouts.view")) {
            expandedFeats.push("dxf_import");
            expandedFeats.push("layout_viewer");
            expandedFeats.push("dxf_rendering");
          }
          
          setEnabledFeatures(expandedFeats);

          // Menu adapts automatically based on resolved commercial feature engine, but session restoration takes precedence
          if (!hasSetInitialTab.current) {
            const lastActiveTab = localStorage.getItem("bhoomi_last_active_tab");
            if (lastActiveTab) {
              setActiveTab(lastActiveTab as any);
            } else {
              // FIRST LOGIN: Open Dashboard
              setActiveTab("dashboard");
            }
            hasSetInitialTab.current = true;
          }
        }
      } catch (sumErr) {
        console.warn("Failed to retrieve subscription summary in InventoryManager:", sumErr);
      }

      if (hasProjView) {
        const prjRes = await api.fetchProjects({ per_page: 1000 });
        const prjList = prjRes.data || [];
        setLookupProjects(prjList);
        if (prjList.length > 0) {
          setFormLay(prev => ({ ...prev, project_id: prjList[0].id }));
        }
      }
      if (hasLayView) {
        const layRes = await api.fetchLayouts({ per_page: 1000 });
        const layList = layRes.data || [];
        setLookupLayouts(layList);
        if (layList.length > 0) {
          setFormPlot(prev => ({ ...prev, layout_id: layList[0].id }));
          setBulkCreate(prev => ({ ...prev, layout_id: layList[0].id }));
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMess(err.message || "Relational state fetch failure. Verify access level.");
    }
  };

  const handleExportPlotsToCsv = () => {
    if (plots.length === 0) {
      setErrorMess("No plots available to export.");
      return;
    }

    const headers = ["ID", "Plot Number", "Layout", "Area Value", "Unit", "Facing", "Road Width", "Corner Plot", "Status"];
    const rows = plots.map(p => [
      p.id,
      p.plot_number,
      p.layout_name || p.layout?.name || "N/A",
      p.area_value,
      getUnitCode(p.measurement_unit_id),
      p.facing || "N/A",
      p.road_width || "0",
      p.corner_plot ? "YES" : "NO",
      p.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bhoomione_plots_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onAuditLogged) {
      onAuditLogged({
        id: String(new Date().getTime()),
        action: "DATA_EXPORTED",
        entity_name: "plots",
        entity_id: user.id,
        created_at: new Date().toISOString(),
        details: `Exported ${plots.length} plot records to CSV file successfully.`
      });
    }

    setSuccessMess(`Successfully exported ${plots.length} plot records to CSV.`);
    setTimeout(() => setSuccessMess(null), 4000);
  };

  const fetchProjectsPage = async () => {
    if (!hasProjView) return;
    setLoading(true);
    try {
      const res = await api.fetchProjects({
        page: projectPage,
        per_page: pageSize,
        search: debouncedSearch,
        location: filterProjLocation === "ALL" ? "" : filterProjLocation,
        approval_status: filterProjAppr === "ALL" ? "" : filterProjAppr,
        status: filterProjStatus === "ALL" ? "" : filterProjStatus,
        sort_by: projSortBy,
        sort_direction: projSortDir
      });
      setProjects(res.data || []);
      setTotalProj(res.total || 0);
    } catch (err: any) {
      console.error(err);
      setErrorMess(err.message || "Failed to load projects page.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLayoutsPage = async () => {
    if (!hasLayView) return;
    setLoading(true);
    try {
      const res = await api.fetchLayouts({
        page: layoutPage,
        per_page: pageSize,
        search: debouncedSearch,
        project_id: filterLayProject === "ALL" ? "" : filterLayProject,
        layout_type: filterLayType === "ALL" ? "" : filterLayType,
        status: filterLayStatus === "ALL" ? "" : filterLayStatus,
        sort_by: laySortBy,
        sort_direction: laySortDir
      });
      setLayouts(res.data || []);
      setTotalLay(res.total || 0);
    } catch (err: any) {
      console.error(err);
      setErrorMess(err.message || "Failed to load layouts page.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlotsPage = async () => {
    if (!hasPlotView) return;
    setLoading(true);
    try {
      const res = await api.fetchPlots({
        page: plotPage,
        per_page: pageSize,
        search: debouncedSearch,
        status: filterPlotStatus === "ALL" ? "" : filterPlotStatus,
        facing: filterPlotFacing === "ALL" ? "" : filterPlotFacing,
        corner_plot: filterPlotCorner === "ALL" ? "" : (filterPlotCorner === "YES" ? "true" : "false"),
        layout_id: filterPlotLayoutId === "ALL" ? "" : filterPlotLayoutId,
        project_id: selectedProject ? selectedProject.id : "",
        road_width_min: filterPlotRoadWidth,
        area_min: filterPlotMinArea,
        area_max: filterPlotMaxArea,
        sort_by: plotSortBy,
        sort_direction: plotSortDir
      });
      setPlots(res.data || []);
      setTotalPlot(res.total || 0);
    } catch (err: any) {
      console.error(err);
      setErrorMess(err.message || "Failed to load plots page.");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setErrorMess(null);
    await loadLookups();
    if (activeTab === "projects") {
      await fetchProjectsPage();
    } else if (activeTab === "layouts") {
      await fetchLayoutsPage();
    } else if (activeTab === "plots") {
      await fetchPlotsPage();
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLookups();
  }, [user]);

  // Reactive updates on tab or parameter changes
  useEffect(() => {
    if (activeTab === "projects") {
      fetchProjectsPage();
    }
  }, [activeTab, projectPage, debouncedSearch, filterProjLocation, filterProjAppr, filterProjStatus, projSortBy, projSortDir]);

  useEffect(() => {
    if (activeTab === "layouts" || (selectedProject !== null && projectWorkspaceTab === "layouts")) {
      fetchLayoutsPage();
    }
  }, [activeTab, selectedProject, projectWorkspaceTab, layoutPage, debouncedSearch, filterLayProject, filterLayType, filterLayStatus, laySortBy, laySortDir]);

  useEffect(() => {
    if (activeTab === "plots" || (selectedProject !== null && projectWorkspaceTab === "plots")) {
      fetchPlotsPage();
    }
  }, [activeTab, selectedProject, projectWorkspaceTab, plotPage, debouncedSearch, filterPlotStatus, filterPlotFacing, filterPlotCorner, filterPlotLayoutId, filterPlotRoadWidth, filterPlotMinArea, filterPlotMaxArea, plotSortBy, plotSortDir]);

  useEffect(() => {
    if (selectedProject) {
      setFilterLayProject(selectedProject.id);
    } else {
      setFilterLayProject("ALL");
    }
    setLayoutPage(1);
    setPlotPage(1);
  }, [selectedProject]);

  // Synchronize selectedProject and selectedLayout context across tabs
  useEffect(() => {
    if (activeTab === "viewer" || activeTab === "layouts") {
      if (selectedProject) {
        const layoutsForProj = lookupLayouts.filter(l => l.project_id === selectedProject.id);
        if (layoutsForProj.length === 0) {
          if (selectedLayout) {
            setSelectedLayout(null);
          }
        } else {
          if (!selectedLayout || selectedLayout.project_id !== selectedProject.id) {
            setSelectedLayout(layoutsForProj[0]);
          }
        }
      } else if (selectedLayout) {
        const parentProject = lookupProjects.find(p => p.id === selectedLayout.project_id);
        if (parentProject) {
          setSelectedProject(parentProject);
        }
      }
    }
  }, [activeTab, selectedProject, selectedLayout, lookupLayouts, lookupProjects]);

  // Reset selectedLayout if switching projects
  useEffect(() => {
    if (selectedLayout && selectedProject && selectedLayout.project_id !== selectedProject.id) {
      setSelectedLayout(null);
    }
  }, [selectedProject]);

  const fetchMarketplaceTenantData = async () => {
    setLoading(true);
    try {
      const profile = await api.fetchDeveloperProfile();
      if (profile) {
        setDeveloperProfile(profile);
      }
      const leads = await api.fetchTenantLeads();
      setMarketplaceLeads(leads || []);

      const stats = await api.fetchTenantMarketplaceStats();
      setMStats(stats || null);
    } catch (err) {
      console.error("Error loading tenant marketplace data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "marketplace") {
      fetchMarketplaceTenantData();
    }
  }, [activeTab]);

  // Alert notifier timer helper
  const displaySuccess = (msg: string) => {
    setSuccessMess(msg);
    setTimeout(() => setSuccessMess(null), 4000);
  };

  const dispatchAuditLog = (action: string, model: string, modelId: string, summary: string) => {
    const logObj = {
      id: `LocalAudit-${Date.now()}`,
      action,
      model,
      modelId,
      summary,
      created_at: new Date().toISOString()
    };
    setRecentAudits(prev => [logObj, ...prev].slice(0, 8));
    if (onAuditLogged) {
      onAuditLogged({
        id: logObj.id,
        action,
        entity_name: model,
        entity_id: modelId,
        details: summary,
        created_at: logObj.created_at
      });
    }
  };

  // --- CRUD ACTION HANDLERS ---
  
  // --- CRUD ACTION HANDLERS ---
  
  // 1. Projects Actions
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingProject) return;
    setIsSavingProject(true);
    setErrorMess(null);
    try {
      const parsedMetadata = tryParseJSON(formProj.approvals_metadata);
      parsedMetadata.project_type = formProj.project_type;
      parsedMetadata.state = formProj.state;
      parsedMetadata.description = formProj.description;
      parsedMetadata.village = formProj.village;
      parsedMetadata.taluk = formProj.taluk;
      parsedMetadata.district = formProj.district;
      parsedMetadata.country = formProj.country;
      parsedMetadata.pincode = formProj.pincode;
      parsedMetadata.latitude = formProj.latitude;
      parsedMetadata.longitude = formProj.longitude;

      const payload = {
        name: formProj.name.trim(),
        code: formProj.code.trim().toUpperCase(),
        developer_name: formProj.developer_name.trim(),
        location: formProj.location.trim(),
        status: formProj.status,
        approval_status: formProj.approval_status,
        approval_authority: formProj.approval_authority.trim(),
        approvals_metadata: parsedMetadata,
        rera_number: formProj.rera_number.trim() || null,
        launch_date: formProj.launch_date || null,
        possession_target_date: formProj.possession_target_date || null,
      };

      if (editId) {
        const res = await api.updateProject(editId, payload);
        setCurrModal(null);
        displaySuccess(`Project [${res.code}] updated successfully!`);
        dispatchAuditLog("PROJECT_UPDATE", "projects", res.id, `Modified Project Specifications for ${res.name}`);
      } else {
        const res = await api.createProject(payload);
        setCurrModal(null);
        displaySuccess(`New Project [${res.code}] created successfully!`);
        dispatchAuditLog("PROJECT_CREATE", "projects", res.id, `Created New Real estate Project registry: ${res.name}`);
      }
      await loadData();
    } catch (err: any) {
      setErrorMess(err.message || "Failed to submit project schema validation.");
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleStartEditProject = (p: any) => {
    setEditId(p.id);
    const meta = tryParseJSON(p.approvals_metadata, {});
    setFormProj({
      name: p.name || "",
      code: p.code || "",
      developer_name: p.developer_name || "",
      location: p.location || "",
      status: p.status || "PLANNING",
      rera_number: p.rera_number || "",
      approval_status: p.approval_status || "PENDING",
      approval_authority: p.approval_authority || "",
      launch_date: p.launch_date ? p.launch_date.split("T")[0] : "",
      possession_target_date: p.possession_target_date ? p.possession_target_date.split("T")[0] : "",
      approvals_metadata: JSON.stringify(meta, null, 2),
      project_type: meta.project_type || "RESIDENTIAL",
      state: meta.state || "",
      description: meta.description || "",
      village: meta.village || "",
      taluk: meta.taluk || "",
      district: meta.district || "",
      country: meta.country || "INDIA",
      pincode: meta.pincode || "",
      latitude: meta.latitude || "",
      longitude: meta.longitude || ""
    });
    setCurrModal("edit_project");
  };

  const handleDeleteProject = async (id: string, code: string) => {
    const confirmation = window.confirm(`Delete project '${code}'? This will recursively cascade all active sub layouts and plots.`);
    if (!confirmation) return;
    setErrorMess(null);
    try {
      await api.deleteProject(id);
      displaySuccess(`Project '${code}' deleted.`);
      dispatchAuditLog("PROJECT_DELETE", "projects", id, `De-registered project parameters and cascading constraints for: ${code}`);
      if (selectedProject?.id === id) setSelectedProject(null);
      await loadData();
    } catch (err: any) {
      setErrorMess(err.message || "Project deletion rejected. Sub-entities constraints exist.");
    }
  };

  const handleArchiveProject = async (id: string, currentStatus: string) => {
    if (!window.confirm("Are you sure you want to Archive this Project? Status will change to ARCHIVED.")) return;
    setErrorMess(null);
    try {
      const p = projects.find(proj => proj.id === id);
      if (!p) return;
      const meta = tryParseJSON(p.approvals_metadata, {});
      meta.original_status = currentStatus;
      
      const payload = {
        name: p.name,
        code: p.code,
        developer_name: p.developer_name,
        location: p.location,
        status: "ARCHIVED",
        approval_status: p.approval_status,
        approval_authority: p.approval_authority,
        approvals_metadata: meta,
        rera_number: p.rera_number,
        launch_date: p.launch_date ? p.launch_date.split("T")[0] : null,
        possession_target_date: p.possession_target_date ? p.possession_target_date.split("T")[0] : null,
      };
      await api.updateProject(id, payload);
      displaySuccess(`Project '${p.code}' successfully archived.`);
      dispatchAuditLog("PROJECT_ARCHIVE", "projects", id, `Archived Project: ${p.code}`);
      await loadData();
    } catch (err: any) {
      setErrorMess(err.message || "Failed to archive project.");
    }
  };

  const handleRestoreProject = async (id: string) => {
    setErrorMess(null);
    try {
      const p = projects.find(proj => proj.id === id);
      if (!p) return;
      const meta = tryParseJSON(p.approvals_metadata, {});
      const targetStatus = meta.original_status || "PLANNING";
      delete meta.original_status;

      const payload = {
        name: p.name,
        code: p.code,
        developer_name: p.developer_name,
        location: p.location,
        status: targetStatus,
        approval_status: p.approval_status,
        approval_authority: p.approval_authority,
        approvals_metadata: meta,
        rera_number: p.rera_number,
        launch_date: p.launch_date ? p.launch_date.split("T")[0] : null,
        possession_target_date: p.possession_target_date ? p.possession_target_date.split("T")[0] : null,
      };
      await api.updateProject(id, payload);
      displaySuccess(`Project '${p.code}' successfully restored to status '${targetStatus}'.`);
      dispatchAuditLog("PROJECT_RESTORE", "projects", id, `Restored Project: ${p.code}`);
      await loadData();
    } catch (err: any) {
      setErrorMess(err.message || "Failed to restore project.");
    }
  };

  const handleDuplicateProject = async (id: string) => {
    if (!window.confirm("Are you sure you want to Duplicate this Project record?")) return;
    setErrorMess(null);
    try {
      const p = projects.find(proj => proj.id === id);
      if (!p) return;
      const meta = tryParseJSON(p.approvals_metadata, {});
      
      const newCode = `${p.code}_DUP`.slice(0, 100);
      const newName = `${p.name} (Copy)`;

      const payload = {
        name: newName,
        code: newCode,
        developer_name: p.developer_name,
        location: p.location,
        status: p.status,
        approval_status: p.approval_status,
        approval_authority: p.approval_authority,
        approvals_metadata: meta,
        rera_number: p.rera_number,
        launch_date: p.launch_date ? p.launch_date.split("T")[0] : null,
        possession_target_date: p.possession_target_date ? p.possession_target_date.split("T")[0] : null,
      };
      const res = await api.createProject(payload);
      displaySuccess(`Project duplicated as '${newCode}' successfully!`);
      dispatchAuditLog("PROJECT_DUPLICATE", "projects", res.id, `Duplicated Project '${p.code}' to '${newCode}'`);
      await loadData();
    } catch (err: any) {
      setErrorMess(err.message || "Failed to duplicate project.");
    }
  };

  // 2. Layouts Actions
  const packApprovalNumber = (apprNum: string, survey: string, phase: string, desc: string) => {
    const parts = [];
    if (apprNum?.trim()) parts.push(`Ap:${apprNum.trim()}`);
    if (phase?.trim()) parts.push(`Ph:${phase.trim()}`);
    if (survey?.trim()) parts.push(`Sy:${survey.trim()}`);
    if (desc?.trim()) parts.push(`De:${desc.trim()}`);
    return parts.join(" | ").slice(0, 149);
  };

  const unpackApprovalNumber = (packedStr: string) => {
    const res = { approval_number: "", phase: "", survey_number: "", description: "" };
    if (!packedStr) return res;
    
    if (!packedStr.includes(" | ") && !packedStr.includes("Ap:") && !packedStr.includes("Ph:")) {
      const match = packedStr.match(/(.*?)\s*\(Survey:\s*(.*?)\)/);
      if (match) {
        res.approval_number = match[1].trim();
        res.survey_number = match[2].trim();
      } else {
        res.approval_number = packedStr;
      }
      return res;
    }

    const parts = packedStr.split(" | ");
    parts.forEach(part => {
      const [key, ...valParts] = part.split(":");
      const val = valParts.join(":").trim();
      if (key === "Ap") res.approval_number = val;
      else if (key === "Ph") res.phase = val;
      else if (key === "Sy") res.survey_number = val;
      else if (key === "De") res.description = val;
    });
    return res;
  };

  const handleSaveLayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMess(null);
    try {
      // Validation 1: Missing Project Check
      if (!formLay.project_id) {
        setErrorMess("Validation Error: Parent Project Context is required to register a Layout Subdivision plan.");
        return;
      }

      // Validation 2: Invalid Area Check
      if (formLay.total_area_value && (isNaN(Number(formLay.total_area_value)) || Number(formLay.total_area_value) <= 0)) {
        setErrorMess("Validation Error: Invalid Area. Zoned Area value must be a positive numeric value higher than 0.");
        return;
      }

      // Validation 3: Duplicate Layout Name Check
      const isDuplicate = lookupLayouts.some(
        (lay: any) => 
          lay.name.trim().toLowerCase() === formLay.name.trim().toLowerCase() && 
          lay.id !== editId &&
          lay.project_id === formLay.project_id
      );
      if (isDuplicate) {
        setErrorMess(`Validation Error: A layout phase named '${formLay.name}' already exists within the selected parent project context. Duplicate layout names are not permitted.`);
        return;
      }

      // Normalization of survey_number: split/trim/comma-separated
      const normalizedSurvey = formLay.survey_number
        ? formLay.survey_number
            .split(",")
            .map(s => s.trim())
            .filter(Boolean)
            .join(", ")
        : "";

      // Validation: Measurement Unit ID cannot be empty
      if (!formLay.measurement_unit_id || formLay.measurement_unit_id.trim() === "") {
        setErrorMess("Validation Error: Please select a valid Standard Measurement Unit.");
        return;
      }

      // Verify selected ID exists in measurement units
      const unitExists = units.some(u => u.id === formLay.measurement_unit_id);
      if (!unitExists) {
        setErrorMess("Validation Error: The selected Standard Measurement Unit is invalid or does not exist.");
        return;
      }

      // Validation: If status is APPROVED, approval details must be filled
      if (formLay.status === "APPROVED") {
        if (!formLay.approval_number || !formLay.approval_number.trim()) {
          setErrorMess("Validation Error: Approval Reference Number is required for APPROVED layout phases.");
          return;
        }
        if (!formLay.approval_date) {
          setErrorMess("Validation Error: Approval Date is required for APPROVED layout phases.");
          return;
        }
      }

      // Safe packing of Survey numbers and other extra fields into approval_number text field to survive schema restrictions
      const packedStr = packApprovalNumber(
        formLay.approval_number,
        normalizedSurvey,
        formLay.phase,
        formLay.description
      );

      const payload = {
        project_id: formLay.project_id,
        name: formLay.name.trim(),
        code: formLay.code.trim().toUpperCase(),
        layout_type: formLay.layout_type,
        approval_number: packedStr || null,
        approval_date: formLay.approval_date || null,
        total_area_value: formLay.total_area_value ? Number(formLay.total_area_value) : null,
        measurement_unit_id: formLay.measurement_unit_id,
        status: formLay.status
      };

      let savedLayout: any = null;
      if (editId) {
        const res = await api.updateLayout(editId, payload);
        savedLayout = res;
        displaySuccess(`Layout plan '${res.name}' specification modified!`);
        dispatchAuditLog("LAYOUT_UPDATE", "layouts", res.id, `Updated metrics and layouts state config for Phase: ${res.code}`);
      } else {
        const res = await api.createLayout(payload);
        savedLayout = res;
        displaySuccess(`New Layout Phase register '${res.name}' created!`);
        dispatchAuditLog("LAYOUT_CREATE", "layouts", res.id, `Created New Layout subdivisions zone: ${res.name} (${res.code})`);
      }
      setCurrModal(null);
      await loadData();

      if (returnToViewerAfterSave) {
        const targetId = editId || (savedLayout && savedLayout.id);
        if (targetId) {
          const layRes = await api.fetchLayouts({ per_page: 1000 });
          const layList = layRes.data || layRes || [];
          setLookupLayouts(layList);
          const found = layList.find((l: any) => String(l.id) === String(targetId));
          if (found) {
            setSelectedLayout(found);
          }
        }
        setActiveTab("viewer");
        setReturnToViewerAfterSave(false);
      }
    } catch (err: any) {
      setErrorMess(err.message || "Failed to commit layout records.");
    }
  };

  const handleStartEditLayout = (l: any) => {
    setEditId(l.id);
    
    // Unpacking approval_number and survey_number from structured string representation safely
    const unpacked = unpackApprovalNumber(l.approval_number || "");

    setFormLay({
      project_id: l.project_id,
      name: l.name,
      code: l.code,
      layout_type: l.layout_type,
      approval_number: unpacked.approval_number,
      survey_number: unpacked.survey_number,
      phase: unpacked.phase,
      description: unpacked.description,
      approval_date: l.approval_date ? l.approval_date.split("T")[0] : "",
      total_area_value: l.total_area_value ? String(l.total_area_value) : "",
      total_area_unit_id: l.total_area_unit_id || "",
      measurement_unit_id: l.measurement_unit_id || "",
      status: l.status
    });
    setCurrModal("edit_layout");
  };

  const handleDeleteLayout = async (id: string, code: string) => {
    if (!window.confirm(`irretrievably purge layout Phase plan '${code}'? All attached plots inventory will be deleted.`)) return;
    setErrorMess(null);
    try {
      await api.deleteLayout(id);
      displaySuccess(`Layout phase blueprint '${code}' removed.`);
      dispatchAuditLog("LAYOUT_DELETE", "layouts", id, `De-registered layout Phase design index: ${code}`);
      if (selectedLayout?.id === id) setSelectedLayout(null);
      await loadData();
    } catch (err: any) {
      setErrorMess(err.message || "Relational error purging layout phase indices.");
    }
  };

  const handleArchiveLayout = async (id: string, currentStatus: string) => {
    if (!window.confirm("Are you sure you want to Archive this Layout?")) return;
    setErrorMess(null);
    try {
      const l = lookupLayouts.find(lay => lay.id === id);
      if (!l) return;
      
      const unpacked = unpackApprovalNumber(l.approval_number || "");
      const packedStr = packApprovalNumber(
        unpacked.approval_number,
        unpacked.survey_number,
        unpacked.phase,
        unpacked.description + ` (OS:${currentStatus})`
      );

      const payload = {
        project_id: l.project_id,
        name: l.name,
        code: l.code,
        layout_type: l.layout_type,
        approval_number: packedStr,
        approval_date: l.approval_date ? l.approval_date.split("T")[0] : null,
        total_area_value: l.total_area_value ? Number(l.total_area_value) : null,
        total_area_unit_id: l.total_area_unit_id,
        measurement_unit_id: l.measurement_unit_id,
        status: "ARCHIVED"
      };

      await api.updateLayout(id, payload);
      displaySuccess(`Layout phase '${l.name}' archived.`);
      dispatchAuditLog("LAYOUT_ARCHIVE", "layouts", id, `Archived layout phase: ${l.code}`);
      await loadData();
    } catch (err: any) {
      setErrorMess(err.message || "Failed to archive layout.");
    }
  };

  const handleRestoreLayout = async (id: string) => {
    setErrorMess(null);
    try {
      const l = lookupLayouts.find(lay => lay.id === id);
      if (!l) return;

      const unpacked = unpackApprovalNumber(l.approval_number || "");
      let targetStatus = "DRAFT";
      if (unpacked.description.includes("(OS:")) {
        const match = unpacked.description.match(/\(OS:(.*?)\)/);
        if (match) {
          targetStatus = match[1].trim();
          unpacked.description = unpacked.description.replace(/\(OS:(.*?)\)/, "").trim();
        }
      }

      const packedStr = packApprovalNumber(
        unpacked.approval_number,
        unpacked.survey_number,
        unpacked.phase,
        unpacked.description
      );

      const payload = {
        project_id: l.project_id,
        name: l.name,
        code: l.code,
        layout_type: l.layout_type,
        approval_number: packedStr,
        approval_date: l.approval_date ? l.approval_date.split("T")[0] : null,
        total_area_value: l.total_area_value ? Number(l.total_area_value) : null,
        total_area_unit_id: l.total_area_unit_id,
        measurement_unit_id: l.measurement_unit_id,
        status: targetStatus
      };

      await api.updateLayout(id, payload);
      displaySuccess(`Layout phase '${l.name}' restored to '${targetStatus}'.`);
      dispatchAuditLog("LAYOUT_RESTORE", "layouts", id, `Restored layout phase: ${l.code}`);
      await loadData();
    } catch (err: any) {
      setErrorMess(err.message || "Failed to restore layout.");
    }
  };

  const handleDuplicateLayout = async (id: string) => {
    if (!window.confirm("Are you sure you want to Duplicate this Layout?")) return;
    setErrorMess(null);
    try {
      const l = lookupLayouts.find(lay => lay.id === id);
      if (!l) return;

      const newCode = `${l.code}_DUP`.slice(0, 100);
      const newName = `${l.name} (Copy)`;

      const payload = {
        project_id: l.project_id,
        name: newName,
        code: newCode,
        layout_type: l.layout_type,
        approval_number: l.approval_number,
        approval_date: l.approval_date ? l.approval_date.split("T")[0] : null,
        total_area_value: l.total_area_value ? Number(l.total_area_value) : null,
        total_area_unit_id: l.total_area_unit_id,
        measurement_unit_id: l.measurement_unit_id,
        status: l.status
      };

      const res = await api.createLayout(payload);
      displaySuccess(`Layout phase duplicated as '${newCode}' successfully!`);
      dispatchAuditLog("LAYOUT_DUPLICATE", "layouts", res.id, `Duplicated layout phase '${l.code}' to '${newCode}'`);
      await loadData();
    } catch (err: any) {
      setErrorMess(err.message || "Failed to duplicate layout.");
    }
  };

  // 3. Single Plot Actions
  const handleSavePlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMess(null);
    try {
      if (!formPlot.layout_id) {
        setErrorMess("Validation Error: Parent Layout subdivision is required.");
        return;
      }
      if (!formPlot.plot_number.trim()) {
        setErrorMess("Validation Error: Plot Number designation cannot be empty.");
        return;
      }

      // 1. Collision check inside same layout
      const hasCollision = plots.some(
        (p: any) =>
          p.layout_id === formPlot.layout_id &&
          p.plot_number.trim().toLowerCase() === formPlot.plot_number.trim().toLowerCase() &&
          p.id !== editId
      );
      if (hasCollision) {
        setErrorMess(`Validation Error: A plot with designation/number '${formPlot.plot_number}' already exists in this parent layout subdivision.`);
        return;
      }

      // 2. Strict Area/dimensions positive check
      const areaVal = Number(formPlot.area_value);
      if (isNaN(areaVal) || areaVal <= 0) {
        setErrorMess("Validation Error: Plot physical Area size must be a positive numeric value larger than 0.");
        return;
      }

      const len = formPlot.length ? Number(formPlot.length) : null;
      if (len !== null && (isNaN(len) || len <= 0)) {
        setErrorMess("Validation Error: Physical length must be a positive numeric value higher than 0.");
        return;
      }

      const wid = formPlot.width ? Number(formPlot.width) : null;
      if (wid !== null && (isNaN(wid) || wid <= 0)) {
        setErrorMess("Validation Error: Physical width must be a positive numeric value higher than 0.");
        return;
      }

      const roadWid = formPlot.road_width ? Number(formPlot.road_width) : null;
      if (roadWid !== null && (isNaN(roadWid) || roadWid < 0)) {
        setErrorMess("Validation Error: Access road width must be non-negative.");
        return;
      }

      const existingMeta = tryParseJSON(formPlot.dimensions_metadata, {});
      const parsedDimMeta = {
        ...existingMeta,
        plc: formPlot.plc || "",
        remarks: formPlot.remarks || "",
        latitude: formPlot.latitude || "",
        longitude: formPlot.longitude || "",
        polygon_ref: formPlot.polygon_ref || ""
      };
      const payload = {
        ...formPlot,
        area_value: areaVal,
        length: len,
        width: wid,
        road_width: roadWid || 0,
        dimensions_metadata: parsedDimMeta
      };

      if (editId) {
        if (!hasPermission("plots.edit")) {
          setErrorMess("403 ACCESS FORBIDDEN: You do not have the required entitlement or permission (plots.edit) to perform this action.");
          return;
        }
        const res = await api.updatePlot(editId, payload);
        displaySuccess(`Plot [${res.plot_number}] details updated!`);
        dispatchAuditLog("PLOT_UPDATE", "plots", res.id, `Updated individual Plot metrics for Plot No: ${res.plot_number}`);
        if (selectedPlot?.id === editId) setSelectedPlot(res);
      } else {
        if (!hasPermission("plots.create")) {
          setErrorMess("403 ACCESS FORBIDDEN: You do not have the required entitlement or permission (plots.create) to perform this action.");
          return;
        }
        const res = await api.createPlot(payload);
        displaySuccess(`Plot parcel [${res.plot_number}] cataloged!`);
        dispatchAuditLog("PLOT_CREATE", "plots", res.id, `Cataloged new individual land parcel Plot: ${res.plot_number}`);
      }
      setCurrModal(null);
      await loadData();
    } catch (err: any) {
      setErrorMess(err.message || "Plots schema constraint validation failed.");
    }
  };

  const handleStartEditPlot = (pl: any) => {
    setEditId(pl.id);
    const meta = tryParseJSON(pl.dimensions_metadata, {});
    setFormPlot({
      layout_id: pl.layout_id,
      plot_number: pl.plot_number,
      area_value: String(pl.area_value),
      measurement_unit_id: pl.measurement_unit_id,
      length: pl.length ? String(pl.length) : "",
      width: pl.width ? String(pl.width) : "",
      road_width: pl.road_width ? String(pl.road_width) : "",
      corner_plot: !!pl.corner_plot,
      facing: pl.facing || "NORTH",
      dimensions: pl.dimensions || "",
      dimensions_metadata: JSON.stringify(meta, null, 2),
      status: pl.status || "AVAILABLE",
      plc: meta.plc || "",
      remarks: meta.remarks || "",
      latitude: meta.latitude || "",
      longitude: meta.longitude || "",
      polygon_ref: meta.polygon_ref || ""
    });
    setCurrModal("edit_plot");
  };

  const handleDeletePlot = async (id: string, num: string) => {
    if (!window.confirm(`Permanently de-register land plot tract ${num}?`)) return;
    if (!hasPermission("plots.delete")) {
      setErrorMess("403 ACCESS FORBIDDEN: You do not have the required entitlement or permission (plots.delete) to perform this action.");
      return;
    }
    setErrorMess(null);
    try {
      await api.deletePlot(id);
      displaySuccess(`Plot [${num}] de-registered successfully.`);
      dispatchAuditLog("PLOT_DELETE", "plots", id, `De-registered physically active land Plot parcel: ${num}`);
      if (selectedPlot?.id === id) setSelectedPlot(null);
      await loadData();
    } catch (err: any) {
      setErrorMess(err.message || "Deletion transaction rejected.");
    }
  };

  const handleArchivePlot = async (id: string, num: string) => {
    if (!window.confirm(`Are you sure you want to Archive Plot ${num}?`)) return;
    setErrorMess(null);
    try {
      const pl = plots.find(p => p.id === id);
      if (!pl) return;
      const res = await api.updatePlot(id, {
        ...pl,
        status: "ARCHIVED"
      });
      displaySuccess(`Plot [${num}] successfully archived.`);
      dispatchAuditLog("PLOT_ARCHIVE", "plots", id, `Archived Plot No: ${num}`);
      if (selectedPlot?.id === id) setSelectedPlot(res);
      await loadData();
    } catch (err: any) {
      setErrorMess(err.message || "Failed to archive plot.");
    }
  };

  const handleRestorePlot = async (id: string, num: string) => {
    if (!window.confirm(`Are you sure you want to Restore Plot ${num}?`)) return;
    setErrorMess(null);
    try {
      const pl = plots.find(p => p.id === id);
      if (!pl) return;
      const res = await api.updatePlot(id, {
        ...pl,
        status: "AVAILABLE"
      });
      displaySuccess(`Plot [${num}] successfully restored to AVAILABLE status.`);
      dispatchAuditLog("PLOT_RESTORE", "plots", id, `Restored Plot No: ${num}`);
      if (selectedPlot?.id === id) setSelectedPlot(res);
      await loadData();
    } catch (err: any) {
      setErrorMess(err.message || "Failed to restore plot.");
    }
  };

  const handleDuplicatePlot = async (id: string) => {
    if (!window.confirm("Are you sure you want to Duplicate this Plot record?")) return;
    setErrorMess(null);
    try {
      const pl = plots.find(p => p.id === id);
      if (!pl) return;
      const newNum = `${pl.plot_number}_copy`;
      const payload = {
        layout_id: pl.layout_id,
        plot_number: newNum,
        area_value: Number(pl.area_value),
        measurement_unit_id: pl.measurement_unit_id,
        length: pl.length ? Number(pl.length) : null,
        width: pl.width ? Number(pl.width) : null,
        road_width: Number(pl.road_width || 0),
        corner_plot: pl.corner_plot,
        facing: pl.facing,
        dimensions: pl.dimensions,
        dimensions_metadata: tryParseJSON(pl.dimensions_metadata, {}),
        status: "AVAILABLE"
      };
      const res = await api.createPlot(payload);
      displaySuccess(`Plot duplicated as '${newNum}' successfully!`);
      dispatchAuditLog("PLOT_DUPLICATE", "plots", res.id, `Duplicated Plot '${pl.plot_number}' to '${newNum}'`);
      await loadData();
    } catch (err: any) {
      setErrorMess(err.message || "Failed to duplicate plot.");
    }
  };

  const handleMovePlot = async () => {
    if (!movePlotTarget.layoutId) {
      setErrorMess("Please select a target Layout phase.");
      return;
    }
    setErrorMess(null);
    try {
      const orig = plots.find(p => p.id === movePlotTarget.plotId);
      if (!orig) return;
      const res = await api.updatePlot(movePlotTarget.plotId, {
        ...orig,
        layout_id: movePlotTarget.layoutId
      });
      const targetLayout = lookupLayouts.find(l => l.id === movePlotTarget.layoutId);
      displaySuccess(`Plot [${orig.plot_number}] moved to Layout '${targetLayout?.name || "N/A"}' successfully!`);
      dispatchAuditLog("PLOT_MOVE", "plots", orig.id, `Moved Plot '${orig.plot_number}' from previous layout to '${targetLayout?.name || "N/A"}'`);
      setCurrModal(null);
      if (selectedPlot?.id === orig.id) setSelectedPlot(res);
      await loadData();
    } catch (err: any) {
      setErrorMess(err.message || "Failed to move plot.");
    }
  };

  const handleSplitPlot = async () => {
    const { plotId, plotANumber, plotAArea, plotBNumber, plotBArea, layoutId, unitId, facing } = splitPlotTarget;
    if (!plotANumber || !plotBNumber || plotAArea <= 0 || plotBArea <= 0) {
      setErrorMess("Please specify valid plot numbers and areas larger than 0.");
      return;
    }
    if (!hasPermission("plots.split")) {
      setErrorMess("403 ACCESS FORBIDDEN: You do not have the required entitlement or permission (plots.split) to perform this action.");
      return;
    }
    setErrorMess(null);
    try {
      const orig = plots.find(p => p.id === plotId);
      if (!orig) return;
      
      // 1. Update/Rename/Archive original plot
      await api.updatePlot(plotId, {
        ...orig,
        plot_number: `${orig.plot_number}_split_old_${Date.now()}`,
        status: "ARCHIVED"
      });

      // 2. Create Plot A
      await api.createPlot({
        layout_id: layoutId,
        plot_number: plotANumber,
        area_value: Number(plotAArea),
        measurement_unit_id: unitId,
        facing: facing,
        status: "AVAILABLE",
        dimensions_metadata: { split_from_plot_id: plotId }
      });

      // 3. Create Plot B
      await api.createPlot({
        layout_id: layoutId,
        plot_number: plotBNumber,
        area_value: Number(plotBArea),
        measurement_unit_id: unitId,
        facing: facing,
        status: "AVAILABLE",
        dimensions_metadata: { split_from_plot_id: plotId }
      });

      displaySuccess(`Plot [${orig.plot_number}] split into [${plotANumber}] and [${plotBNumber}] successfully!`);
      dispatchAuditLog("PLOT_SPLIT", "plots", plotId, `Split Plot '${orig.plot_number}' into '${plotANumber}' (${plotAArea} units) and '${plotBNumber}' (${plotBArea} units)`);
      setCurrModal(null);
      setSelectedPlot(null);
      await loadData();
    } catch (err: any) {
      setErrorMess(err.message || "Failed to split plot.");
    }
  };

  const handleMergePlots = async () => {
    const { sourcePlotIds, layoutId, newPlotNumber, newAreaValue, unitId, facing } = mergePlotTarget;
    if (sourcePlotIds.length < 2) {
      setErrorMess("Please select at least 2 plots to merge.");
      return;
    }
    if (!newPlotNumber || newAreaValue <= 0) {
      setErrorMess("Please specify a valid merged plot number and area larger than 0.");
      return;
    }
    if (!hasPermission("plots.merge")) {
      setErrorMess("403 ACCESS FORBIDDEN: You do not have the required entitlement or permission (plots.merge) to perform this action.");
      return;
    }
    setErrorMess(null);
    try {
      const names: string[] = [];
      for (const id of sourcePlotIds) {
        const orig = plots.find(p => p.id === id);
        if (orig) {
          names.push(orig.plot_number);
          await api.updatePlot(id, {
            ...orig,
            plot_number: `${orig.plot_number}_merged_old_${Date.now()}`,
            status: "ARCHIVED"
          });
        }
      }

      const res = await api.createPlot({
        layout_id: layoutId,
        plot_number: newPlotNumber,
        area_value: Number(newAreaValue),
        measurement_unit_id: unitId,
        facing: facing,
        status: "AVAILABLE",
        dimensions_metadata: { merged_from_plot_ids: sourcePlotIds }
      });

      displaySuccess(`Plots [${names.join(", ")}] merged into [${newPlotNumber}] successfully!`);
      dispatchAuditLog("PLOT_MERGE", "plots", res.id, `Merged Plots '${names.join(", ")}' into new Plot: '${newPlotNumber}' (${newAreaValue} units)`);
      setCurrModal(null);
      setSelectedPlotIds([]);
      setSelectedPlot(res);
      await loadData();
    } catch (err: any) {
      setErrorMess(err.message || "Failed to merge plots.");
    }
  };

  // --- EXTENSIBLE ATTRIBUTES CONTROLS ---
  // Users toggle custom plot parameters dynamically, mapped to the plot's JSON metadata
  const handleToggleExtAttribute = async (key: string, currentValue: boolean) => {
    if (!selectedPlot) return;
    setErrorMess(null);
    try {
      const parsedMeta = tryParseJSON(selectedPlot.dimensions_metadata, {});
      const currentAttributes = parsedMeta.plot_attributes || {};
      const updatedAttributes = {
        ...currentAttributes,
        [key]: !currentValue
      };

      const updatedMeta = {
        ...parsedMeta,
        plot_attributes: updatedAttributes
      };

      const res = await api.updatePlot(selectedPlot.id, {
        plot_number: selectedPlot.plot_number,
        area_value: Number(selectedPlot.area_value),
        measurement_unit_id: selectedPlot.measurement_unit_id,
        dimensions_metadata: updatedMeta
      });

      setSelectedPlot(res);
      displaySuccess(`Custom attribute '${key}' updated!`);
      dispatchAuditLog("PLOT_UPDATE", "plots", res.id, `Toggled extensible attribute '${key}' on plot: ${res.plot_number}`);
      await loadData();
    } catch (err: any) {
      setErrorMess(err.message || "Failed to update extensible plot features.");
    }
  };

  const handleAddCustomAttributeString = async (newKey: string) => {
    if (!selectedPlot || !newKey.trim()) return;
    setErrorMess(null);
    try {
      const parsedMeta = tryParseJSON(selectedPlot.dimensions_metadata, {});
      const currentAttributes = parsedMeta.plot_attributes || {};
      const updatedAttributes = {
        ...currentAttributes,
        [newKey.trim()]: true
      };

      const updatedMeta = {
        ...parsedMeta,
        plot_attributes: updatedAttributes
      };

      const res = await api.updatePlot(selectedPlot.id, {
        plot_number: selectedPlot.plot_number,
        area_value: Number(selectedPlot.area_value),
        measurement_unit_id: selectedPlot.measurement_unit_id,
        dimensions_metadata: updatedMeta
      });

      setSelectedPlot(res);
      displaySuccess(`Successfully registered active custom attribute '${newKey}'`);
      dispatchAuditLog("PLOT_UPDATE", "plots", res.id, `Injected new custom attributes value '${newKey}' in plots ledger`);
      await loadData();
    } catch (err: any) {
      setErrorMess(err.message || "Failed to append custom metadata string.");
    }
  };

  // --- BULK OPERATIONS ENGINE (High-throughput frontend-orchestrated pipeline) ---
  
  // 1. Bulk Plot Create
  const handleBulkCreatePlotsSequence = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMess(null);
    setLoading(true);
    let successCount = 0;
    try {
      const start = Number(bulkCreate.startNo);
      const end = Number(bulkCreate.endNo);
      if (isNaN(start) || isNaN(end) || start > end) {
        throw new Error("Invalid range parameters. Start number must be smaller than End.");
      }

      const totalItems = end - start + 1;
      if (totalItems > 50) {
        throw new Error("Limit of 50 concurrent creations exceeded for high execution stability.");
      }

      const parsedAttributes = tryParseJSON(bulkCreate.default_attributes, {});

      // Sequential robust loop to preserve transactions
      for (let i = start; i <= end; i++) {
        const numStr = `${bulkCreate.prefix}${i}`;
        const payload = {
          layout_id: bulkCreate.layout_id,
          plot_number: numStr,
          area_value: Number(bulkCreate.area_value),
          measurement_unit_id: bulkCreate.measurement_unit_id,
          facing: bulkCreate.facing,
          road_width: Number(bulkCreate.road_width || 0),
          corner_plot: bulkCreate.corner_plot,
          dimensions: `${bulkCreate.road_width}x${bulkCreate.road_width}`,
          dimensions_metadata: {
            shape: "rectangular",
            plot_attributes: parsedAttributes
          },
          status: "AVAILABLE"
        };
        await api.createPlot(payload);
        successCount++;
      }

      displaySuccess(`Successfully created batch series of ${successCount} plots!`);
      const rangeLabel = `${bulkCreate.prefix}${start} to ${bulkCreate.prefix}${end}`;
      dispatchAuditLog("BULK_CREATE", "plots", "BULK-CREATOR", `Generated cluster of ${successCount} physical plots under sequence range [${rangeLabel}]`);
      setCurrModal(null);
      await loadData();
    } catch (err: any) {
      setErrorMess(`Batch execution error. Catalogs generated: ${successCount}. Detail: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 2. Bulk Plots Status Update
  const handleBulkStatusChange = async (targetStatus: string) => {
    if (selectedPlotIds.length === 0) return;
    setLoading(true);
    setErrorMess(null);
    let success = 0;
    try {
      for (const id of selectedPlotIds) {
        const orig = plots.find(p => p.id === id);
        if (!orig) continue;
        await api.updatePlot(id, {
          plot_number: orig.plot_number,
          area_value: Number(orig.area_value),
          measurement_unit_id: orig.measurement_unit_id,
          status: targetStatus
        });
        success++;
      }
      displaySuccess(`Updated status to ${targetStatus} for ${success} selected Plots!`);
      dispatchAuditLog("BULK_UPDATE", "plots", "MIXED-SET", `Modified status states down to '${targetStatus}' on collection of ${success} individual plots`);
      setSelectedPlotIds([]);
      setCurrModal(null);
      await loadData();
    } catch (err: any) {
      setErrorMess(`Bulk update aborted after ${success} items modified. Detail: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. Bulk Plots Properties Update
  const handleBulkPropertiesChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlotIds.length === 0) return;
    setLoading(true);
    setErrorMess(null);
    let success = 0;
    try {
      for (const id of selectedPlotIds) {
        const orig = plots.find(p => p.id === id);
        if (!orig) continue;
        
        const payload: any = {
          plot_number: orig.plot_number,
          area_value: bulkUpdateProps.area_value ? Number(bulkUpdateProps.area_value) : Number(orig.area_value),
          measurement_unit_id: orig.measurement_unit_id
        };

        if (bulkUpdateProps.facing) payload.facing = bulkUpdateProps.facing;
        if (bulkUpdateProps.road_width) payload.road_width = Number(bulkUpdateProps.road_width);

        await api.updatePlot(id, payload);
        success++;
      }
      displaySuccess(`Batch metrics successfully updated across ${success} targets!`);
      dispatchAuditLog("BULK_UPDATE", "plots", "MIXED-SET", `Altered dimensions layout constraints across ${success} plots in active batch selection`);
      setSelectedPlotIds([]);
      setCurrModal(null);
      await loadData();
    } catch (err: any) {
      setErrorMess(`Batch properties allocation halted. Altered items: ${success}. Detail: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- EXTRACT RELATIONSHIPS COUNT MAPS ---
  const getLayoutsForProject = (projId: string) => lookupLayouts.filter(l => l.project_id === projId);
  const getPlotsForProject = (projId: string) => {
    // Plots are now queried server-side due to 1,000,000 row limits.
    return [];
  };
  const getPlotsForLayout = (layId: string) => plots.filter(p => p.layout_id === layId);

  // --- SUB-TABS RENDERERS FOR ERP PROJECT WORKSPACE  // 1. Overview Tab
  const renderOverviewTab = () => {
    if (!selectedProject) return null;
    const lays = getLayoutsForProject(selectedProject.id);
    const plts = plots.filter(p => lays.some(l => String(l.id) === String(p.layout_id)));
    
    const milestoneTasks = [
      { id: "rera_upload", name: "RERA Registration Certificate Upload & Compliance" },
      { id: "cad_verification", name: "On-site Cadastral GPS Boundary Demarcation" },
      { id: "layout_drafting", name: "Layout Phase 1 Plot Subdivision Draft" },
      { id: "legal_registry", name: "Verify Legal Land Titles & Encumbrance Status" },
      { id: "noc_pipeline", name: "Obtain Sewerage & Water Pipeline NOC" },
      { id: "municipal_approval", name: "Secure Municipal Town Planning Final Sanction" }
    ];

    const projId = selectedProject.id;
    const currentProjCompletedTasks = completedTasks[projId] || {};
    const completedCount = milestoneTasks.filter(t => currentProjCompletedTasks[t.id]).length;
    const completionRate = Math.round((completedCount / milestoneTasks.length) * 100);

    const toggleTask = (taskId: string) => {
      setCompletedTasks(prev => {
        const curr = prev[projId] || {};
        return {
          ...prev,
          [projId]: {
            ...curr,
            [taskId]: !curr[taskId]
          }
        };
      });
      if (onAuditLogged) {
        onAuditLogged({
          id: `audit-${Date.now()}`,
          action: "PROJECT_TASK_TOGGLE",
          model: "projects",
          summary: `Toggled status of milestone task '${taskId}' for Project: ${selectedProject.code}`,
          created_at: new Date().toISOString()
        });
      }
    };

    // Filter project-specific bookings/leads (CRM)
    const projectBookings = projectLeads.filter(l => l.status === "Booked" || l.status === "Reserved");

    // Filter recent audit activity
    const projectActivities = recentAudits.filter(log => 
      String(log.targetId) === String(selectedProject.id) || 
      log.summary.toLowerCase().includes(selectedProject.code.toLowerCase()) ||
      log.summary.toLowerCase().includes(selectedProject.name.toLowerCase())
    );

    // Calculate real drawing imports based on compliance vault documents or tasks completed
    const drawingDocsCount = projectDocuments.filter(d => 
      d.name.toLowerCase().endsWith(".dxf") || 
      d.name.toLowerCase().endsWith(".dwg") || 
      d.name.toLowerCase().endsWith(".pdf") ||
      d.category.toLowerCase().includes("drawing") || 
      d.category.toLowerCase().includes("cad")
    ).length;

    // NEXT ACTION DYNAMIC ENGINE
    let nextStageTitle = "Phase Planning";
    let nextStepDesc = "Register your first layout subdivision phase under this project to map lots.";
    let nextStepTime = "5 mins";
    let nextStepButtonText = "Create Layout Phase";
    let nextStepAction = () => {
      setProjectWorkspaceTab("layouts");
    };

    if (lays.length === 0) {
      nextStageTitle = "Phase Planning";
      nextStepDesc = "A Layout represents a subdivision phase. No layouts exist. Create your first layout subdivision phase to begin onboarding plots.";
      nextStepTime = "5 mins";
      nextStepButtonText = "Create Layout Phase";
      nextStepAction = () => {
        setProjectWorkspaceTab("layouts");
        setEditId(null);
        setFormLay({
          project_id: selectedProject.id,
          name: "",
          code: "",
          layout_type: "RESIDENTIAL",
          approval_number: "",
          survey_number: "",
          approval_date: "",
          total_area_value: "",
          total_area_unit_id: getDefaultUnitId(selectedProject.id),
          measurement_unit_id: getDefaultUnitId(selectedProject.id),
          status: "DRAFT",
          phase: "",
          description: ""
        });
        setCurrModal("create_layout");
      };
    } else if (plts.length === 0) {
      nextStageTitle = "CAD Vector Drawing Import";
      nextStepDesc = "Layout phase created. Now import a CAD drawing (.DXF) or upload a georeferenced surveyor map to generate parcels.";
      nextStepTime = "12 mins";
      nextStepButtonText = "Import CAD / DXF";
      nextStepAction = () => {
        setSelectedLayout(lays[0]);
        setActiveTab("cad");
      };
    } else if (completionRate < 100) {
      const firstPending = milestoneTasks.find(t => !currentProjCompletedTasks[t.id]);
      nextStageTitle = "Regulatory & Physical Onboarding";
      nextStepDesc = `Complete the next pending administrative milestone: "${firstPending?.name}". Toggle milestone checks once finalized.`;
      nextStepTime = "Ongoing";
      nextStepButtonText = "Review Compliance Vault";
      nextStepAction = () => {
        setProjectWorkspaceTab("documents");
      };
    } else {
      nextStageTitle = "Subdivision Live Operations";
      nextStepDesc = "All onboarding milestones and CAD alignments are 100% complete. Monitor sales bookings and customer pipelines.";
      nextStepTime = "Ongoing";
      nextStepButtonText = "Open Sales CRM";
      nextStepAction = () => {
        setProjectWorkspaceTab("sales");
      };
    }

    return (
      <div className="space-y-6 animate-fade-in" id="overview-tab-view">
        {/* Six Compact KPI Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs hover:shadow-xs transition-shadow flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-650 rounded-xl shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">Layout Phases</p>
              <p className="text-sm font-extrabold text-slate-950 mt-0.5">{lays.length}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs hover:shadow-xs transition-shadow flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
              <Compass className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">Total Tracts</p>
              <p className="text-sm font-extrabold text-slate-950 mt-0.5">{plts.length}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs hover:shadow-xs transition-shadow flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">Compliance Docs</p>
              <p className="text-sm font-extrabold text-slate-950 mt-0.5">{projectDocuments.length}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs hover:shadow-xs transition-shadow flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-650 rounded-xl shrink-0">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">CAD Imports</p>
              <p className="text-sm font-extrabold text-slate-950 mt-0.5">{drawingDocsCount || (currentProjCompletedTasks.cad_verification ? 1 : 0)}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs hover:shadow-xs transition-shadow flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">Active Bookings</p>
              <p className="text-sm font-extrabold text-slate-950 mt-0.5">{projectBookings.length}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs hover:shadow-xs transition-shadow flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">CRM Customers</p>
              <p className="text-sm font-extrabold text-slate-950 mt-0.5">{projectLeads.length}</p>
            </div>
          </div>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT AREA (8 columns in large screens): Next Action Panel & Onboarding Milestones Checklist */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Next Action Dynamic Panel */}
            <div className="bg-indigo-900 text-white rounded-2xl p-6 shadow-md border border-indigo-950 space-y-4 relative overflow-hidden" id="next-action-panel">
              <div className="absolute right-0 bottom-0 opacity-[0.04] text-white select-none pointer-events-none transform translate-y-6 translate-x-6">
                <Compass className="w-64 h-64 rotate-12" />
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-indigo-800/60 pb-3">
                <div className="space-y-1">
                  <span className="bg-indigo-800 text-indigo-200 border border-indigo-700/80 font-mono text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Recommended Next Action
                  </span>
                  <h3 className="text-sm font-extrabold tracking-tight uppercase mt-1 text-white">
                    Current Stage: {nextStageTitle}
                  </h3>
                </div>
                <div className="flex items-center gap-1 bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-800/40 text-[10.5px] font-mono text-indigo-200 font-bold">
                  <span>Est: {nextStepTime}</span>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold text-indigo-100 leading-relaxed max-w-2xl">
                  {nextStepDesc}
                </p>
                <div className="pt-2">
                  <button
                    onClick={nextStepAction}
                    className="bg-white hover:bg-slate-150 text-indigo-900 font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-indigo-650 fill-indigo-650" />
                    <span>{nextStepButtonText}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Pending Tasks Milestones Checklist */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-xs font-extrabold text-slate-800 tracking-tight flex items-center gap-2 uppercase">
                  <CheckSquare className="w-4 h-4 text-indigo-650" />
                  <span>Administrative Milestones &amp; Compliance Checks</span>
                </h3>
                <span className="text-xs font-mono font-extrabold text-indigo-650 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                  {completionRate}% Done
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {milestoneTasks.map(task => {
                  const isDone = !!currentProjCompletedTasks[task.id];
                  return (
                    <div 
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`flex items-center gap-3 p-3 hover:bg-slate-50 border rounded-xl cursor-pointer transition-all ${
                        isDone ? "bg-emerald-50/20 border-emerald-100" : "bg-white border-slate-200/60"
                      }`}
                    >
                      <button type="button" className="text-slate-400 hover:text-indigo-650 transition-colors shrink-0">
                        {isDone ? (
                          <CheckSquare className="w-4.5 h-4.5 text-emerald-600 fill-emerald-50" />
                        ) : (
                          <Square className="w-4.5 h-4.5 text-slate-300" />
                        )}
                      </button>
                      <span className={`text-xs font-semibold leading-snug transition-all ${isDone ? "line-through text-slate-400 font-normal" : "text-slate-700"}`}>
                        {task.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Compliance Document Summary Area */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs" id="overview-document-summary">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-xs font-extrabold text-slate-800 tracking-tight flex items-center gap-2 uppercase">
                  <FileText className="w-4 h-4 text-indigo-650" />
                  <span>Compliance &amp; Surveyor Drawing Documents Vault</span>
                </h3>
                <button
                  onClick={() => setProjectWorkspaceTab("documents")}
                  className="text-[10px] font-bold text-indigo-655 hover:underline"
                >
                  Manage Files
                </button>
              </div>

              {projectDocuments.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 space-y-3 flex flex-col items-center justify-center">
                  <div className="p-3 bg-white border border-slate-150 rounded-xl">
                    <Download className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">No Compliance Documents Registered</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      Upload DTCP sanctions, encumbrance certificates, RERA approvals, or Surveyor DXF drawings to establish a clear audit log.
                    </p>
                  </div>
                  <button
                    onClick={() => setProjectWorkspaceTab("documents")}
                    className="px-3.5 py-1.5 bg-white border border-slate-250 rounded-lg hover:bg-slate-50 transition-colors text-[11px] font-bold text-slate-600 shadow-3xs cursor-pointer"
                  >
                    Upload Document File
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {projectDocuments.slice(0, 4).map(doc => (
                    <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl flex justify-between items-center">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{doc.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{doc.category} &bull; {doc.size}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 bg-emerald-50 text-emerald-700 border-emerald-100">
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT AREA (4 columns in large screens): Project Timeline & Recent Audits */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Project Timeline Widget */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs" id="vertical-project-timeline">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-extrabold text-slate-800 tracking-tight flex items-center gap-2 uppercase">
                  <Calendar className="w-4 h-4 text-indigo-650" />
                  <span>Milestone Stage Timeline</span>
                </h3>
              </div>

              <div className="relative pl-6 space-y-5">
                {/* Vertical timeline line */}
                <div className="absolute left-2.5 top-1.5 bottom-1.5 w-0.5 bg-slate-200" />

                {[
                  { id: "proj_created", label: "Project Created", desc: "Registry record established", completed: true, current: false },
                  { id: "lay_created", label: "Layout Phase Structured", desc: "Subdivision bounds declared", completed: lays.length > 0, current: lays.length === 0 },
                  { id: "dxf_imported", label: "Drawing DXF Uploaded", desc: "Cadastral vectors processed", completed: plts.length > 0 || !!currentProjCompletedTasks.cad_verification, current: lays.length > 0 && plts.length === 0 },
                  { id: "plots_drafted", label: "Plots Generated", desc: "Subdivision lots cataloged", completed: plts.length > 0, current: plts.length > 0 && completionRate < 100 },
                  { id: "compliance_checked", label: "Compliance Finalized", desc: "All legal NOCs secured", completed: completionRate === 100, current: plts.length > 0 && completionRate > 0 && completionRate < 100 },
                  { id: "sub_published", label: "Subdivision Live", desc: "Launched in Marketplace CRM", completed: selectedProject.status === "ACTIVE" && completionRate === 100, current: completionRate === 100 && selectedProject.status !== "ACTIVE" }
                ].map((item, idx) => {
                  let statusColor = "bg-slate-200 border-slate-300 text-slate-400";
                  let dotIconColor = "bg-slate-400";
                  if (item.completed) {
                    statusColor = "bg-emerald-50 border-emerald-200 text-emerald-800";
                    dotIconColor = "bg-emerald-500";
                  } else if (item.current) {
                    statusColor = "bg-indigo-50 border-indigo-200 text-indigo-850 ring-4 ring-indigo-50";
                    dotIconColor = "bg-indigo-600";
                  }

                  return (
                    <div key={item.id} className="relative flex gap-3 text-xs items-start">
                      {/* Timeline Node Dot */}
                      <div className="absolute -left-[20px] top-1 z-10 w-2.5 h-2.5 rounded-full border border-white flex items-center justify-center shrink-0">
                        <div className={`w-1.5 h-1.5 rounded-full ${dotIconColor}`} />
                      </div>

                      <div className={`flex-1 p-3 rounded-xl border transition-all ${statusColor}`}>
                        <div className="flex justify-between items-center">
                          <p className="font-bold text-[11px] uppercase tracking-wide">{item.label}</p>
                          {item.completed && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3.5px]" />}
                        </div>
                        <p className="text-[10px] opacity-80 mt-0.5 font-semibold">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Booking Ledger Bento */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-xs font-extrabold text-slate-800 tracking-tight flex items-center gap-2 uppercase">
                  <Tag className="w-4 h-4 text-indigo-650" />
                  <span>Recent Plot Sales</span>
                </h3>
                <button 
                  onClick={() => setProjectWorkspaceTab("sales")}
                  className="text-[10px] font-bold text-indigo-650 hover:underline"
                >
                  Full CRM
                </button>
              </div>
              {projectBookings.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  No buyers listed yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {projectBookings.slice(0, 3).map(b => (
                    <div key={b.id} className="p-3 bg-slate-50/50 border border-slate-200/40 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{b.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Lot Assigned: <span className="font-mono font-bold text-indigo-600">#{b.plotNum}</span></p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-extrabold text-slate-850 block">{b.paidAmount}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-rose-50 text-rose-700 border border-rose-100 uppercase inline-block mt-0.5">
                          {b.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit Log Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-extrabold text-slate-800 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3 uppercase">
                <Activity className="w-4 h-4 text-indigo-650" />
                <span>Project Security Audit</span>
              </h3>
              {projectActivities.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-[11px] italic">
                  No security audits recorded.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {projectActivities.slice(0, 3).map((activity) => (
                    <div key={activity.id} className="flex gap-2.5 text-xs items-start">
                      <div className="mt-0.5 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-indigo-50 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-700 leading-normal break-words">{activity.summary}</p>
                        <p className="text-[10px] font-mono font-semibold text-slate-400 mt-0.5">
                          {new Date(activity.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    );
  };

  // 2. Sales & Booking Tab
  const renderSalesTab = () => {
    if (!selectedProject) return null;
    const lays = getLayoutsForProject(selectedProject.id);
    const plts = plots.filter(p => lays.some(l => String(l.id) === String(p.layout_id)));
    const avail = plts.filter(p => p.status === "AVAILABLE").length;
    const reserved = plts.filter(p => p.status === "RESERVED" || p.status === "BLOCKED").length;
    const sold = plts.filter(p => p.status === "SOLD" || p.status === "BOOKED").length;
    const total = plts.length;
    
    return (
      <div className="space-y-6 animate-fade-in" id="sales-tab-view">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-xs space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Project Plots</span>
            <span className="text-xl font-black text-slate-900 block">{total} Units</span>
          </div>
          <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-xs space-y-1">
            <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider block">Available Plots</span>
            <span className="text-xl font-black text-emerald-600 block">{avail} Units</span>
          </div>
          <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-xs space-y-1">
            <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider block">Reserved / Blocked</span>
            <span className="text-xl font-black text-amber-600 block">{reserved} Units</span>
          </div>
          <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-xs space-y-1">
            <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider block">Sold & Booked</span>
            <span className="text-xl font-black text-rose-600 block">{sold} Units</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-extrabold text-slate-800 tracking-tight">Project Sales Progress Ratio</span>
            <span className="font-mono font-extrabold text-indigo-700">{total > 0 ? Math.round((sold / total) * 100) : 0}% Sold</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden flex">
            <div className="bg-rose-500 h-full" style={{ width: `${total > 0 ? (sold / total) * 100 : 0}%` }}></div>
            <div className="bg-amber-400 h-full" style={{ width: `${total > 0 ? (reserved / total) * 100 : 0}%` }}></div>
            <div className="bg-emerald-500 h-full flex-1"></div>
          </div>
          <div className="flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-1">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-xs"></span> Sold ({sold})</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-400 rounded-xs"></span> Reserved ({reserved})</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-50 rounded-xs border border-emerald-200"></span> Available ({avail})</span>
          </div>
        </div>

        {/* Interactive Visual Map Blueprint Board */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Interactive Sales Matrix Board</h3>
            <p className="text-[10px] text-slate-400 mt-1">Select any parcel below to inspect unit status or trigger dimension specs</p>
          </div>
          
          {lays.length === 0 ? (
            <p className="text-xs text-slate-450 text-center py-6">No active subdivision layouts configured for this project yet.</p>
          ) : (
            lays.map(lay => {
              const layPlots = plots.filter(p => String(p.layout_id) === String(lay.id));
              return (
                <div key={lay.id} className="border border-slate-200/50 rounded-xl p-4 bg-slate-50/40 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-800">{lay.name} ({lay.code})</span>
                    <span className="text-[10px] font-semibold text-slate-400">{layPlots.length} Plots total</span>
                  </div>
                  {layPlots.length === 0 ? (
                    <p className="text-[10.5px] text-slate-400 italic py-2">No individual plots exist for this layout yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {layPlots.map(pl => {
                        let colorClass = "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100";
                        if (pl.status === "SOLD" || pl.status === "BOOKED") {
                          colorClass = "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100";
                        } else if (pl.status === "RESERVED" || pl.status === "BLOCKED" || pl.status === "HOLD") {
                          colorClass = "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100";
                        }
                        return (
                          <div
                            key={pl.id}
                            onClick={() => {
                              setSelectedPlot(pl);
                              setProjectWorkspaceTab("plots");
                            }}
                            className={`px-3 py-2 border text-center rounded-xl font-mono text-xs font-bold cursor-pointer transition-all shadow-3xs hover:scale-105 active:scale-95 flex flex-col justify-center min-w-[70px] ${colorClass}`}
                            title={`Plot No: ${pl.plot_number} - Click to Inspect`}
                          >
                            <span>#{pl.plot_number}</span>
                            <span className="text-[8px] opacity-80 font-sans mt-0.5">{pl.area_value} {getUnitCode(pl.measurement_unit_id)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // 3. Customers CRM Tab
  const renderCustomersTab = () => {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 animate-fade-in" id="customers-tab-view">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Active Buyer Ledger (ERP CRM)</h3>
            <p className="text-[10px] text-slate-400 mt-1">Track down-payments, booking progress, and sales representatives</p>
          </div>
          <button
            onClick={() => {
              const name = prompt("Enter customer full name:");
              const email = prompt("Enter customer email:");
              const phone = prompt("Enter customer phone number:");
              const plotNum = prompt("Enter assigned Plot Number (optional):");
              if (name && email && phone) {
                const newLead = {
                  id: `lead-${Date.now()}`,
                  name,
                  email,
                  phone,
                  plotNum: plotNum || "N/A",
                  paidAmount: "₹0",
                  rep: user?.email || "System Admin",
                  status: "Lead",
                  date: new Date().toISOString().split("T")[0]
                };
                setProjectLeads(prev => [newLead, ...prev]);
                dispatchAuditLog("CRM_LEAD_CREATE", "plots", "N/A", `Registered new prospective CRM lead: ${name}`);
              }
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3px]" />
            <span>Register Lead</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-500">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">Contact Details</th>
                <th className="px-4 py-3 text-center">Assigned Plot</th>
                <th className="px-4 py-3 text-right">Booking Amount Paid</th>
                <th className="px-4 py-3">Sales Officer</th>
                <th className="px-4 py-3 text-center">Pipeline Status</th>
                <th className="px-4 py-3 text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projectLeads.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/40">
                  <td className="px-4 py-3.5 font-bold text-slate-900">{l.name}</td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-600">{l.phone}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{l.email}</p>
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono font-bold text-indigo-600">#{l.plotNum}</td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-800">{l.paidAmount}</td>
                  <td className="px-4 py-3.5 font-medium text-slate-600">{l.rep}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border inline-block ${
                      l.status === "Booked" ? "bg-rose-50 text-rose-700 border-rose-100" :
                      l.status === "Reserved" ? "bg-amber-50 text-amber-700 border-amber-100" :
                      "bg-blue-50 text-blue-700 border-blue-100"
                    }`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-medium text-slate-400">{l.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 4. Documents Tab (Drag and drop + manual file upload)
  const renderDocumentsTab = () => {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 animate-fade-in" id="documents-tab-view">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Project Compliance Documents Vault</h3>
          <p className="text-[10px] text-slate-400 mt-1">Secure regulatory certificates, surveyor layout blueprint PDFs, and official land deeds</p>
        </div>

        {/* Drag and Drop File Uploader Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const files = e.dataTransfer.files;
            if (files.length > 0) {
              const file = files[0];
              const newDoc = {
                id: `doc-${Date.now()}`,
                name: file.name,
                category: "Compliance Document",
                size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                status: "Approved",
                date: new Date().toISOString().split("T")[0]
              };
              setProjectDocuments(prev => [newDoc, ...prev]);
              dispatchAuditLog("DOCUMENT_UPLOAD", "projects", selectedProject.id, `Uploaded document to compliance vault: ${file.name}`);
              displaySuccess(`Successfully uploaded compliant file: ${file.name}`);
            }
          }}
          className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-8 text-center bg-slate-50/50 transition-colors cursor-pointer group space-y-3 flex flex-col items-center justify-center"
        >
          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs group-hover:scale-110 transition-transform">
            <Download className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Drag and drop file here, or click to browse</p>
            <p className="text-[10px] text-slate-400 mt-1">Supports PDF, CAD DXF, JPEG, or PNG up to 50MB</p>
          </div>
          <input
            type="file"
            id="manual-file-input"
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                const file = files[0];
                const newDoc = {
                  id: `doc-${Date.now()}`,
                  name: file.name,
                  category: "Compliance Document",
                  size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                  status: "Approved",
                  date: new Date().toISOString().split("T")[0]
                };
                setProjectDocuments(prev => [newDoc, ...prev]);
                dispatchAuditLog("DOCUMENT_UPLOAD", "projects", selectedProject.id, `Uploaded document to compliance vault: ${file.name}`);
                displaySuccess(`Successfully uploaded compliant file: ${file.name}`);
              }
            }}
          />
          <button
            type="button"
            onClick={() => document.getElementById("manual-file-input")?.click()}
            className="px-3.5 py-1.5 bg-white border border-slate-250 rounded-lg hover:bg-slate-50 transition-colors text-[11px] font-bold text-slate-600 shadow-3xs cursor-pointer active:scale-95"
          >
            Select Document File
          </button>
        </div>

        {/* Documents list */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-500">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Document File Name</th>
                <th className="px-4 py-3">Category Group</th>
                <th className="px-4 py-3 text-center">File Size</th>
                <th className="px-4 py-3 text-center">Compliance Status</th>
                <th className="px-4 py-3 text-right">Upload Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projectDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/40">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <span className="font-bold text-slate-800">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-600">{doc.category}</td>
                  <td className="px-4 py-3.5 text-center font-mono font-semibold text-slate-500">{doc.size}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border inline-block ${
                      doc.status === "Approved" || doc.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      doc.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-100" :
                      "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-400">{doc.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 5. Reports and Analytics Tab
  const renderReportsTab = () => {
    if (!selectedProject) return null;
    const lays = getLayoutsForProject(selectedProject.id);
    const plts = plots.filter(p => lays.some(l => String(l.id) === String(p.layout_id)));
    
    // Status counts data
    const statusData = [
      { name: "Available", value: plts.filter(p => p.status === "AVAILABLE").length, color: "#10B981" },
      { name: "Booked/Sold", value: plts.filter(p => p.status === "BOOKED" || p.status === "SOLD").length, color: "#EF4444" },
      { name: "Reserved", value: plts.filter(p => p.status === "RESERVED" || p.status === "BLOCKED").length, color: "#F59E0B" }
    ].filter(item => item.value > 0);

    // Area data across layouts
    const areaData = lays.map(l => {
      const layPlots = plots.filter(p => String(p.layout_id) === String(l.id));
      const totalArea = layPlots.reduce((acc, curr) => acc + Number(curr.area_value || 0), 0);
      return {
        name: l.name.substring(0, 15),
        "Developed Area": totalArea
      };
    });

    return (
      <div className="space-y-6 animate-fade-in" id="reports-tab-view">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Subdivision Analytics Dashboard</h3>
          <p className="text-[10px] text-slate-400 mt-1">Charts tracking developed sectors and sales conversions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pie Chart of Sales status */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Plot Inventory Status Distribution</h4>
            {statusData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">No active plots in layouts to analyze.</p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Units`, "Volume"]} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Bar Chart of layout areas */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Developed Area Distribution (Sq. Yards)</h4>
            {areaData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">No layouts developed yet.</p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={areaData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                    <Tooltip formatter={(value) => [`${value.toLocaleString()} Sq Yards`, "Developed Area"]} />
                    <Bar dataKey="Developed Area" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 6. Settings Tab
  const renderSettingsTab = () => {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 animate-fade-in" id="settings-tab-view">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Project Registry Configuration</h3>
          <p className="text-[10px] text-slate-400 mt-1">Edit administrative details, RERA compliance, and GPS geodetic coordinates</p>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setIsSavingProject(true);
            try {
              const payload = {
                name: formProj.name.trim(),
                developer_name: formProj.developer_name.trim(),
                location: formProj.location.trim(),
                status: formProj.status,
                rera_number: formProj.rera_number.trim(),
                approval_status: formProj.approval_status,
                approval_authority: formProj.approval_authority.trim(),
                launch_date: formProj.launch_date || null,
                possession_target_date: formProj.possession_target_date || null,
                project_type: formProj.project_type,
                village: formProj.village.trim(),
                taluk: formProj.taluk.trim(),
                district: formProj.district.trim(),
                country: formProj.country,
                pincode: formProj.pincode.trim(),
                latitude: formProj.latitude.trim(),
                longitude: formProj.longitude.trim(),
                description: formProj.description.trim()
              };
              const res = await api.updateProject(selectedProject.id, payload);
              setSelectedProject(res);
              // Reload project catalog list
              const prjRes = await api.fetchProjects({ per_page: 1000 });
              setLookupProjects(prjRes.data || []);
              dispatchAuditLog("PROJECT_UPDATE", "projects", selectedProject.id, `Modified project registry specifications for: ${res.name}`);
              displaySuccess("Successfully saved project registry changes!");
            } catch (err: any) {
              displaySuccess("Failed to save settings: " + (err.message || err));
            } finally {
              setIsSavingProject(false);
            }
          }}
          className="space-y-6 text-xs text-slate-600"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 uppercase tracking-wider block">Project Registry Name</label>
              <input
                type="text"
                required
                value={formProj.name}
                onChange={(e) => setFormProj(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 uppercase tracking-wider block">Developer Name</label>
              <input
                type="text"
                required
                value={formProj.developer_name}
                onChange={(e) => setFormProj(prev => ({ ...prev, developer_name: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 uppercase tracking-wider block">RERA Registration No</label>
              <input
                type="text"
                value={formProj.rera_number}
                onChange={(e) => setFormProj(prev => ({ ...prev, rera_number: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 uppercase tracking-wider block">Village / Settlement</label>
              <input
                type="text"
                value={formProj.village}
                onChange={(e) => setFormProj(prev => ({ ...prev, village: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 uppercase tracking-wider block">Taluk / Sub-division</label>
              <input
                type="text"
                value={formProj.taluk}
                onChange={(e) => setFormProj(prev => ({ ...prev, taluk: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 uppercase tracking-wider block">District / Region</label>
              <input
                type="text"
                value={formProj.district}
                onChange={(e) => setFormProj(prev => ({ ...prev, district: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 uppercase tracking-wider block">Latitude (GPS N)</label>
              <input
                type="text"
                value={formProj.latitude}
                onChange={(e) => setFormProj(prev => ({ ...prev, latitude: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 uppercase tracking-wider block">Longitude (GPS E)</label>
              <input
                type="text"
                value={formProj.longitude}
                onChange={(e) => setFormProj(prev => ({ ...prev, longitude: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 uppercase tracking-wider block">Project State</label>
              <select
                value={formProj.status}
                onChange={(e) => setFormProj(prev => ({ ...prev, status: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="PLANNING">PLANNING</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-500 uppercase tracking-wider block">Description Details</label>
            <textarea
              rows={4}
              value={formProj.description}
              onChange={(e) => setFormProj(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingProject}
              className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            >
              {isSavingProject ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Check className="w-4 h-4 stroke-[3px]" />
              )}
              <span>Save Project Registry Settings</span>
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Paginated Slices matching Laravel backend datasets
  const displayProj = projects;
  const displayLay = layouts;
  const displayPlt = plots;

  const totalProjPages = Math.ceil(totalProj / pageSize) || 1;
  const totalLayPages = Math.ceil(totalLay / pageSize) || 1;
  const totalPlotPages = Math.ceil(totalPlot / pageSize) || 1;

  // Row selection toggle
  const togglePlotRowSelect = (id: string) => {
    setSelectedPlotIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAllFilteredPlots = () => {
    if (selectedPlotIds.length === plots.length) {
      setSelectedPlotIds([]);
    } else {
      setSelectedPlotIds(plots.map(p => p.id));
    }
  };

  return (
    <div className="flex bg-[#F8FAFC] border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden min-h-[750px] w-full" id="inventory-manager-container">
      {/* Left Collapsible Sidebar */}
      <div 
        className={`bg-[#0F172A] text-slate-100 flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 select-none border-r border-slate-800 ${
          sidebarExpanded ? "w-[260px]" : "w-[72px]"
        }`} 
        id="inv-sidebar"
      >
        <div className="flex flex-col flex-1 min-w-0">
          {/* Logo Section */}
          <div className="h-16 flex items-center px-4 border-b border-slate-800/60 justify-between">
            {sidebarExpanded ? (
              <div className="flex items-center gap-2.5 min-w-0 animate-fade-in px-1">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                  BO
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-extrabold text-slate-100 tracking-wider uppercase truncate">BhoomiOne V3</span>
                  <span className="text-[9px] text-slate-450 tracking-wide uppercase font-semibold">Tenant ERP</span>
                </div>
              </div>
            ) : (
              <div className="mx-auto w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md">
                BO
              </div>
            )}
          </div>

          {/* Navigation Links Grouped into Workspace and Support */}
          <div className="flex-1 overflow-y-auto py-4 space-y-6">
            {/* WORKSPACE group */}
            <div className="px-3 space-y-1">
              {sidebarExpanded && (
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3.5 mb-2.5 animate-fade-in select-none">
                  Workspace
                </p>
              )}
              {[
                { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
                { id: "projects", label: "Projects", icon: Building2, count: projects.length },
                { id: "layouts", label: "Layouts", icon: Layers, count: layouts.length },
                { id: "cad", label: "Imports", icon: FileCode2 },
                { id: "viewer", label: "Interactive Map", icon: Compass },
                { id: "plots", label: "Plots", icon: Grid, count: plots.length },
                { id: "commercial", label: "Commercial", icon: Percent }
              ].map(tab => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as any); setErrorMess(null); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer text-left relative group ${
                      isActive 
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20 font-bold" 
                        : "text-slate-450 hover:text-white hover:bg-slate-800/50"
                    }`}
                    id={`sidebar-tab-${tab.id}`}
                    title={!sidebarExpanded ? tab.label : undefined}
                  >
                    {/* Left Active Indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-white rounded-r-full" />
                    )}
                    <TabIcon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`} />
                    {sidebarExpanded && (
                      <span className="truncate flex-1">{tab.label}</span>
                    )}
                    {sidebarExpanded && tab.count !== undefined && (
                      <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded-full ml-auto ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                      }`}>
                        {tab.count}
                      </span>
                    )}
                    {!sidebarExpanded && (
                      <div className="absolute left-16 bg-slate-950 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-slate-800/80">
                        {tab.label} {tab.count !== undefined ? `(${tab.count})` : ""}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Divider Line */}
            <div className="mx-3 border-t border-slate-800/40" />

            {/* SUPPORT group */}
            <div className="px-3 space-y-1">
              {sidebarExpanded && (
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3.5 mb-2.5 animate-fade-in select-none">
                  Support
                </p>
              )}
              {[
                { id: "guide", label: "Usage Guide", icon: BookOpen, action: () => setGuideOpen(true), isGuide: true },
                { id: "marketplace", label: "Settings", icon: Settings }
              ].map(tab => {
                const TabIcon = tab.icon;
                const isActive = tab.isGuide ? false : activeTab === tab.id;
                const onClickHandler = tab.action 
                  ? tab.action 
                  : () => { setActiveTab(tab.id as any); setErrorMess(null); };

                return (
                  <button
                    key={tab.id}
                    onClick={onClickHandler}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer text-left relative group ${
                      isActive 
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20 font-bold" 
                        : "text-slate-450 hover:text-white hover:bg-slate-800/50"
                    }`}
                    id={`sidebar-tab-${tab.id}`}
                    title={!sidebarExpanded ? tab.label : undefined}
                  >
                    {/* Left Active Indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-white rounded-r-full" />
                    )}
                    <TabIcon className={`w-4 h-4 shrink-0 transition-colors ${
                      tab.isGuide 
                        ? "text-indigo-400 animate-pulse" 
                        : isActive 
                          ? "text-white" 
                          : "text-slate-400 group-hover:text-slate-200"
                    }`} />
                    {sidebarExpanded && (
                      <span className="truncate flex-1">{tab.label}</span>
                    )}
                    {!sidebarExpanded && (
                      <div className="absolute left-16 bg-slate-950 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-slate-800/80">
                        {tab.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Collapse Toggle Footer */}
        <div className="p-3 border-t border-slate-800/60 space-y-1.5 shrink-0 bg-slate-950/40">
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="w-full flex items-center justify-center py-2.5 text-slate-500 hover:text-white cursor-pointer bg-slate-850/40 hover:bg-slate-850/80 rounded-xl transition-all border-0 shadow-inner active:scale-95"
          >
            {sidebarExpanded ? (
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200">
                <span>Collapse Menu</span>
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              </div>
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400 hover:text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#F8FAFC] flex flex-col min-w-0" id="inv-main-content">
        {/* Workspace Top Header */}
        <div className="border-b border-slate-200 bg-white px-8 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm" id="inv-header">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider text-indigo-600 uppercase font-bold bg-indigo-50/50 border border-indigo-100/50 px-2 py-0.5 rounded-md w-fit">
              <Activity className="w-3 h-3 text-indigo-500" />
              <span>BHOOMIONE V3 CORE</span>
            </div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
              <span>Tenant ERP Workspace</span>
            </h2>
            <p className="text-xs text-slate-450 mt-0.5">Map-first land subdivision development, CAD uploads, and automated plot ledgers</p>
          </div>

          <div className="flex items-center gap-3 font-mono text-[10px] text-slate-400">
            <span>Server Latency: <span className="font-bold text-emerald-600">Stable</span></span>
          </div>
        </div>

      {/* Dynamic Context-Aware Premium Header & Progress Engine */}
      <div className="bg-indigo-50/20 border-b border-indigo-150/40 p-6 space-y-4 animate-fade-in" id="project-active-context-bar">
        {/* Row 1: Breadcrumbs and Primary Action / Context Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            {/* Breadcrumb Trail */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 font-bold flex-wrap">
              <span className="hover:text-indigo-650 transition-colors cursor-pointer" onClick={() => { setSelectedProject(null); setSelectedLayout(null); }}>Dashboard</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="hover:text-indigo-650 transition-colors cursor-pointer" onClick={() => { setSelectedLayout(null); }}>ERP Workspace</span>
              {selectedProject && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <span className="text-indigo-650 hover:underline cursor-pointer" onClick={() => setSelectedLayout(null)}>{selectedProject.name}</span>
                </>
              )}
              {selectedLayout && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <span className="text-teal-600 font-extrabold">{selectedLayout.name}</span>
                </>
              )}
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-indigo-700 capitalize font-extrabold bg-indigo-100/60 px-2 py-0.5 rounded-md">
                {activeTab === "projects" && selectedProject ? (projectWorkspaceTab) : activeTab}
              </span>
            </div>

            {/* Context Header */}
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                {selectedProject ? selectedProject.name : "System Operations Catalog"}
              </h2>
              {selectedProject && (
                <span className="text-xs text-slate-400 font-semibold font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                  ID: {selectedProject.code}
                </span>
              )}
              {selectedLayout && (
                <span className="text-xs text-teal-800 font-semibold font-mono bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                  Layout: {selectedLayout.code}
                </span>
              )}
            </div>

            {/* Context Details */}
            <div className="flex items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 font-medium flex-wrap">
              <p>Project: <span className="text-slate-800 font-semibold">{selectedProject ? selectedProject.name : "N/A"}</span></p>
              <p>Layout: <span className="text-slate-800 font-semibold">{selectedLayout ? selectedLayout.name : "N/A"}</span></p>
              <p>Developer: <span className="text-slate-800 font-semibold">{selectedProject ? (selectedProject.developer_name || "Bhoomi Developers") : "N/A"}</span></p>
              <p>Status: <span className={`font-bold uppercase text-[10px] px-2 py-0.2 rounded ${
                selectedLayout ? (
                  selectedLayout.status === "LAUNCHED" || selectedLayout.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" :
                  selectedLayout.status === "APPROVED" ? "bg-blue-50 text-blue-800 border border-blue-100" :
                  "bg-slate-100 text-slate-600 border border-slate-200"
                ) : selectedProject ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "bg-slate-100 text-slate-600"
              }`}>{selectedLayout ? selectedLayout.status : (selectedProject ? "ACTIVE" : "N/A")}</span></p>
              <p>Current Stage: <span className="text-indigo-600 font-extrabold">{
                selectedLayout ? (
                  selectedLayout.status === "LAUNCHED" || selectedLayout.status === "PUBLISHED" ? "Publishing Completed" : "Geometry Subdivision In-Progress"
                ) : selectedProject ? "Register Layout Phase Plan" : "Select Active Project Context"
              }</span></p>
            </div>
          </div>

          {/* Context Actions / Clear */}
          {selectedProject && (
            <button
              onClick={() => {
                setSelectedProject(null);
                setSelectedLayout(null);
              }}
              className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-100 px-3 py-1.5 rounded-xl shadow-3xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 shrink-0 font-sans"
            >
              <X className="w-3.5 h-3.5 stroke-[3px]" />
              <span>Exit Active Context</span>
            </button>
          )}
        </div>

        {/* Row 2: Horizontal Stepper Progress Indicator */}
        <div className="border-t border-indigo-100/50 pt-4" id="project-workspace-progress">
          <div className="flex flex-wrap items-center gap-y-3 gap-x-2 text-[11px] font-semibold text-slate-500">
            {[
              { label: "Project Created", active: !!selectedProject },
              { label: "Layout Created", active: !!selectedLayout || (selectedProject && layouts.filter(l => l.project_id === selectedProject.id).length > 0) },
              { label: "PDF Uploaded", active: !!selectedLayout },
              { label: "Calibration", active: !!selectedLayout },
              { label: "Boundary", active: !!selectedLayout && activeTab === "viewer" },
              { label: "Roads", active: false },
              { label: "Plots", active: !!selectedLayout && plots.filter(p => p.layout_id === selectedLayout.id).length > 0 },
              { label: "Validation", active: false },
              { label: "Publish", active: selectedLayout?.status === "LAUNCHED" || selectedLayout?.status === "PUBLISHED" }
            ].map((step, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                  step.active 
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200/80 font-bold" 
                    : "bg-slate-50 text-slate-400 border-slate-150"
                }`}>
                  <span className="font-mono text-[9.5px] font-extrabold">{idx + 1}</span>
                  <span>{step.label}</span>
                  {step.active && <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[3px]" />}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Project Workspace Secondary Control Header (only rendered when project is active AND viewing Projects tab) */}
      {selectedProject !== null && activeTab === "projects" && (() => {
        const milestoneTasks = [
          { id: "rera_upload", name: "RERA Registration Certificate Upload & Compliance" },
          { id: "cad_verification", name: "On-site Cadastral GPS Boundary Demarcation" },
          { id: "layout_drafting", name: "Layout Phase 1 Plot Subdivision Draft" },
          { id: "legal_registry", name: "Verify Legal Land Titles & Encumbrance Status" },
          { id: "noc_pipeline", name: "Obtain Sewerage & Water Pipeline NOC" },
          { id: "municipal_approval", name: "Secure Municipal Town Planning Final Sanction" }
        ];
        const currentProjCompletedTasks = completedTasks[selectedProject.id] || {};
        const completedCount = milestoneTasks.filter(t => currentProjCompletedTasks[t.id]).length;
        const completionRate = Math.round((completedCount / milestoneTasks.length) * 100);
        
        const lays = getLayoutsForProject(selectedProject.id);
        const plts = plots.filter(p => lays.some(l => String(l.id) === String(p.layout_id)));

        let activeStage = "Phase Definition";
        if (lays.length === 0) {
          activeStage = "Layout Definition";
        } else if (plts.length === 0) {
          activeStage = "CAD Import & Calibration";
        } else {
          const firstPending = milestoneTasks.find(t => !currentProjCompletedTasks[t.id]);
          if (firstPending) {
            const nameLower = firstPending.name.toLowerCase();
            if (nameLower.includes("rera")) activeStage = "RERA Compliance";
            else if (nameLower.includes("cadastral") || nameLower.includes("boundary") || nameLower.includes("demarcation")) activeStage = "Cadastral Boundary";
            else if (nameLower.includes("draft") || nameLower.includes("subdivision")) activeStage = "Draft Subdivision";
            else if (nameLower.includes("legal") || nameLower.includes("encumbrance")) activeStage = "Legal Title Audit";
            else if (nameLower.includes("noc") || nameLower.includes("water") || nameLower.includes("sewer")) activeStage = "Pipeline NOCs";
            else if (nameLower.includes("municipal") || nameLower.includes("sanction")) activeStage = "Municipal Approval";
            else activeStage = "Operational Calibration";
          } else {
            activeStage = "Subdivision Published";
          }
        }

        return (
          <div className="bg-white border-b border-slate-200 shadow-3xs" id="project-workspace-header">
            {/* Top Row: Title, Statuses & Actions */}
            <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/40">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">{selectedProject.name}</h2>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-50 border border-indigo-150 text-indigo-700 uppercase tracking-wider">
                        {selectedProject.code}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        selectedProject.status === "ACTIVE" ? "bg-emerald-50 text-emerald-800 border-emerald-150" :
                        selectedProject.status === "PLANNING" ? "bg-blue-50 text-blue-800 border-blue-150" :
                        "bg-slate-50 text-slate-600 border-slate-200"
                      }`}>
                        {selectedProject.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <button
                  onClick={() => handleStartEditProject(selectedProject)}
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-3xs active:scale-95 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Project Registry</span>
                </button>
                {hasProjManage && (
                  <button
                    onClick={() => { setSelectedProject(null); setCurrModal("create_project"); }}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 bg-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-sm cursor-pointer active:scale-95 border-0"
                  >
                    <Plus className="w-3.5 h-3.5 text-white stroke-[3px]" />
                    <span>New Project</span>
                  </button>
                )}
              </div>
            </div>

            {/* High-Density Operational Meta Grid */}
            <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 bg-white">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Developer Partner</span>
                <span className="text-xs font-bold text-slate-800 block truncate">{selectedProject.developer_name || "Bhoomi Developers"}</span>
              </div>
              
              <div className="space-y-1 border-l border-slate-100 pl-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Location Context</span>
                <div className="flex items-center gap-1 text-slate-800">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span className="text-xs font-semibold block truncate">{selectedProject.location || "N/A"}</span>
                </div>
              </div>

              <div className="space-y-1 border-l border-slate-100 pl-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approval Authority</span>
                <span className="text-xs font-semibold text-slate-800 block truncate">{selectedProject.approval_authority || "RERA / DTCP"}</span>
              </div>

              <div className="space-y-1 border-l border-slate-100 pl-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Compliance Status</span>
                <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                  selectedProject.approval_status === "APPROVED" ? "text-emerald-700" :
                  selectedProject.approval_status === "REJECTED" ? "text-rose-700" :
                  "text-amber-700"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    selectedProject.approval_status === "APPROVED" ? "bg-emerald-500" :
                    selectedProject.approval_status === "REJECTED" ? "bg-rose-500" :
                    "bg-amber-500"
                  }`} />
                  {selectedProject.approval_status}
                </span>
              </div>

              <div className="space-y-1 border-l border-slate-100 pl-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Active Stage</span>
                <span className="text-xs font-extrabold text-indigo-700 font-sans block truncate uppercase tracking-wider">{activeStage}</span>
              </div>

              <div className="space-y-1.5 border-l border-slate-100 pl-4">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Progress Rate</span>
                  <span className="font-mono text-indigo-650 font-extrabold">{completionRate}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/50">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="px-6 pb-4 bg-white border-t border-slate-50 pt-2 flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/50 w-full md:w-auto">
                {[
                  { id: "overview", label: "Overview Hub", icon: Info },
                  { id: "layouts", label: "Sub-Phases", icon: Layers, count: lays.length },
                  { id: "plots", label: "Tracts (Plots)", icon: Compass, count: plts.length },
                  { id: "sales", label: "Sales & Bookings", icon: Percent },
                  { id: "customers", label: "Buyers CRM", icon: Users },
                  { id: "documents", label: "Compliance Vault", icon: FileText, count: projectDocuments.length },
                  { id: "reports", label: "Analytics", icon: BarChart3 },
                  { id: "settings", label: "Registry Config", icon: Settings }
                ].map(tab => {
                  const TabIcon = tab.icon;
                  const isActive = projectWorkspaceTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setProjectWorkspaceTab(tab.id as any)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        isActive ? "bg-white text-indigo-700 shadow-sm border border-slate-200/40" : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                      }`}
                    >
                      <TabIcon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-600 stroke-[2px]" : "text-slate-400"}`} />
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span className={`px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-md ${isActive ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "bg-slate-200/80 text-slate-500"}`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Real-time Alerts Panel */}
      {errorMess && (
        <div className="bg-rose-50 border-l-4 border-l-rose-500 text-rose-900 px-6 py-4 flex items-center gap-3" id="inv-err-banner">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <p className="text-xs font-medium leading-relaxed">{errorMess}</p>
        </div>
      )}
      {successMess && (
        <div className="bg-emerald-50 border-l-4 border-l-emerald-500 text-emerald-900 px-6 py-4 flex items-center gap-3" id="inv-success-banner">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-xs font-medium">{successMess}</p>
        </div>
      )}

      {/* Global Multi-Index Search Bar */}
      {selectedProject === null && activeTab === "projects" && (
        <div className="px-6 py-4 border-b border-slate-100 bg-white/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Global search by Project Code, Layout Code, or Plot Number..."
              value={globalSearch}
              onChange={(e) => { setGlobalSearch(e.target.value); setProjectPage(1); setLayoutPage(1); setPlotPage(1); }}
              className="w-full bg-slate-50/50 border border-slate-200 pl-10 pr-4 py-2 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 tracking-wide outline-none text-slate-800"
            />
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <Activity className="w-3.5 h-3.5" />
            <span>Active Workspace Tenants Guard Validated</span>
          </div>
        </div>
      )}

      {/* Two-Column split Workspace (Main List Ledger & Technical Spec drawer) */}
      {activeTab !== "cad" && activeTab !== "viewer" && activeTab !== "marketplace" && activeTab !== "commercial" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 p-6" id="inv-main-workspace">
        
        {/* LEFT COMPONENT - GRID & ACTIONS LEDGER */}
        <div className="xl:col-span-8 space-y-6">

          {/* ERP Landing Dashboard (visible when no project is selected and tab is dashboard) */}
          {selectedProject === null && activeTab === "dashboard" && (
            <div className="space-y-8 animate-fade-in font-sans" id="landing-dashboard">
              {/* Main Welcome & Project Call-To-Action Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-6 lg:p-8 space-y-6 relative overflow-hidden shadow-md border border-slate-850 antialiased" id="welcome-erp-hub">
                {/* Subtle graphic accent background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.12),transparent_60%)] pointer-events-none" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                
                <div className="space-y-2 relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-slate-200 border border-white/5 text-[9px] font-mono uppercase tracking-wider font-semibold">
                    <Compass className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Real Estate Command Center</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white font-sans">Real Estate Operations Hub</h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                    Coordinate physical land holdings, development zones, plot bookings, and dynamic document compliance in a project-first workspace workflow. Built for senior planning.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2 relative z-10">
                  <button
                    onClick={() => { setActiveTab("projects"); setErrorMess(null); }}
                    className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-950 font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer border-0"
                    id="btn-goto-projects"
                  >
                    <span>Manage Projects</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                  </button>
                  {hasProjManage && (
                    <button
                      onClick={() => { setFormProj({ name: "", code: "", developer_name: "", location: "", status: "PLANNING", rera_number: "", approval_status: "PENDING", approval_authority: "", launch_date: "", possession_target_date: "", approvals_metadata: "{}", project_type: "RESIDENTIAL", state: "", description: "", village: "", taluk: "", district: "", country: "INDIA", pincode: "", latitude: "", longitude: "" }); setCurrModal("create_project"); }}
                      className="inline-flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 hover:bg-slate-800 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
                      id="btn-quick-create-project"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-300 stroke-[3px]" />
                      <span>+ Register New Project</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Four-Column Split Operational Status Count Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="erp-hub-metrics">
                {[
                  { label: "Cataloged Projects", value: lookupProjects.length, sub: "Active", icon: Building2, color: "text-indigo-600 bg-indigo-50/50 border-indigo-100/80" },
                  { label: "Subdivision Layouts", value: lookupLayouts.length, sub: "Phases", icon: Layers, color: "text-emerald-600 bg-emerald-50/50 border-emerald-100/80" },
                  { label: "Development Plots", value: plots.length, sub: "Lots", icon: Grid, color: "text-amber-600 bg-amber-50/50 border-amber-100/80" },
                  { label: "Leads & CRM Contacts", value: projectLeads.length, sub: "Leads", icon: Users, color: "text-sky-600 bg-sky-50/50 border-sky-100/80" }
                ].map((stat, i) => {
                  const IconComp = stat.icon;
                  return (
                    <div key={i} className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group h-24">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        <div className="flex items-baseline gap-1.5">
                          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{stat.value}</p>
                          <p className="text-[11px] font-semibold text-slate-500">{stat.sub}</p>
                        </div>
                      </div>
                      <div className={`p-3 rounded-2xl border ${stat.color} transition-transform group-hover:scale-105 duration-200`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Board */}
              <div className="bg-white border border-slate-200/85 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-extrabold text-slate-850 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-650" />
                    <span>Real-Time Operations &amp; Audit Feed</span>
                  </h3>
                  <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded-md border border-slate-150 font-bold">
                    System Verified
                  </span>
                </div>
                {recentAudits.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                    <Activity className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                    <p className="text-xs text-slate-400 italic">No operations recorded yet in this session.</p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[350px] overflow-y-auto pr-1">
                    {recentAudits.map((log) => {
                      const isCreate = log.action === "PROJECT_CREATE" || log.action === "LAYOUT_CREATE" || log.action === "PLOT_CREATE";
                      const isUpdate = log.action === "PROJECT_UPDATE" || log.action === "LAYOUT_UPDATE" || log.action === "PLOT_UPDATE";
                      const isDoc = log.action === "DOCUMENT_UPLOAD" || log.action === "DOCUMENT_DELETE";
                      
                      const badgeColor = isCreate 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100/50" 
                        : isUpdate 
                        ? "bg-indigo-50 text-indigo-700 border-indigo-100/50" 
                        : isDoc 
                        ? "bg-purple-50 text-purple-700 border-purple-100/50" 
                        : "bg-slate-100 text-slate-700 border-slate-200";

                      return (
                        <div key={log.id} className="flex gap-4 text-xs items-start border-b border-slate-50 last:border-0 py-3 hover:bg-slate-50/40 px-2 rounded-xl transition-colors">
                          <span className={`px-2 py-0.5 font-mono text-[9px] font-bold rounded border shrink-0 uppercase tracking-wide ${badgeColor}`}>
                            {log.action.replace("_", " ")}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 leading-normal truncate">{log.message}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-mono">
                              <span>Target ID: {log.targetId}</span>
                              <span>•</span>
                              <span>{log.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ERP Project Workspace Custom Sub-Tabs Renderers */}
          {selectedProject !== null && (
            <div className="space-y-6">
              {projectWorkspaceTab === "overview" && renderOverviewTab()}
              {projectWorkspaceTab === "sales" && renderSalesTab()}
              {projectWorkspaceTab === "customers" && renderCustomersTab()}
              {projectWorkspaceTab === "documents" && renderDocumentsTab()}
              {projectWorkspaceTab === "reports" && renderReportsTab()}
              {projectWorkspaceTab === "settings" && renderSettingsTab()}
            </div>
          )}

          {/* 1. PROJECTS TABPANEL */}
          {selectedProject === null && activeTab === "projects" && (
            <div className="space-y-6 animate-fade-in" id="projects-view-panel">
              {/* Controls and Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-950 tracking-tight">Projects Master Ledger</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Multi-tenant approved construction projects directory</p>
                </div>
                {hasProjManage && (
                  <button
                    id="btn-new-project"
                    onClick={() => { setEditId(null); setFormProj({ name: "", code: "", developer_name: "", location: "", status: "PLANNING", rera_number: "", approval_status: "PENDING", approval_authority: "", launch_date: "", possession_target_date: "", approvals_metadata: "{}", project_type: "RESIDENTIAL", state: "", description: "", village: "", taluk: "", district: "", country: "INDIA", pincode: "", latitude: "", longitude: "" }); setCurrModal("create_project"); }}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-indigo-750 transition-all shadow-md active:scale-95 cursor-pointer border-0"
                  >
                    <Plus className="w-4 h-4 text-white stroke-[3px]" />
                    <span>+ Register Project</span>
                  </button>
                )}
              </div>

              {/* Filtering Suite */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/50">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">Location Area</label>
                  <select
                    value={filterProjLocation}
                    onChange={(e) => { setFilterProjLocation(e.target.value); setProjectPage(1); }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-colors"
                  >
                    <option value="ALL">All Locations</option>
                    {Array.from(new Set(lookupProjects.map(p => p.location))).filter(Boolean).map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">Approval Status</label>
                  <select
                    value={filterProjAppr}
                    onChange={(e) => { setFilterProjAppr(e.target.value); setProjectPage(1); }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-colors"
                  >
                    <option value="ALL">All Approvals</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">Project Status</label>
                  <select
                    value={filterProjStatus}
                    onChange={(e) => { setFilterProjStatus(e.target.value); setProjectPage(1); }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-colors"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PLANNING">PLANNING</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              {/* Ledger Grid */}
              <div className="overflow-x-auto border border-slate-200/80 rounded-2xl bg-white shadow-sm">
                <table className="w-full text-left text-xs text-slate-500 border-collapse">
                  <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-4">Project Details</th>
                      <th className="px-5 py-4">Code</th>
                      <th className="px-5 py-4">Location</th>
                      <th className="px-5 py-4">RERA Number</th>
                      <th className="px-5 py-4 text-center">Government Approval</th>
                      <th className="px-5 py-4 text-center">Layouts / Plots</th>
                      <th className="px-5 py-4 text-center">Lifecycle Status</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center">
                          <div className="flex flex-col items-center justify-center gap-2.5">
                            <RefreshCw className="w-6 h-6 animate-spin text-indigo-650" />
                            <span className="font-semibold text-xs text-slate-800">Loading cataloged projects...</span>
                            <span className="text-[10px] text-slate-400">Querying database engine records</span>
                          </div>
                        </td>
                      </tr>
                    ) : errorMess && projects.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-rose-600 px-6">
                          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2.5" />
                          <span className="font-bold text-xs block mb-1">Failed to query project database</span>
                          <span className="text-[10px] text-slate-500 max-w-sm mx-auto block leading-relaxed mb-4">{errorMess}</span>
                          <button
                            type="button"
                            onClick={() => fetchProjectsPage()}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-[11px] cursor-pointer inline-flex items-center gap-1 border border-slate-200 transition-colors"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Retry API Request</span>
                          </button>
                        </td>
                      </tr>
                    ) : displayProj.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-slate-400">
                          <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <span className="text-xs">No projects cataloged matching the selected parameters.</span>
                        </td>
                      </tr>
                    ) : (
                      displayProj.map((p) => {
                        const nestedLays = getLayoutsForProject(p.id);
                        const nestedPlts = getPlotsForProject(p.id);
                        const isSelected = selectedProject?.id === p.id;
                        
                        return (
                          <tr
                            key={p.id}
                            className={`hover:bg-slate-50/60 cursor-pointer transition-colors ${isSelected ? "bg-indigo-50/20" : ""}`}
                            onClick={() => setSelectedProject(p)}
                          >
                            <td className="px-5 py-4">
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-900 text-xs sm:text-[13px] hover:text-indigo-650 transition-colors block">
                                  {p.name}
                                </span>
                                <span className="text-[10px] text-slate-400 block font-medium">Developer: {p.developer_name || "Bhoomi Developers"}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className="font-mono font-bold text-xs text-indigo-650 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-md">
                                {p.code}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span className="text-slate-600 font-medium">{p.location}</span>
                            </td>
                            <td className="px-5 py-4">
                              <span className="font-mono text-slate-700 font-semibold">{p.rera_number || "N/A"}</span>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                p.approval_status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                p.approval_status === "REJECTED" ? "bg-rose-50 text-rose-700 border-rose-100" :
                                "bg-amber-50 text-amber-700 border-amber-100"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  p.approval_status === "APPROVED" ? "bg-emerald-500" :
                                  p.approval_status === "REJECTED" ? "bg-rose-500" :
                                  "bg-amber-500"
                                }`} />
                                <span>{p.approval_status}</span>
                              </span>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <div className="flex items-center justify-center gap-2 font-mono text-xs text-slate-600">
                                <span className="font-bold text-slate-800">{nestedLays.length}</span>
                                <span className="text-slate-300">/</span>
                                <span className="font-semibold text-slate-500">{nestedPlts.length}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                p.status === "ACTIVE" ? "bg-emerald-50 text-emerald-800 border-emerald-100" :
                                p.status === "PLANNING" ? "bg-blue-50 text-blue-800 border-blue-100" :
                                "bg-slate-100 text-slate-600 border-slate-200"
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleStartEditProject(p)}
                                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                                  title="Edit properties"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                {p.status === "ARCHIVED" ? (
                                  <button
                                    onClick={() => handleRestoreProject(p.id)}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                    title="Restore Project"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleArchiveProject(p.id, p.status)}
                                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                    title="Archive Project"
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDuplicateProject(p.id)}
                                  className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                                  title="Duplicate Project"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProject(p.id, p.code)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                  title="Delete record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Project pagination controls */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 px-1">
                <span className="text-[11px] text-slate-400">Showing {displayProj.length} of {totalProj} Projects</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setProjectPage(prev => Math.max(1, prev - 1))}
                    disabled={projectPage === 1}
                    className="px-2.5 py-1 text-[11px] font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="text-[11px] font-mono text-slate-500 font-bold">{projectPage} / {totalProjPages}</span>
                  <button
                    onClick={() => setProjectPage(prev => Math.min(totalProjPages, prev + 1))}
                    disabled={projectPage === totalProjPages}
                    className="px-2.5 py-1 text-[11px] font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. LAYOUTS TABPANEL */}
          {(activeTab === "layouts" || (selectedProject !== null && projectWorkspaceTab === "layouts")) && (
            lookupProjects.length === 0 ? (
              <div className="flex-1 p-8 flex items-center justify-center min-h-[50vh]" id="no-projects-for-layouts-fallback">
                <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-md text-center space-y-6">
                  <div className="mx-auto bg-indigo-50 text-indigo-650 w-12 h-12 rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">No Project Available</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Create or select a Project before creating a Layout.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab("projects");
                      setEditId(null);
                      setFormProj({
                        name: "",
                        code: "",
                        developer_name: "",
                        rera_number: "",
                        state: "",
                        district: "",
                        taluk: "",
                        location: "",
                        village: "",
                        pincode: "",
                        latitude: "",
                        longitude: "",
                        description: "",
                        status: "PLANNING",
                        approval_status: "PENDING",
                        approval_authority: "",
                        launch_date: "",
                        possession_target_date: "",
                        project_type: "RESIDENTIAL",
                        approvals_metadata: "{}",
                        country: "IN"
                      });
                      setCurrModal("create_project");
                    }}
                    className="mx-auto bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-sm transition-colors cursor-pointer border-0 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Project</span>
                  </button>
                </div>
              </div>
            ) : selectedLayout !== null ? (
              <LayoutWorkspace
                layout={selectedLayout}
                project={selectedProject || lookupProjects.find(p => p.id === selectedLayout.project_id)}
                plots={plots}
                units={units}
                user={user}
                onClose={() => setSelectedLayout(null)}
                onLaunchStudio={() => {
                  setActiveTab("viewer");
                  dispatchAuditLog("STUDIO_LAUNCH", "layouts", selectedLayout.id, `Launched Map Studio drawing engine for layout: ${selectedLayout.code}`);
                }}
                onStartEditLayout={handleStartEditLayout}
                onArchiveLayout={handleArchiveLayout}
                onDeleteLayout={handleDeleteLayout}
                onUpdateLayoutStatus={async (id, newStatus) => {
                  try {
                    const l = lookupLayouts.find(lay => lay.id === id);
                    if (!l) return;
                    const unpacked = unpackApprovalNumber(l.approval_number || "");
                    const packedStr = packApprovalNumber(
                      unpacked.approval_number,
                      unpacked.survey_number,
                      unpacked.phase,
                      unpacked.description
                    );
                    const payload = {
                      project_id: l.project_id,
                      name: l.name,
                      code: l.code,
                      layout_type: l.layout_type,
                      approval_number: packedStr,
                      approval_date: l.approval_date ? l.approval_date.split("T")[0] : null,
                      total_area_value: l.total_area_value ? Number(l.total_area_value) : null,
                      total_area_unit_id: l.total_area_unit_id,
                      measurement_unit_id: l.measurement_unit_id,
                      status: newStatus
                    };
                    await api.updateLayout(id, payload);
                    displaySuccess(`Layout '${l.name}' status updated to ${newStatus}.`);
                    await loadData();
                    const updatedL = { ...l, status: newStatus };
                    setSelectedLayout(updatedL);
                  } catch (err: any) {
                    setErrorMess(err.message || "Failed to update layout status.");
                  }
                }}
                onAuditLogged={dispatchAuditLog}
              />
            ) : (
              <div className="space-y-4" id="layouts-view-panel">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Layout Plans Catalog</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Sectors, subdivisions and development phases management</p>
                </div>
                {hasLayManage && (
                  <button
                    onClick={() => {
                      setEditId(null);
                      const pId = lookupProjects[0]?.id || "";
                      setFormLay({
                        project_id: pId,
                        name: "",
                        code: "",
                        layout_type: "RESIDENTIAL",
                        approval_number: "",
                        survey_number: "",
                        approval_date: "",
                        total_area_value: "",
                        total_area_unit_id: getDefaultUnitId(pId),
                        measurement_unit_id: getDefaultUnitId(pId),
                        status: "DRAFT",
                        phase: "",
                        description: ""
                      });
                      setCurrModal("create_layout");
                    }}
                    className="inline-flex items-center gap-1 bg-indigo-650 text-white font-semibold text-xs px-3 py-2 rounded-xl hover:bg-indigo-750 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Layout</span>
                  </button>
                )}
              </div>

              {layouts.length === 0 || lookupLayouts.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 max-w-xl mx-auto shadow-sm space-y-6 text-center my-8" id="layouts-guided-onboarding-card">
                  <div className="mx-auto bg-indigo-50 text-indigo-650 w-16 h-16 rounded-full flex items-center justify-center shadow-xs">
                    <Layers className="w-8 h-8 text-indigo-650" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">No Layouts Created Yet</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      A Layout represents a subdivision or development phase inside a Project.
                      Before importing PDF, Images or DXF drawings, the Project must contain at least one Layout.
                    </p>
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-xl p-4 max-w-sm mx-auto text-left space-y-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Example layout phases:</span>
                    <ul className="space-y-1.5 text-xs text-slate-600 font-semibold pl-1">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span>Phase 1 Residential</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span>Phase 2 Villas</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span>Commercial Zone</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setEditId(null);
                      const pId = lookupProjects[0]?.id || "";
                      setFormLay({
                        project_id: pId,
                        name: "",
                        code: "",
                        layout_type: "RESIDENTIAL",
                        approval_number: "",
                        survey_number: "",
                        approval_date: "",
                        total_area_value: "",
                        total_area_unit_id: getDefaultUnitId(pId),
                        measurement_unit_id: getDefaultUnitId(pId),
                        status: "DRAFT",
                        phase: "",
                        description: ""
                      });
                      setCurrModal("create_layout");
                    }}
                    className="mx-auto bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs py-3 px-6 rounded-xl shadow-md transition-all cursor-pointer border-0 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create First Layout</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Filtering suite */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Project filter</label>
                  <select
                    disabled={selectedProject !== null}
                    value={filterLayProject}
                    onChange={(e) => { setFilterLayProject(e.target.value); setLayoutPage(1); }}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="ALL">All Projects</option>
                    {lookupProjects.map(p => (
                      <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Layout subdivision Type</label>
                  <select
                    value={filterLayType}
                    onChange={(e) => { setFilterLayType(e.target.value); setLayoutPage(1); }}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All Types</option>
                    <option value="RESIDENTIAL">RESIDENTIAL</option>
                    <option value="COMMERCIAL">COMMERCIAL</option>
                    <option value="MIXED_USE">MIXED USE</option>
                    <option value="INDUSTRIAL">INDUSTRIAL</option>
                    <option value="FARM_LAND">FARM LAND</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
                  <select
                    value={filterLayStatus}
                    onChange={(e) => { setFilterLayStatus(e.target.value); setLayoutPage(1); }}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="LAUNCHED">LAUNCHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

               {/* Layout Ledger Data Grid */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
                <table className="w-full text-left text-xs text-slate-500">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Layout Name</th>
                      <th className="px-4 py-3">Project</th>
                      <th className="px-4 py-3 text-right">Total Area</th>
                      <th className="px-4 py-3 text-center">Unit</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Created Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {loading ? (
                      Array.from({ length: 4 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse bg-white">
                          <td className="px-4 py-4">
                            <div className="h-3.5 bg-slate-200 rounded-sm w-3/4 mb-1"></div>
                            <div className="h-2.5 bg-slate-150 rounded-sm w-1/2"></div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="h-3 bg-slate-200 rounded-sm w-2/3"></div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="h-3.5 bg-slate-200 rounded-sm w-1/3 ml-auto"></div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="h-3 bg-slate-200 rounded-sm w-1/4 mx-auto"></div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="h-4 bg-slate-200 rounded-full w-12 mx-auto"></div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="h-3 bg-slate-200 rounded-sm w-1/3 mx-auto"></div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="h-3 bg-slate-200 rounded-sm w-1/4 ml-auto"></div>
                          </td>
                        </tr>
                      ))
                    ) : errorMess && displayLay.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-rose-500">
                          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                          <span className="font-bold text-xs block mb-1">Query failure retrieving layout plans</span>
                          <span className="text-[10px] text-slate-500 max-w-sm mx-auto block leading-normal px-4 mb-3">{errorMess}</span>
                          <button
                            onClick={() => loadData()}
                            className="inline-flex items-center gap-1 text-[10px] bg-slate-100 border border-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Retry Query</span>
                          </button>
                        </td>
                      </tr>
                    ) : displayLay.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <span>No layouts cataloged matching search filters.</span>
                        </td>
                      </tr>
                    ) : (
                      displayLay.map((l) => {
                        return (
                          <tr
                            key={l.id}
                            className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${selectedLayout?.id === l.id ? "bg-indigo-50/20 shadow-xs border-l-2 border-indigo-600" : ""}`}
                            onClick={() => setSelectedLayout(l)}
                          >
                            <td className="px-4 py-3.5">
                              <p className="font-semibold text-slate-900">{l.name}</p>
                              <p className="text-[9px] font-mono font-bold text-indigo-600/80 mt-0.5">{l.code} &bull; {l.layout_type}</p>
                            </td>
                            <td className="px-4 py-3.5 text-slate-700 font-semibold text-[11px]">
                              {l.project_name || l.project?.name || "N/A"}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-800">
                              {l.total_area_value ? Number(l.total_area_value).toLocaleString() : "N/A"}
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono font-medium">{getUnitCode(l.measurement_unit_id)}</td>
                            <td className="px-4 py-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                l.status === "LAUNCHED" ? "bg-emerald-50 text-emerald-800 border-emerald-100" :
                                l.status === "APPROVED" ? "bg-blue-50 text-blue-800 border-blue-100" :
                                "bg-slate-100 text-slate-600 border-slate-200"
                              }`}>
                                {l.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono text-slate-500 font-semibold text-[11px]">
                              {l.created_at ? new Date(l.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) : "N/A"}
                            </td>
                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => { setSelectedLayout(l); setActiveTab("viewer"); }}
                                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                  title="View Interactive Layout Map"
                                >
                                  <Compass className="w-3.5 h-3.5 text-rose-500 hover:scale-110 transition-transform" />
                                </button>
                                <button
                                  onClick={() => { setSelectedLayout(l); setActiveTab("cad"); }}
                                  className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                  title="Import CAD Blueprint"
                                >
                                  <FileCode2 className="w-3.5 h-3.5 text-indigo-600 hover:scale-110 transition-transform" />
                                </button>
                                <button
                                  onClick={() => handleStartEditLayout(l)}
                                  className="p-1 text-slate-400 hover:text-slate-900 transition-colors"
                                  title="Edit layout details"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                {l.status === "ARCHIVED" ? (
                                  <button
                                    onClick={() => handleRestoreLayout(l.id)}
                                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                    title="Restore Layout"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleArchiveLayout(l.id, l.status)}
                                    className="p-1 text-slate-400 hover:text-amber-600 transition-colors"
                                    title="Archive Layout"
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDuplicateLayout(l.id)}
                                  className="p-1 text-slate-400 hover:text-teal-600 transition-colors"
                                  title="Duplicate Layout"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLayout(l.id, l.code)}
                                  className="p-1 text-slate-400 hover:text-rose-650 transition-colors"
                                  title="Purge layout blueprint"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Layouts pager */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 px-1">
                <span className="text-[11px] text-slate-400">Showing {displayLay.length} of {totalLay} Layouts</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setLayoutPage(prev => Math.max(1, prev - 1))}
                    disabled={layoutPage === 1}
                    className="px-2.5 py-1 text-[11px] font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="text-[11px] font-mono text-slate-500 font-bold">{layoutPage} / {totalLayPages}</span>
                  <button
                    onClick={() => setLayoutPage(prev => Math.min(totalLayPages, prev + 1))}
                    disabled={layoutPage === totalLayPages}
                    className="px-2.5 py-1 text-[11px] font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
            )
          )}

          {/* 3. PLOTS TABPANEL */}
          {(activeTab === "plots" || (selectedProject !== null && projectWorkspaceTab === "plots")) && (
            plots.length === 0 ? (
              <div className="flex-1 p-8 flex items-center justify-center min-h-[50vh]" id="no-plot-geometry-fallback">
                <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-md text-center space-y-6">
                  <div className="mx-auto bg-indigo-50 text-indigo-650 w-12 h-12 rounded-full flex items-center justify-center">
                    <Grid className="w-6 h-6 animate-pulse text-indigo-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">No Plot Geometry Available</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Prepare the Layout in Interactive Map before managing Plot inventory.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab("viewer");
                    }}
                    className="mx-auto bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-sm transition-colors cursor-pointer border-0 flex items-center justify-center gap-1.5"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Open Interactive Map</span>
                  </button>
                </div>
              </div>
            ) : (
            <div className="space-y-4" id="plots-view-panel">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Land Parcels (Plots) Inventory</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Physical plots, custom extensible attributes, and high-throughput bulk wizards</p>
                </div>
                {hasPlotManage && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrModal("bulk_create_plots")}
                      className="inline-flex items-center gap-1 bg-slate-900 text-white font-semibold text-xs px-2.5 py-2 rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Bulk Create</span>
                    </button>
                    <button
                      onClick={() => { setEditId(null); setFormPlot(prev => ({ ...prev, plot_number: "", area_value: "", length: "", width: "", road_width: "", corner_plot: false, dimensions: "", status: "AVAILABLE", plc: "", remarks: "", latitude: "", longitude: "", polygon_ref: "" })); setCurrModal("create_plot"); }}
                      className="inline-flex items-center gap-1 bg-indigo-650 text-white font-semibold text-xs px-3 py-2 rounded-xl hover:bg-indigo-750 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Single Plot</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Spreadsheet / Card Mode View Switcher and CSV Exporter Toolbar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-xs" id="plots-toolbar-actions">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Workspace View:</span>
                  <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                    <button
                      onClick={() => setPlotDisplayMode("spreadsheet")}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                        plotDisplayMode === "spreadsheet"
                          ? "bg-white text-indigo-750 shadow-xs border border-slate-200/50"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                      id="view-spreadsheet-btn"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>Spreadsheet View</span>
                    </button>
                    <button
                      onClick={() => setPlotDisplayMode("card")}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                        plotDisplayMode === "card"
                          ? "bg-white text-indigo-750 shadow-xs border border-slate-200/50"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                      id="view-card-btn"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Card View</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleExportPlotsToCsv}
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                  id="export-plots-btn"
                >
                  <Download className="w-3.5 h-3.5 text-slate-550" />
                  <span>Export to CSV</span>
                </button>
              </div>

              {/* Bulk operations floating/inline command overlay */}
              {selectedPlotIds.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3.5 text-xs text-indigo-950 font-bold">
                  <span className="flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-indigo-700" />
                    <span>{selectedPlotIds.length} Plots Selected for Batch Operations</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrModal("bulk_status_plots")}
                      className="bg-indigo-700 hover:bg-indigo-800 text-white text-[11px] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Status update
                    </button>
                    <button
                      onClick={() => setCurrModal("bulk_update_plots")}
                      className="bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-[11px] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Bulk Modify Dimension
                    </button>
                    {selectedPlotIds.length >= 2 && (
                      <button
                        onClick={() => {
                          const selectedPlots = plots.filter(p => selectedPlotIds.includes(p.id));
                          const sumArea = selectedPlots.reduce((acc, curr) => acc + Number(curr.area_value), 0);
                          const joinedNums = selectedPlots.map(p => p.plot_number).join("+");
                          const samplePlot = selectedPlots[0];
                          
                          setMergePlotTarget({
                            sourcePlotIds: selectedPlotIds,
                            layoutId: samplePlot.layout_id,
                            newPlotNumber: `M_${joinedNums.slice(0, 25)}`,
                            newAreaValue: Number(sumArea.toFixed(2)),
                            unitId: samplePlot.measurement_unit_id,
                            facing: samplePlot.facing || "NORTH"
                          });
                          setCurrModal("merge_plots");
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Merge Selection
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedPlotIds([])}
                      className="text-slate-500 hover:text-slate-900 font-medium text-[11px]"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Advanced Multivariant Filtering System */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Interactive Filtering Parameters</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Layout subdivision</label>
                    <select
                      value={filterPlotLayoutId}
                      onChange={(e) => { setFilterPlotLayoutId(e.target.value); setPlotPage(1); }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none"
                    >
                      <option value="ALL">All Layouts</option>
                      {lookupLayouts
                        .filter(l => selectedProject === null || String(l.project_id) === String(selectedProject.id))
                        .map(l => (
                          <option key={l.id} value={l.id}>[{l.code}] {l.name}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Plot status</label>
                    <select
                      value={filterPlotStatus}
                      onChange={(e) => { setFilterPlotStatus(e.target.value); setPlotPage(1); }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="RESERVED">RESERVED</option>
                      <option value="BOOKED">BOOKED</option>
                      <option value="SOLD">SOLD</option>
                      <option value="BLOCKED">BLOCKED</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Facing</label>
                    <select
                      value={filterPlotFacing}
                      onChange={(e) => { setFilterPlotFacing(e.target.value); setPlotPage(1); }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none"
                    >
                      <option value="ALL">All Facings</option>
                      <option value="NORTH">NORTH</option>
                      <option value="SOUTH">SOUTH</option>
                      <option value="EAST">EAST</option>
                      <option value="WEST">WEST</option>
                      <option value="NORTHEAST">NORTHEAST</option>
                      <option value="NORTHWEST">NORTHWEST</option>
                      <option value="SOUTHEAST">SOUTHEAST</option>
                      <option value="SOUTHWEST">SOUTHWEST</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Corner Plot</label>
                    <select
                      value={filterPlotCorner}
                      onChange={(e) => { setFilterPlotCorner(e.target.value); setPlotPage(1); }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none"
                    >
                      <option value="ALL">All Plots</option>
                      <option value="YES">Only Corner Plots</option>
                      <option value="NO">Standard Plots</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Min Road Width</label>
                    <input
                      type="number"
                      placeholder="e.g. 30"
                      value={filterPlotRoadWidth}
                      onChange={(e) => { setFilterPlotRoadWidth(e.target.value); setPlotPage(1); }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 border-t border-slate-200/50 pt-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Plot Area Metric Range:</span>
                    <input
                      type="number"
                      placeholder="Min Area"
                      value={filterPlotMinArea}
                      onChange={(e) => { setFilterPlotMinArea(e.target.value); setPlotPage(1); }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-300">to</span>
                    <input
                      type="number"
                      placeholder="Max Area"
                      value={filterPlotMaxArea}
                      onChange={(e) => { setFilterPlotMaxArea(e.target.value); setPlotPage(1); }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Plot Grid Workspace - Card View or Spreadsheet View Conditional Render */}
              {plotDisplayMode === "spreadsheet" ? (
                /* Data Table List of Plots */
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
                  <table className="w-full text-left text-xs text-slate-500 border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-center w-10">
                          <button
                            onClick={selectAllFilteredPlots}
                            className="text-slate-400 hover:text-slate-900 focus:outline-none"
                          >
                            {selectedPlotIds.length === plots.length && plots.length > 0 ? (
                              <CheckSquare className="w-3.5 h-3.5 text-indigo-650" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-300" />
                            )}
                          </button>
                        </th>
                        <th className="px-4 py-3">Plot Number</th>
                        <th className="px-4 py-3 text-right">Area</th>
                        <th className="px-3 py-3 text-center">Unit</th>
                        <th className="px-4 py-3">Facing</th>
                        <th className="px-4 py-3 text-right">Road Width</th>
                        <th className="px-4 py-3 text-center">Corner Plot</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {displayPlt.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400">
                            <Compass className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <span>No plots match current filtering logic.</span>
                          </td>
                        </tr>
                      ) : (
                        displayPlt.map((pl) => {
                          const isChecked = selectedPlotIds.includes(pl.id);
                          return (
                            <tr
                              key={pl.id}
                              className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${selectedPlot?.id === pl.id ? "bg-slate-55/70" : ""}`}
                              onClick={() => setSelectedPlot(pl)}
                            >
                              <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => togglePlotRowSelect(pl.id)}
                                  className="text-slate-400 hover:text-slate-900 focus:outline-none"
                                >
                                  {isChecked ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-indigo-650" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5 text-slate-300" />
                                  )}
                                </button>
                              </td>
                              <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                                <p>{pl.plot_number}</p>
                                <p className="text-[9px] text-slate-400 font-normal">Layout: {pl.layout_name || pl.layout?.name || "N/A"}</p>
                                {(() => {
                                  const meta = tryParseJSON(pl.dimensions_metadata, {});
                                  const attrs = Object.entries(meta.plot_attributes || {})
                                    .filter(([_, val]) => val === true || val === "true" || val === 1);
                                  if (attrs.length === 0) return null;
                                  return (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {attrs.map(([key]) => (
                                        <span key={key} className="inline-block px-1 py-[2px] bg-slate-100 border border-slate-200 rounded text-[7.5px] text-slate-600 font-sans tracking-wide font-normal">
                                          ✨ {key}
                                        </span>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-800">
                                {Number(pl.area_value).toFixed(2)}
                              </td>
                              <td className="px-3 py-3.5 text-center font-mono text-[10px] text-slate-500 font-semibold">{getUnitCode(pl.measurement_unit_id)}</td>
                              <td className="px-4 py-3.5 text-indigo-700 font-semibold text-[10.5px] uppercase tracking-wide">{pl.facing}</td>
                              <td className="px-4 py-3.5 text-right font-mono font-medium text-slate-600">{Number(pl.road_width || 0).toFixed(1)} m</td>
                              <td className="px-4 py-3.5 text-center">
                                {pl.corner_plot ? (
                                  <span className="px-2 py-0.5 rounded bg-cyan-50 border border-cyan-150 text-cyan-700 font-bold text-[9px] uppercase tracking-wide">🎯 Corner</span>
                                ) : (
                                  <span className="text-[10px] text-slate-350">Standard</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide border block text-center ${
                                  pl.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-800 border-emerald-100" :
                                  pl.status === "RESERVED" ? "bg-amber-50 text-amber-800 border-amber-100" :
                                  pl.status === "BOOKED" ? "bg-blue-50 text-blue-800 border-blue-100" :
                                  pl.status === "SOLD" ? "bg-slate-900 text-slate-100 border-slate-850" :
                                  "bg-rose-50 text-rose-800 border-rose-100" // BLOCKED
                                }`}>
                                  {pl.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => handleStartEditPlot(pl)}
                                    className="p-1 text-slate-400 hover:text-slate-900"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePlot(pl.id, pl.plot_number)}
                                    className="p-1 text-slate-400 hover:text-rose-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Card View Mode Workspace */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="plots-card-workspace">
                  {displayPlt.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
                      <Compass className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <span>No plots match current filtering logic.</span>
                    </div>
                  ) : (
                    displayPlt.map((pl) => {
                      const isChecked = selectedPlotIds.includes(pl.id);
                      return (
                        <div
                          key={pl.id}
                          onClick={() => setSelectedPlot(pl)}
                          className={`relative border rounded-xl p-4 transition-all duration-200 cursor-pointer bg-white shadow-xs flex flex-col justify-between ${
                            selectedPlot?.id === pl.id
                              ? "border-indigo-650 ring-2 ring-indigo-500/10 bg-indigo-50/10"
                              : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                          }`}
                        >
                          {/* Card Top: Checkbox and Status Badge */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => togglePlotRowSelect(pl.id)}
                                className="text-slate-400 hover:text-slate-900 focus:outline-none"
                              >
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-indigo-650" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300" />
                                )}
                              </button>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SELECT</span>
                            </div>

                            <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold tracking-wide border ${
                              pl.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-800 border-emerald-100" :
                              pl.status === "RESERVED" ? "bg-amber-50 text-amber-800 border-amber-100" :
                              pl.status === "BOOKED" ? "bg-blue-50 text-blue-800 border-blue-100" :
                              pl.status === "SOLD" ? "bg-slate-900 text-slate-100 border-slate-850" :
                              "bg-rose-50 text-rose-800 border-rose-100" // BLOCKED
                            }`}>
                              {pl.status}
                            </span>
                          </div>

                          {/* Card Mid: Plot Number and Layout Info */}
                          <div className="mb-4">
                            <h4 className="text-sm font-black text-slate-900">Plot #{pl.plot_number}</h4>
                            <p className="text-[10px] text-slate-400 font-medium">Layout: {pl.layout_name || pl.layout?.name || "N/A"}</p>
                            
                            {/* Extensible custom attributes */}
                            {(() => {
                              const meta = tryParseJSON(pl.dimensions_metadata, {});
                              const attrs = Object.entries(meta.plot_attributes || {})
                                .filter(([_, val]) => val === true || val === "true" || val === 1);
                              if (attrs.length === 0) return null;
                              return (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {attrs.map(([key]) => (
                                    <span key={key} className="inline-block px-1 py-[2px] bg-slate-100 border border-slate-200 rounded text-[7.5px] text-slate-600 font-sans tracking-wide">
                                      ✨ {key}
                                    </span>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Card Bottom Grid: Specs */}
                          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-[10px] text-slate-500 font-medium">
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Area</span>
                              <span className="font-mono text-slate-800 font-bold">{Number(pl.area_value).toFixed(2)} {getUnitCode(pl.measurement_unit_id)}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Facing</span>
                              <span className="text-indigo-700 font-bold uppercase">{pl.facing}</span>
                            </div>
                            <div className="flex flex-col mt-1">
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Road Width</span>
                              <span className="font-mono text-slate-800 font-bold">{Number(pl.road_width || 0).toFixed(1)} m</span>
                            </div>
                            <div className="flex flex-col mt-1">
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Corner Plot</span>
                              <span>
                                {pl.corner_plot ? (
                                  <span className="px-1.5 py-0.2 bg-cyan-50 border border-cyan-150 text-cyan-700 font-bold text-[8px] uppercase tracking-wider rounded">🎯 YES</span>
                                ) : (
                                  <span className="text-slate-400">NO</span>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Quick inline action controls for manage-access */}
                          {hasPlotManage && (
                            <div className="flex justify-end gap-1.5 mt-3 border-t border-slate-150/45 pt-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleStartEditPlot(pl)}
                                className="inline-flex items-center gap-1 text-[10px] text-indigo-650 hover:text-indigo-850 font-bold"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeletePlot(pl.id, pl.plot_number)}
                                className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-600 font-bold ml-2"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Plots paginate controls */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 px-1">
                <span className="text-[11px] text-slate-400">Showing {displayPlt.length} of {totalPlot} plots directory</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPlotPage(prev => Math.max(1, prev - 1))}
                    disabled={plotPage === 1}
                    className="px-2.5 py-1 text-[11px] font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="text-[11px] font-mono text-slate-500 font-bold">{plotPage} / {totalPlotPages}</span>
                  <button
                    onClick={() => setPlotPage(prev => Math.min(totalPlotPages, prev + 1))}
                    disabled={plotPage === totalPlotPages}
                    className="px-2.5 py-1 text-[11px] font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          ))}

        </div>

        {/* RIGHT COMPONENT - SPECIFICATION DRAWER INSPECTOR */}
        <div className="xl:col-span-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 shadow-xs space-y-5" id="inv-specs-inspector">
          
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
            <Info className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Dynamic Technical Inspector</h4>
          </div>

          {/* PROJECT DETAIL SCREEN */}
          {selectedProject && !selectedLayout && !selectedPlot ? (
            (() => {
              const meta = tryParseJSON(selectedProject.approvals_metadata, {});
              const village = meta.village || "N/A";
              const taluk = meta.taluk || "N/A";
              const district = meta.district || "N/A";
              const country = meta.country || "INDIA";
              const pincode = meta.pincode || "N/A";
              const latitude = meta.latitude || "N/A";
              const longitude = meta.longitude || "N/A";
              const projectDesc = meta.description || selectedProject.description || "No description provided.";
              const formattedCreated = selectedProject.created_at 
                ? new Date(selectedProject.created_at).toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                : "N/A";
              const formattedUpdated = selectedProject.updated_at 
                ? new Date(selectedProject.updated_at).toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                : "N/A";

              return (
                <div className="space-y-3.5" id="project-inspector">
                  <div className="flex justify-between items-start pb-2 border-b border-slate-150">
                    <div>
                      <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase">{selectedProject.code}</span>
                      <h3 className="text-sm font-extrabold text-slate-900 mt-1">{selectedProject.name}</h3>
                    </div>
                    <button onClick={() => setSelectedProject(null)} className="text-[10px] font-bold text-indigo-650 hover:underline">Clear</button>
                  </div>

                  {/* 1. Project Profile Section */}
                  <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden shadow-3xs">
                    <button 
                      onClick={() => setCollapsedSections(prev => ({ ...prev, project: !prev.project }))}
                      className="w-full flex justify-between items-center px-4 py-3 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left border-0"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Project Profile</span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${collapsedSections.project ? "rotate-180" : ""}`} />
                    </button>
                    {!collapsedSections.project && (
                      <div className="p-4 border-t border-slate-100 text-xs space-y-2 text-slate-600">
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="font-medium text-slate-400">Developer Partner:</span>
                          <span className="font-bold text-slate-800">{selectedProject.developer_name || "Bhoomi Developers"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="font-medium text-slate-400">Project Type:</span>
                          <span className="font-bold text-indigo-700 uppercase">{selectedProject.project_type || "RESIDENTIAL"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="font-medium text-slate-400">Active Status:</span>
                          <span className="font-bold text-slate-800">{selectedProject.status}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="font-medium text-slate-400">Date Created:</span>
                          <span className="font-mono text-slate-550">{formattedCreated}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="font-medium text-slate-400">Last Modified:</span>
                          <span className="font-mono text-slate-550">{formattedUpdated}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Location Context Section */}
                  <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden shadow-3xs">
                    <button 
                      onClick={() => setCollapsedSections(prev => ({ ...prev, location: !prev.location }))}
                      className="w-full flex justify-between items-center px-4 py-3 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left border-0"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Location Context</span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${collapsedSections.location ? "rotate-180" : ""}`} />
                    </button>
                    {!collapsedSections.location && (
                      <div className="p-4 border-t border-slate-100 text-xs space-y-2 text-slate-600">
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="font-medium text-slate-400">Village limits:</span>
                          <span className="font-bold text-slate-800">{village}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="font-medium text-slate-400">Taluk:</span>
                          <span className="font-bold text-slate-800">{taluk}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="font-medium text-slate-400">District:</span>
                          <span className="font-bold text-slate-800">{district}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="font-medium text-slate-400">Country:</span>
                          <span className="font-bold text-slate-800">{country}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="font-medium text-slate-400">PIN / ZIP Code:</span>
                          <span className="font-mono font-bold text-slate-800">{pincode}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Regulatory Approvals Section */}
                  <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden shadow-3xs">
                    <button 
                      onClick={() => setCollapsedSections(prev => ({ ...prev, approvals: !prev.approvals }))}
                      className="w-full flex justify-between items-center px-4 py-3 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left border-0"
                    >
                      <div className="flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Approvals &amp; Compliance</span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${collapsedSections.approvals ? "rotate-180" : ""}`} />
                    </button>
                    {!collapsedSections.approvals && (
                      <div className="p-4 border-t border-slate-100 text-xs space-y-2 text-slate-600">
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="font-medium text-slate-400">RERA License:</span>
                          <span className="font-mono font-bold text-indigo-750">{selectedProject.rera_number || "PENDING"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="font-medium text-slate-400">Compliance State:</span>
                          <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold border inline-block ${
                            selectedProject.approval_status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            selectedProject.approval_status === "REJECTED" ? "bg-rose-50 text-rose-700 border-rose-100" :
                            "bg-amber-50 text-amber-700 border-amber-100"
                          }`}>{selectedProject.approval_status}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="font-medium text-slate-400">Authority:</span>
                          <span className="font-bold text-slate-800">{selectedProject.approval_authority || "RERA / DTCP"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="font-medium text-slate-400">Launch Date:</span>
                          <span className="font-bold text-slate-800">{selectedProject.launch_date ? selectedProject.launch_date.split("T")[0] : "N/A"}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="font-medium text-slate-400">Possession Limit:</span>
                          <span className="font-bold text-slate-800">{selectedProject.possession_target_date ? selectedProject.possession_target_date.split("T")[0] : "N/A"}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. Statistics Section */}
                  <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden shadow-3xs">
                    <button 
                      onClick={() => setCollapsedSections(prev => ({ ...prev, statistics: !prev.statistics }))}
                      className="w-full flex justify-between items-center px-4 py-3 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left border-0"
                    >
                      <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Subdivision Statistics</span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${collapsedSections.statistics ? "rotate-180" : ""}`} />
                    </button>
                    {!collapsedSections.statistics && (
                      <div className="p-4 border-t border-slate-100 text-xs space-y-3 text-slate-600">
                        <div>
                          <p className="font-bold text-[9px] text-slate-400 uppercase tracking-wider block mb-1.5">Registered Phase Subdivisions:</p>
                          <div className="space-y-1.5 max-h-32 overflow-y-auto">
                            {getLayoutsForProject(selectedProject.id).length === 0 ? (
                              <p className="text-[10px] text-slate-400 text-center py-1">No phases attached.</p>
                            ) : (
                              getLayoutsForProject(selectedProject.id).map(l => (
                                <div 
                                  key={l.id} 
                                  onClick={() => {
                                    setSelectedLayout(l);
                                    setFilterLayProject(selectedProject.id);
                                    setActiveTab("layouts");
                                  }}
                                  className="bg-slate-50 p-2 rounded-lg border border-slate-150 text-[10px] flex justify-between items-center hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-colors"
                                >
                                  <span className="font-bold text-slate-850">[{l.code}] {l.name}</span>
                                  <span className="text-indigo-600 font-mono font-bold">{getPlotsForLayout(l.id).length} plots</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center pt-2 font-mono text-[10px]">
                          <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2 rounded-lg">
                            <p className="font-extrabold text-xs">{getPlotsForProject(selectedProject.id).filter(p => p.status === "AVAILABLE").length}</p>
                            <p className="text-[8px] uppercase font-sans font-semibold mt-0.5">Available Lots</p>
                          </div>
                          <div className="bg-amber-50 text-amber-800 border border-amber-100 p-2 rounded-lg">
                            <p className="font-extrabold text-xs">{getPlotsForProject(selectedProject.id).filter(p => p.status === "RESERVED").length}</p>
                            <p className="text-[8px] uppercase font-sans font-semibold mt-0.5">Reserved Lots</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setFilterLayProject(selectedProject.id);
                            setActiveTab("layouts");
                          }}
                          className="w-full mt-1 inline-flex items-center justify-center gap-1.5 bg-indigo-50 border border-indigo-150 text-indigo-700 font-bold text-[10px] py-2 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Layout Workspace Dashboard</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 5. Coordinates Section */}
                  <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden shadow-3xs">
                    <button 
                      onClick={() => setCollapsedSections(prev => ({ ...prev, coordinates: !prev.coordinates }))}
                      className="w-full flex justify-between items-center px-4 py-3 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left border-0"
                    >
                      <div className="flex items-center gap-2">
                        <Compass className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Spatial GPS Coordinates</span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${collapsedSections.coordinates ? "rotate-180" : ""}`} />
                    </button>
                    {!collapsedSections.coordinates && (
                      <div className="p-4 border-t border-slate-100 text-xs space-y-2 text-slate-600">
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="font-medium text-slate-400">Latitude coordinate:</span>
                          <span className="font-mono font-bold text-indigo-650">{latitude}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="font-medium text-slate-400">Longitude coordinate:</span>
                          <span className="font-mono font-bold text-indigo-650">{longitude}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 6. Description Section */}
                  <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden shadow-3xs">
                    <button 
                      onClick={() => setCollapsedSections(prev => ({ ...prev, description: !prev.description }))}
                      className="w-full flex justify-between items-center px-4 py-3 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left border-0"
                    >
                      <div className="flex items-center gap-2">
                        <AlignLeft className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Registry Notes</span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${collapsedSections.description ? "rotate-180" : ""}`} />
                    </button>
                    {!collapsedSections.description && (
                      <div className="p-4 border-t border-slate-100 text-xs text-slate-600">
                        <p className="text-[11px] leading-relaxed italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">{projectDesc}</p>
                      </div>
                    )}
                  </div>

                </div>
              );
            })()
          ) : selectedLayout && !selectedPlot ? (
            (() => {
              // Unpack approval and survey metadata safely using helper
              const unpacked = unpackApprovalNumber(selectedLayout.approval_number);
              const approvalNumberOnly = unpacked.approval_number || "N/A";
              const surveyNumberOnly = unpacked.survey_number || selectedLayout.survey_number || "N/A";
              const phaseOnly = unpacked.phase || "N/A";
              const layoutDescription = unpacked.description || "N/A";

              const formattedCreated = selectedLayout.created_at 
                ? new Date(selectedLayout.created_at).toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                : "N/A";
              const formattedUpdated = selectedLayout.updated_at 
                ? new Date(selectedLayout.updated_at).toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                : "N/A";

              return (
                <div className="space-y-4" id="layout-inspector">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-amber-50 border border-amber-150 text-amber-800 font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase">{selectedLayout.layout_type}</span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedLayout.name}</h3>
                    </div>
                    <button onClick={() => setSelectedLayout(null)} className="text-[10px] text-indigo-600 hover:underline">Clear</button>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-3.5 text-xs">
                    <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Layout Information</p>
                    <div className="space-y-2 text-[11px]">
                      <p className="flex justify-between"><span>Phase Code:</span> <span className="font-mono font-bold text-slate-900">{selectedLayout.code}</span></p>
                      <p className="flex justify-between"><span>Parent Project:</span> <span className="font-semibold text-slate-800">{selectedLayout.project_name || selectedLayout.project?.name || "N/A"}</span></p>
                      <p className="flex justify-between"><span>Survey Numbers:</span> <span className="font-mono font-bold text-indigo-600 bg-indigo-50/50 px-1.5 py-0.2 rounded">{surveyNumberOnly}</span></p>
                      <p className="flex justify-between"><span>Development Phase:</span> <span className="font-semibold text-slate-800">{phaseOnly}</span></p>
                      <p className="flex justify-between"><span>Lifecycle State:</span> <span className="font-bold font-mono text-indigo-700">{selectedLayout.status}</span></p>
                    </div>

                    <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 pt-1">Description</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed italic bg-slate-50 p-2 rounded-lg border border-slate-100">{layoutDescription}</p>

                    <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 pt-1 ml-0">Area Information</p>
                    <div className="space-y-1.5 text-[11px]">
                      <p className="flex justify-between"><span>Total Area:</span> <span className="font-mono font-bold text-slate-950">{selectedLayout.total_area_value ? Number(selectedLayout.total_area_value).toLocaleString() : "UNDEFINED"} {getUnitCode(selectedLayout.measurement_unit_id)}</span></p>
                      <p className="flex justify-between"><span>Standard unit:</span> <span className="font-medium text-slate-800 font-mono">{getUnitCode(selectedLayout.measurement_unit_id)}</span></p>
                    </div>

                    <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 pt-1">Approval Metadata</p>
                    <div className="space-y-1.5 text-[11px]">
                      <p className="flex justify-between"><span>Approval reference:</span> <span className="font-mono font-semibold text-slate-800">{approvalNumberOnly || "REQUIRING REGISTRATION"}</span></p>
                      <p className="flex justify-between"><span>Approval date:</span> <span className="font-semibold text-slate-800">{selectedLayout.approval_date ? selectedLayout.approval_date.split("T")[0] : "N/A"}</span></p>
                    </div>

                    <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 pt-1">Chronology</p>
                    <div className="space-y-1.5 text-[11px]">
                      <p className="flex justify-between"><span>Created Date:</span> <span className="font-mono font-medium text-slate-600">{formattedCreated}</span></p>
                      <p className="flex justify-between"><span>Updated Date:</span> <span className="font-mono font-medium text-slate-600">{formattedUpdated}</span></p>
                    </div>

                    <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 pt-1">Zoned Plots directory</p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto font-mono text-[10px]">
                      {getPlotsForLayout(selectedLayout.id).length === 0 ? (
                        <p className="text-slate-400 text-center font-sans">No zoned plots listed.</p>
                      ) : (
                        getPlotsForLayout(selectedLayout.id).map(p => (
                          <div key={p.id} className="flex justify-between items-center p-1 border-b border-slate-100">
                            <span>{p.plot_number}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-sans font-bold uppercase ${p.status === "AVAILABLE" ? "text-emerald-700 bg-emerald-50" : "text-slate-600 bg-slate-50"}`}>{p.status}</span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                      <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Spatial Mapping Actions</p>
                      <button
                        onClick={() => {
                          setActiveTab("viewer");
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 border border-slate-850 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-slate-800 hover:shadow-md transition-all cursor-pointer shadow-sm"
                      >
                        <Compass className="w-4 h-4 text-rose-500 animate-spin-slow" />
                        <span>Launch Layout Studio</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : selectedPlot ? (
            <div className="space-y-4" id="plot-inspector">
              <div className="flex justify-between items-start">
                <div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                    selectedPlot.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}>{selectedPlot.status}</span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedPlot.plot_number}</h3>
                </div>
                <button onClick={() => setSelectedPlot(null)} className="text-[10px] text-indigo-600 hover:underline">Clear</button>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3.5 text-xs">
                <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">Structure Metrics</p>
                <div className="space-y-1.5 text-[11px] font-mono">
                  <p className="flex justify-between"><span className="font-sans text-slate-500">Parent Layout Zone:</span> <span className="font-bold text-slate-900">{selectedPlot.layout_name || selectedPlot.layout?.name || "N/A"}</span></p>
                  <p className="flex justify-between"><span className="font-sans text-slate-500">Access Facing:</span> <span className="font-bold text-slate-900">{selectedPlot.facing}</span></p>
                  <p className="flex justify-between"><span className="font-sans text-slate-500">Scribed Dimensions:</span> <span className="font-bold text-slate-900">{selectedPlot.dimensions || "N/A"}</span></p>
                  <p className="flex justify-between"><span className="font-sans text-slate-500">Width:</span> <span className="font-medium text-slate-800">{selectedPlot.width || "0"} {getUnitCode(selectedPlot.measurement_unit_id)}</span></p>
                  <p className="flex justify-between"><span className="font-sans text-slate-500">Length:</span> <span className="font-medium text-slate-800">{selectedPlot.length || "0"} {getUnitCode(selectedPlot.measurement_unit_id)}</span></p>
                  <p className="flex justify-between"><span className="font-sans text-slate-500">Access Road width:</span> <span className="font-medium text-slate-800">{selectedPlot.road_width || "0"} m</span></p>
                  <p className="flex justify-between"><span className="font-sans text-slate-500">Total Net Area Size:</span> <span className="font-sans font-extrabold text-indigo-700">{selectedPlot.area_value} {getUnitCode(selectedPlot.measurement_unit_id)}</span></p>
                  <p className="flex justify-between"><span className="font-sans text-slate-500">Boundary corner:</span> <span className="font-bold font-sans text-slate-900">{selectedPlot.corner_plot ? "Yes" : "No"}</span></p>
                  <p className="flex justify-between"><span className="font-sans text-slate-500">PLC Charges:</span> <span className="font-bold font-sans text-amber-700">{plotMeta.plc || "None"}</span></p>
                  <p className="flex justify-between"><span className="font-sans text-slate-500">Latitude:</span> <span className="font-medium text-slate-850">{plotMeta.latitude || "N/A"}</span></p>
                  <p className="flex justify-between"><span className="font-sans text-slate-500">Longitude:</span> <span className="font-medium text-slate-850">{plotMeta.longitude || "N/A"}</span></p>
                  <p className="flex justify-between"><span className="font-sans text-slate-500">Polygon Ref (Future):</span> <span className="font-mono text-slate-600">{plotMeta.polygon_ref || "N/A"}</span></p>
                </div>

                <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">Extensible Custom attributes</p>
                
                {/* Visual Custom Attributes Tags list parsed dynamically */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(plotMeta.plot_attributes || {}).map(([key, value]) => {
                    if (!value) return null;
                    return (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-150 text-indigo-800 font-semibold font-sans text-[10px] px-2 py-0.5 rounded-md"
                      >
                        <span>{key}</span>
                        {hasPlotManage && (
                          <button
                            onClick={() => handleToggleExtAttribute(key, true)}
                            className="text-indigo-400 hover:text-indigo-900 font-bold ml-1"
                            title="Deactivate attribute"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    );
                  })}
                  {Object.keys(plotMeta.plot_attributes || {}).length === 0 && (
                    <p className="text-[10px] text-slate-400 block w-full text-center py-1">No custom tags registered.</p>
                  )}
                </div>

                {/* Predefined custom attributes triggers */}
                {hasPlotManage && (
                  <div className="border-t border-slate-100 pt-2.5 space-y-2">
                    <p className="text-[9.5px] font-bold text-slate-400 block">Predefined Attributes Toggles:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["Park Facing", "Clubhouse Facing", "Lake Facing", "Sea Facing", "Premium Plot"].map((attr) => {
                        const isSet = !!plotMeta.plot_attributes?.[attr];
                        return (
                          <button
                            key={attr}
                            onClick={() => handleToggleExtAttribute(attr, isSet)}
                            className={`px-1.5 py-0.5 rounded text-[9.5px] border font-medium ${
                              isSet ? "bg-indigo-650 text-white border-indigo-700" : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                            }`}
                          >
                            {attr}
                          </button>
                        );
                      })}
                    </div>

                    {/* Infinite Dynamic Extension (Extensible custom attribute register string) */}
                    <div className="space-y-1 pt-2">
                      <label className="text-[9.5px] font-bold text-slate-400 block">Register new custom tag:</label>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const data = new FormData(e.currentTarget);
                          const tag = data.get("customTag") as string;
                          if (tag) {
                            handleAddCustomAttributeString(tag);
                            e.currentTarget.reset();
                          }
                        }}
                        className="flex gap-1.5"
                      >
                        <input
                          type="text"
                          name="customTag"
                          placeholder="e.g. Hilltop Facing"
                          className="flex-1 bg-slate-50 border border-slate-200 rounded p-1 text-[11px] focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-750 text-white text-[10px] font-bold px-2.5 rounded"
                        >
                          Add
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Future Booking Action Link */}
                <div className="border-t border-slate-150 pt-3 space-y-2">
                  <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">Booking & Leads Workflow</p>
                  {selectedPlot.status === "AVAILABLE" ? (
                    <button
                      onClick={() => {
                        displaySuccess(`Future Booking Flow initiated for Plot ${selectedPlot.plot_number}! (Placed in 15-minute developer lock)`);
                        dispatchAuditLog("PLOT_BOOKING_INITIATED", "plots", selectedPlot.id, `Initiated customer booking request for Plot: ${selectedPlot.plot_number}`);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl transition-colors shadow-xs"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Initiate Future Booking</span>
                    </button>
                  ) : (
                    <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-150 text-center">
                      This plot is currently <strong>{selectedPlot.status}</strong>. Bookings are only eligible for AVAILABLE inventory tracts.
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-150 pt-3 space-y-2">
                  <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">Visual Navigation</p>
                  <button
                    onClick={() => {
                      const matchedLayout = layouts.find(l => l.id === selectedPlot.layout_id);
                      if (matchedLayout) {
                        setSelectedLayout(matchedLayout);
                      }
                      setActiveTab("viewer");
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs py-2 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 text-rose-500" />
                    <span>Visualize on Interactive Map</span>
                  </button>
                </div>

                {plotMeta.remarks && (
                  <div className="border-t border-slate-100 pt-2 text-[10.5px] text-slate-500">
                    <span className="font-bold text-[9.5px] text-slate-400 block uppercase mb-1">Remarks:</span>
                    <p className="italic bg-amber-50/50 p-2 rounded-lg border border-amber-100/60 leading-relaxed text-slate-600">{plotMeta.remarks}</p>
                  </div>
                )}

                {/* Advanced Plot Actions */}
                {hasPlotManage && (
                  <div className="border-t border-slate-150 pt-3 space-y-2">
                    <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">Advanced Lifecycle Operations</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setMovePlotTarget({
                            plotId: selectedPlot.id,
                            plotNumber: selectedPlot.plot_number,
                            layoutId: selectedPlot.layout_id
                          });
                          setCurrModal("move_plot");
                        }}
                        className="flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10.5px] py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Move className="w-3 h-3 text-indigo-650" />
                        <span>Move Plot</span>
                      </button>

                      <button
                        onClick={() => {
                          setSplitPlotTarget({
                            plotId: selectedPlot.id,
                            plotNumber: selectedPlot.plot_number,
                            areaValue: Number(selectedPlot.area_value),
                            unitId: selectedPlot.measurement_unit_id,
                            layoutId: selectedPlot.layout_id,
                            facing: selectedPlot.facing,
                            plotANumber: `${selectedPlot.plot_number}A`,
                            plotAArea: Number((selectedPlot.area_value / 2).toFixed(2)),
                            plotBNumber: `${selectedPlot.plot_number}B`,
                            plotBArea: Number((selectedPlot.area_value / 2).toFixed(2))
                          });
                          setCurrModal("split_plot");
                        }}
                        className="flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10.5px] py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Scissors className="w-3 h-3 text-indigo-650" />
                        <span>Split Plot</span>
                      </button>

                      <button
                        onClick={() => handleDuplicatePlot(selectedPlot.id)}
                        className="flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10.5px] py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3 h-3 text-indigo-650" />
                        <span>Duplicate</span>
                      </button>

                      {selectedPlot.status === "ARCHIVED" ? (
                        <button
                          onClick={() => handleRestorePlot(selectedPlot.id, selectedPlot.plot_number)}
                          className="flex items-center justify-center gap-1.5 bg-emerald-50 border border-emerald-250 text-emerald-700 font-bold text-[10.5px] py-1.5 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-650" />
                          <span>Restore</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleArchivePlot(selectedPlot.id, selectedPlot.plot_number)}
                          className="flex items-center justify-center gap-1.5 bg-amber-50 border border-amber-250 text-amber-700 font-bold text-[10.5px] py-1.5 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          <Archive className="w-3 h-3 text-amber-650" />
                          <span>Archive</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4" id="empty-inspector">
              <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm space-y-3">
                <div className="flex items-center gap-1.5 text-indigo-700">
                  <Compass className="w-4 h-4 animate-spin-slow" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">BhoomiOne Help System</span>
                </div>
                <div className="space-y-3.5 text-xs">
                  <div>
                    <h5 className="font-bold text-slate-800 text-[11.5px]">Step Goal</h5>
                    <p className="text-slate-500 mt-0.5 leading-relaxed text-[11px]">Register real estate construction project bounds and draft a compliant cadastral layout subdivision.</p>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-[11.5px]">Why it matters</h5>
                    <p className="text-slate-500 mt-0.5 leading-relaxed text-[11px]">Establishes a legally verified, GPS-calibrated land plot database conforming to local municipal planning authorities and RERA standards.</p>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium text-[11px]">
                    <span className="text-slate-400 font-semibold">Estimated Time</span>
                    <span className="text-indigo-650 font-bold font-mono">10 Minutes</span>
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-slate-800 text-[11.5px]">Tips & Next Steps</h5>
                    <ul className="list-disc list-inside space-y-1 text-slate-500 text-[11px]">
                      <li>First, register a primary Project from the <strong>Projects</strong> tab.</li>
                      <li>Create a subdivision Layout, then go to the Layout Workspace.</li>
                      <li>Launch <strong>Layout Studio</strong> to draw boundary vectors.</li>
                      <li>Subdivide land areas and generate marketable Plots.</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl text-center space-y-2">
                <p className="text-[10px] text-slate-400">No specific project, layout, or plot row is currently selected for deep technical analysis.</p>
              </div>
            </div>
          )}

        </div>

      </div>
      )}

      {/* Interactive Layout Map tab workspace */}
      {activeTab === "viewer" && (() => {
        if (!selectedProject) {
          return (
            <div className="flex-1 p-8 overflow-y-auto flex items-center justify-center min-h-[60vh]" id="no-project-fallback-view">
              <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-md text-center space-y-6">
                <div className="mx-auto bg-indigo-50 text-indigo-650 w-12 h-12 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Please select a project first
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    To access the Map Studio, you must first select an active project from the Projects tab.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("projects");
                  }}
                  className="mx-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-sm transition-colors cursor-pointer border border-indigo-750 flex items-center justify-center gap-1.5"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Go to Projects</span>
                </button>
              </div>
            </div>
          );
        }

        const projectLayouts = getLayoutsForProject(selectedProject.id);
        if (projectLayouts.length === 0) {
          return (
            <div className="flex-1 p-8 overflow-y-auto flex items-center justify-center min-h-[60vh]" id="no-layouts-fallback-view">
              <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-md text-center space-y-6">
                <div className="mx-auto bg-indigo-50 text-indigo-650 w-12 h-12 rounded-full flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    This project has no layouts yet.
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    To open the interactive Map Studio, you must first register at least one layout subdivision plan under this project.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <button
                    onClick={() => {
                      setFormLay({
                        project_id: selectedProject.id,
                        name: "",
                        code: "",
                        layout_type: "RESIDENTIAL",
                        approval_number: "",
                        survey_number: "",
                        approval_date: "",
                        total_area_value: "",
                        total_area_unit_id: getDefaultUnitId(selectedProject.id),
                        measurement_unit_id: getDefaultUnitId(selectedProject.id),
                        status: "DRAFT",
                        phase: "",
                        description: ""
                      });
                      setReturnToViewerAfterSave(true);
                      setCurrModal("create_layout");
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-colors cursor-pointer border border-indigo-700 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Layout</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("layouts");
                    }}
                    className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-250 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Back to Layouts</span>
                  </button>
                </div>
              </div>
            </div>
          );
        }

        // If layouts exist but selectedLayout is null or from a different project, show the layout selection empty state
        if (!selectedLayout || selectedLayout.project_id !== selectedProject.id) {
          return (
            <div className="flex-1 p-8 overflow-y-auto flex items-center justify-center min-h-[60vh]" id="no-layout-selected-map-view">
              <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-md text-center space-y-6">
                <div className="mx-auto bg-indigo-50 text-indigo-650 w-12 h-12 rounded-full flex items-center justify-center">
                  <Compass className="w-6 h-6 animate-spin-slow text-indigo-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Select a Layout to Open the Map
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    A layout must be selected to view and edit interactive map details.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <button
                    onClick={() => {
                      setActiveTab("layouts");
                    }}
                    className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-250 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>View Layouts</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("layouts");
                      setEditId(null);
                      setFormLay({
                        project_id: selectedProject.id,
                        name: "",
                        code: "",
                        layout_type: "RESIDENTIAL",
                        approval_number: "",
                        survey_number: "",
                        approval_date: "",
                        total_area_value: "",
                        total_area_unit_id: getDefaultUnitId(selectedProject.id),
                        measurement_unit_id: getDefaultUnitId(selectedProject.id),
                        status: "DRAFT",
                        phase: "",
                        description: ""
                      });
                      setCurrModal("create_layout");
                    }}
                    className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-colors cursor-pointer border border-indigo-700 flex items-center justify-center gap-1.5"
                  >
                    <span>Create Layout</span>
                  </button>
                </div>
              </div>
            </div>
          );
        }

        const activeLayoutObj = selectedLayout;

        return (
          <div className="p-0">
            <MapWorkspaceIndex
              initialLayoutId={activeLayoutObj.id}
              initialProjectId={selectedProject.id}
              projects={lookupProjects}
              layouts={lookupLayouts}
              onBackToInventory={() => {
                setActiveTab("layouts");
              }}
              onEditLayoutDetails={(layoutId) => {
                const layoutObj = lookupLayouts.find(l => String(l.id) === String(layoutId));
                if (layoutObj) {
                  setReturnToViewerAfterSave(true);
                  setSelectedLayout(layoutObj);
                  handleStartEditLayout(layoutObj);
                }
              }}
              onSelectProject={(projectId) => {
                if (projectId) {
                  const proj = lookupProjects.find(p => String(p.id) === String(projectId));
                  if (proj) setSelectedProject(proj);
                } else {
                  setSelectedProject(null);
                }
              }}
              onSelectLayout={(layoutId) => {
                if (layoutId) {
                  const lay = lookupLayouts.find(l => String(l.id) === String(layoutId));
                  if (lay) setSelectedLayout(lay);
                } else {
                  setSelectedLayout(null);
                }
              }}
            />
          </div>
        );
      })()}

      {/* CAD Imports Full Workspace Integration */}
      {activeTab === "cad" && (() => {
        if (!selectedLayout) {
          return (
            <div className="flex-1 p-8 flex items-center justify-center min-h-[50vh]" id="no-layout-for-imports-fallback">
              <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-md text-center space-y-6">
                <div className="mx-auto bg-indigo-50 text-indigo-650 w-12 h-12 rounded-full flex items-center justify-center">
                  <FileCode2 className="w-6 h-6 animate-pulse text-indigo-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">No Layout Selected</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Imports must belong to a specific Layout.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <button
                    onClick={() => {
                      setActiveTab("layouts");
                    }}
                    className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-250 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Select Layout</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("layouts");
                      setEditId(null);
                      const pId = lookupProjects[0]?.id || "";
                      setFormLay({
                        project_id: pId,
                        name: "",
                        code: "",
                        layout_type: "RESIDENTIAL",
                        approval_number: "",
                        survey_number: "",
                        approval_date: "",
                        total_area_value: "",
                        total_area_unit_id: getDefaultUnitId(pId),
                        measurement_unit_id: getDefaultUnitId(pId),
                        status: "DRAFT",
                        phase: "",
                        description: ""
                      });
                      setCurrModal("create_layout");
                    }}
                    className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-colors cursor-pointer border border-indigo-700 flex items-center justify-center gap-1.5"
                  >
                    <span>Create Layout</span>
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="p-6">
            <CADImportManager 
              user={user}
              lookupProjects={lookupProjects}
              lookupLayouts={lookupLayouts}
              displaySuccess={(msg) => setSuccessMess(msg)}
              displayError={(msg) => setErrorMess(msg)}
              initialProjectId={selectedProject ? String(selectedProject.id) : ""}
              initialLayoutId={selectedLayout ? String(selectedLayout.id) : ""}
            />
          </div>
        );
      })()}

      {/* Commercial & Tax Engine Integration */}
      {activeTab === "commercial" && (
        <div className="p-6 space-y-6" id="commercial-tab-panel">
          {/* Tenant Commercial Header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                <Percent className="w-3.5 h-3.5 text-emerald-600" />
                <span>Commercial Operations Console</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">Commercial Engine & Tax Management</h2>
              <p className="text-xs text-slate-500">
                Configure your real estate development taxes, plot sales levies, TDS rates, and builder-specific state overrides.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar Sub-Navigation */}
            <div className="lg:col-span-3 space-y-2">
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1">COMMERCIAL MENU</p>
                <button className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-100">
                  <Percent className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Tax & Charges</span>
                </button>
                <button className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-not-allowed" disabled>
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Payment Schedules (🔒)</span>
                </button>
                <button className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-not-allowed" disabled>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Receipts & Ledgers (🔒)</span>
                </button>
              </div>
            </div>

            {/* Main Console Content */}
            <div className="lg:col-span-9">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <EnterpriseTaxConsole 
                  onShowToast={(msg, type) => {
                    if (type === "success") {
                      setSuccessMess(msg);
                      setTimeout(() => setSuccessMess(null), 4000);
                    } else {
                      setErrorMess(msg);
                      setTimeout(() => setErrorMess(null), 4000);
                    }
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings (Marketplace Profile Tab) */}
      {activeTab === "marketplace" && (
        <div className="p-6 space-y-6" id="settings-tab-panel">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-100 text-xs font-semibold">
                <Settings className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tenant Profile &amp; Developer Settings</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">Enterprise Settings Console</h2>
              <p className="text-xs text-slate-500">
                Manage developer profiles, GST details, API integrations, and RERA compliance settings.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar Sub-Navigation */}
            <div className="lg:col-span-3 space-y-2">
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1">SETTINGS MENU</p>
                <button className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-100">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Developer Profile</span>
                </button>
                <button className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-not-allowed" disabled>
                  <Cpu className="w-3.5 h-3.5" />
                  <span>API Integration (🔒)</span>
                </button>
                <button className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-not-allowed" disabled>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Team &amp; Security (🔒)</span>
                </button>
              </div>
            </div>

            {/* Main Console Content */}
            <div className="lg:col-span-9">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-sm font-bold text-slate-900">Developer Profile Information</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Customize default parameters published to the customer marketplace.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Company Registered Name</label>
                    <input 
                      type="text" 
                      value="Bhoomi Developers Ltd" 
                      disabled
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-600 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Corporate GSTIN / Tax ID</label>
                    <input 
                      type="text" 
                      value="29AAAAA1111A1Z1" 
                      disabled
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-600 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Primary RERA License Number</label>
                    <input 
                      type="text" 
                      value="PRM/KA/RERA/1251/310/PR/180516/001745" 
                      disabled
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-600 cursor-not-allowed font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Primary Contact Email</label>
                    <input 
                      type="text" 
                      value={user?.email || "billing@bhoomi-developers.com"} 
                      disabled
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-600 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">ERP &amp; Calibration System Parameters</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Control base math and coordinate conversions.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 border border-slate-150 rounded-xl bg-slate-50/50 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Default Measurement Unit</p>
                      <p className="text-xs font-semibold text-slate-800">SQUARE FEET (sft)</p>
                      <span className="inline-block bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">System Standard</span>
                    </div>
                    <div className="p-4 border border-slate-150 rounded-xl bg-slate-50/50 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Geo Reference Datum</p>
                      <p className="text-xs font-semibold text-slate-800">WGS 84 (EPSG:4326)</p>
                      <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">GPS Standards</span>
                    </div>
                    <div className="p-4 border border-slate-150 rounded-xl bg-slate-50/50 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gemini API Service Node</p>
                      <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                        <span>Connected</span>
                      </p>
                      <span className="inline-block bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">AI Agent Active</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-amber-900">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Managed SaaS Active Subscription:</span> Since this node is part of the enterprise tenant pool, profile modifications are handled by the Organization Owner's billing cockpit. To unlock custom modifications, submit a change request.
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => {
                      setSuccessMess("Settings draft verified. Organizational locks are currently active.");
                      setTimeout(() => setSuccessMess(null), 4000);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    Apply Parameter Handshakes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DIALOG AND POPUPS ENGINE                                      */}
      // Mapped dynamic overlays
      {`============================================================`}
      
      {/* 1. Project modal overlay (Create/Edit) */}
      {(currModal === "create_project" || currModal === "edit_project") && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Sticky Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {currModal === "create_project" ? "Create New Project Registry" : "Edit Project Specifications"}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Define geographic bounds, compliance parameters and India location hierarchy</p>
              </div>
              <button 
                type="button" 
                onClick={() => setCurrModal(null)} 
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content Container */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              
              {/* Local API Error / Retry alert */}
              {locationApiError && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-xs flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{locationApiError}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={loadStates} 
                    className="bg-white border border-red-200 hover:bg-red-50 text-red-700 px-2.5 py-1 rounded-md font-bold transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              <form id="project-form" onSubmit={handleSaveProject} className="space-y-4 text-xs text-left">
                {/* Core Specifications section */}
                <div className="space-y-3.5">
                  <h5 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider border-b border-slate-100 pb-1">Core Specifications</h5>
                  
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Project Name *</label>
                    <input 
                      required 
                      type="text" 
                      value={formProj.name} 
                      onChange={(e) => setFormProj({ ...formProj, name: e.target.value })} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      {currModal === "create_project" ? (
                        <>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Project Code *</label>
                          <input 
                            required 
                            type="text" 
                            value={formProj.code} 
                            onChange={(e) => setFormProj({ ...formProj, code: e.target.value.toUpperCase() })} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                          />
                        </>
                      ) : (
                        <>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Project Code (ReadOnly)</label>
                          <input 
                            disabled 
                            type="text" 
                            value={formProj.code} 
                            className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-400 cursor-not-allowed" 
                          />
                        </>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Developer Name *</label>
                      <input 
                        required 
                        type="text" 
                        value={formProj.developer_name} 
                        onChange={(e) => setFormProj({ ...formProj, developer_name: e.target.value })} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Project Type *</label>
                      <select 
                        required 
                        value={formProj.project_type} 
                        onChange={(e) => setFormProj({ ...formProj, project_type: e.target.value })} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="RESIDENTIAL">RESIDENTIAL</option>
                        <option value="COMMERCIAL">COMMERCIAL</option>
                        <option value="MIXED_USE">MIXED USE</option>
                        <option value="INDUSTRIAL">INDUSTRIAL</option>
                        <option value="PLOTTED">PLOTTED</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status *</label>
                      <select 
                        required 
                        value={formProj.status} 
                        onChange={(e) => setFormProj({ ...formProj, status: e.target.value })} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="PLANNING">PLANNING</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Geography & Location master hierarchical selects section */}
                <div className="space-y-3.5 pt-2">
                  <h5 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider border-b border-slate-100 pb-1">Geography & India Location Hierarchy</h5>
                  
                  {/* Cascading State & District row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">State *</label>
                        {loadingLoc.states && <span className="text-[9px] text-indigo-500 animate-pulse font-medium">Loading...</span>}
                      </div>
                      <select
                        required={!manualState}
                        value={manualState ? "OTHER" : selectedStateId}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="">-- Select State --</option>
                        {states.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                        <option value="OTHER">Other (Enter manually)</option>
                      </select>
                      {manualState && (
                        <input
                          required
                          type="text"
                          placeholder="Enter State Name"
                          value={formProj.state}
                          onChange={(e) => setFormProj({ ...formProj, state: e.target.value })}
                          className="w-full mt-1.5 bg-slate-50 border border-indigo-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">District</label>
                        {loadingLoc.districts && <span className="text-[9px] text-indigo-500 animate-pulse font-medium">Loading...</span>}
                      </div>
                      <select
                        disabled={!selectedStateId || manualState}
                        value={manualDistrict ? "OTHER" : selectedDistrictId}
                        onChange={(e) => handleDistrictChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        <option value="">-- Select District --</option>
                        {districts.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                        <option value="OTHER">Other (Enter manually)</option>
                      </select>
                      {(manualDistrict || manualState) && (
                        <input
                          required={manualDistrict}
                          type="text"
                          placeholder="Enter District Name"
                          value={formProj.district}
                          onChange={(e) => setFormProj({ ...formProj, district: e.target.value })}
                          className="w-full mt-1.5 bg-slate-50 border border-indigo-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      )}
                    </div>
                  </div>

                  {/* Cascading Taluk & City row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Taluk</label>
                        {loadingLoc.taluks && <span className="text-[9px] text-indigo-500 animate-pulse font-medium">Loading...</span>}
                      </div>
                      <select
                        disabled={!selectedDistrictId || manualDistrict || manualState}
                        value={manualTaluk ? "OTHER" : selectedTalukId}
                        onChange={(e) => handleTalukChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        <option value="">-- Select Taluk --</option>
                        {taluks.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                        <option value="OTHER">Other (Enter manually)</option>
                      </select>
                      {(manualTaluk || manualDistrict || manualState) && (
                        <input
                          type="text"
                          placeholder="Enter Taluk Name"
                          value={formProj.taluk}
                          onChange={(e) => setFormProj({ ...formProj, taluk: e.target.value })}
                          className="w-full mt-1.5 bg-slate-50 border border-indigo-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Location / City *</label>
                        {loadingLoc.cities && <span className="text-[9px] text-indigo-500 animate-pulse font-medium">Loading...</span>}
                      </div>
                      <select
                        disabled={!selectedDistrictId || manualDistrict || manualState}
                        value={manualCity ? "OTHER" : formProj.location}
                        onChange={(e) => handleCityChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        <option value="">-- Select City/Town --</option>
                        {cities.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                        <option value="OTHER">Other (Enter manually)</option>
                      </select>
                      {(manualCity || manualDistrict || manualState) && (
                        <input
                          required
                          type="text"
                          placeholder="Enter City/Town Name"
                          value={formProj.location}
                          onChange={(e) => setFormProj({ ...formProj, location: e.target.value })}
                          className="w-full mt-1.5 bg-slate-50 border border-indigo-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      )}
                    </div>
                  </div>

                  {/* Cascading Village & PIN row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Village / Locality</label>
                        {loadingLoc.villages && <span className="text-[9px] text-indigo-500 animate-pulse font-medium">Loading...</span>}
                      </div>
                      <select
                        disabled={!selectedTalukId || manualTaluk || manualDistrict || manualState}
                        value={manualVillage ? "OTHER" : formProj.village}
                        onChange={(e) => handleVillageChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        <option value="">-- Select Village/Locality --</option>
                        {villages.map((v) => (
                          <option key={v.id} value={v.name}>{v.name}</option>
                        ))}
                        <option value="OTHER">Other (Enter manually)</option>
                      </select>
                      {(manualVillage || manualTaluk || manualDistrict || manualState) && (
                        <input
                          type="text"
                          placeholder="Enter Village / Locality Name"
                          value={formProj.village}
                          onChange={(e) => setFormProj({ ...formProj, village: e.target.value })}
                          className="w-full mt-1.5 bg-slate-50 border border-indigo-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">PIN Code</label>
                      <input 
                        type="text" 
                        value={formProj.pincode} 
                        onChange={(e) => setFormProj({ ...formProj, pincode: e.target.value })} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                      />
                    </div>
                  </div>

                  {/* Geolocation Coordinate Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Latitude</label>
                      <input 
                        type="text" 
                        value={formProj.latitude} 
                        onChange={(e) => setFormProj({ ...formProj, latitude: e.target.value })} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                        placeholder="e.g. 12.9716" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Longitude</label>
                      <input 
                        type="text" 
                        value={formProj.longitude} 
                        onChange={(e) => setFormProj({ ...formProj, longitude: e.target.value })} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                        placeholder="e.g. 77.5946" 
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Metadata, Description & Compliance Section */}
                <div className="space-y-3.5 pt-2">
                  <h5 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider border-b border-slate-100 pb-1">Compliance & Compliance Timelines</h5>
                  
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Description (Optional)</label>
                    <textarea 
                      rows={2} 
                      value={formProj.description} 
                      onChange={(e) => setFormProj({ ...formProj, description: e.target.value })} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                      placeholder="Enter brief project description..." 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">RERA Validation No.</label>
                      <input 
                        type="text" 
                        value={formProj.rera_number} 
                        onChange={(e) => setFormProj({ ...formProj, rera_number: e.target.value })} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Approval Status</label>
                      <select 
                        value={formProj.approval_status} 
                        onChange={(e) => setFormProj({ ...formProj, approval_status: e.target.value })} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Approval Authority / Agency</label>
                    <input 
                      type="text" 
                      value={formProj.approval_authority} 
                      onChange={(e) => setFormProj({ ...formProj, approval_authority: e.target.value })} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Launch Date</label>
                      <input 
                        type="date" 
                        value={formProj.launch_date} 
                        onChange={(e) => setFormProj({ ...formProj, launch_date: e.target.value })} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Possession Target Date</label>
                      <input 
                        type="date" 
                        value={formProj.possession_target_date} 
                        onChange={(e) => setFormProj({ ...formProj, possession_target_date: e.target.value })} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* STICKY FOOTER with Cancel and Save Project / Update Project buttons */}
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2.5 bg-slate-50">
              <button 
                type="button" 
                onClick={() => setCurrModal(null)} 
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 bg-white transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="project-form"
                disabled={isSavingProject} 
                className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 ${isSavingProject ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isSavingProject ? (
                  <>
                    <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  currModal === "create_project" ? "Save Project" : "Update Project"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

{/* 2. Layouts Modal overlay */}
      {(currModal === "create_layout" || currModal === "edit_layout") && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">{currModal === "create_layout" ? "Define Layout Subdivision Plan" : "Edit Phase Blueprint"}</h4>
            {errorMess && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-800 flex items-start gap-2" id="layout-modal-error-banner">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{errorMess}</span>
              </div>
            )}
            <form onSubmit={handleSaveLayout} className="space-y-3.5 test-xs text-left">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Parent Project Context *</label>
                <select value={formLay.project_id} onChange={(e) => setFormLay({ ...formLay, project_id: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none">
                  {lookupProjects.map(p => (
                    <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Layout Name *</label>
                  <input required type="text" value={formLay.name} onChange={(e) => setFormLay({ ...formLay, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Subdivision Code *</label>
                  <input required disabled={currModal === "edit_layout"} type="text" value={formLay.code} onChange={(e) => setFormLay({ ...formLay, code: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Classification Type</label>
                  <select value={formLay.layout_type} onChange={(e) => setFormLay({ ...formLay, layout_type: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
                    <option value="RESIDENTIAL">RESIDENTIAL</option>
                    <option value="COMMERCIAL">COMMERCIAL</option>
                    <option value="MIXED_USE">MIXED USE</option>
                    <option value="INDUSTRIAL">INDUSTRIAL</option>
                    <option value="FARM_LAND">FARM LAND</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lifecycle State</label>
                  <select value={formLay.status} onChange={(e) => setFormLay({ ...formLay, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
                    <option value="DRAFT">DRAFT</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="LAUNCHED">LAUNCHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Zoned Area value</label>
                  <input type="number" value={formLay.total_area_value} onChange={(e) => setFormLay({ ...formLay, total_area_value: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Standard Measurement Unit *</label>
                  <select 
                    value={formLay.measurement_unit_id || ""} 
                    onChange={(e) => setFormLay({ ...formLay, measurement_unit_id: e.target.value, total_area_unit_id: e.target.value })} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  >
                    {units.length === 0 ? (
                      <option value="">Loading standard measurement units...</option>
                    ) : (
                      <>
                        <option value="">-- Select Standard Measurement Unit * --</option>
                        {units.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.symbol || u.code})</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approved reference index</label>
                  <input type="text" value={formLay.approval_number} onChange={(e) => setFormLay({ ...formLay, approval_number: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" placeholder="e.g. L-APPR/2026/09" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Authority Approval Date</label>
                  <input type="date" value={formLay.approval_date} onChange={(e) => setFormLay({ ...formLay, approval_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Survey Numbers (comma separated) *</label>
                <input type="text" value={formLay.survey_number} onChange={(e) => setFormLay({ ...formLay, survey_number: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-medium" placeholder="e.g. 145/2, 145/3, 146" />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Development Phase / Sector</label>
                  <input type="text" value={formLay.phase} onChange={(e) => setFormLay({ ...formLay, phase: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono" placeholder="e.g. Phase 1, Block A" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Layout Details / Description</label>
                  <input type="text" value={formLay.description} onChange={(e) => setFormLay({ ...formLay, description: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" placeholder="e.g. Near main park entrance" />
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-3">
                <button type="button" onClick={() => { setCurrModal(null); setReturnToViewerAfterSave(false); }} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold">Save Layout</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Plots Modal overlay (Create/Edit) */}
      {(currModal === "create_plot" || currModal === "edit_plot") && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">{currModal === "create_plot" ? "Catalog Single Plot Parcel" : "Modify Plot Parameter Specs"}</h4>
            <form onSubmit={handleSavePlot} className="space-y-3.5 test-xs text-left">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Parent Layout subdivision *</label>
                <select disabled={currModal === "edit_plot"} value={formPlot.layout_id} onChange={(e) => setFormPlot({ ...formPlot, layout_id: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none">
                  {lookupLayouts.map(l => (
                    <option key={l.id} value={l.id}>[{l.code}] {l.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plot Number *</label>
                  <input required type="text" value={formPlot.plot_number} onChange={(e) => setFormPlot({ ...formPlot, plot_number: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs tracking-wider" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inventory Status</label>
                  <select value={formPlot.status} onChange={(e) => setFormPlot({ ...formPlot, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="RESERVED">RESERVED</option>
                    <option value="BOOKED">BOOKED</option>
                    <option value="SOLD">SOLD</option>
                    <option value="BLOCKED">BLOCKED</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1 mb-0 pb-0">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Area Value *</label>
                    {formPlot.length && formPlot.width && !isNaN(Number(formPlot.length)) && !isNaN(Number(formPlot.width)) && (
                      <button
                        type="button"
                        onClick={() => {
                          const area = Number(formPlot.length) * Number(formPlot.width);
                          if (!isNaN(area)) {
                            setFormPlot(prev => ({ ...prev, area_value: String(area.toFixed(2)) }));
                          }
                        }}
                        className="text-[9px] text-indigo-650 hover:text-indigo-850 font-bold hover:underline transition-colors focus:outline-none"
                        title="Auto-calculate area from Length * Width"
                      >
                        Auto-calc ({Number(formPlot.length) * Number(formPlot.width)})
                      </button>
                    )}
                  </div>
                  <input required type="number" step="any" value={formPlot.area_value} onChange={(e) => setFormPlot({ ...formPlot, area_value: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Measurement Unit *</label>
                  <select value={formPlot.measurement_unit_id} onChange={(e) => setFormPlot({ ...formPlot, measurement_unit_id: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.symbol || u.code})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Length</label>
                  <input type="number" value={formPlot.length} onChange={(e) => setFormPlot({ ...formPlot, length: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Width</label>
                  <input type="number" value={formPlot.width} onChange={(e) => setFormPlot({ ...formPlot, width: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Road Width m</label>
                  <input type="number" value={formPlot.road_width} onChange={(e) => setFormPlot({ ...formPlot, road_width: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Facing Direction</label>
                  <select value={formPlot.facing} onChange={(e) => setFormPlot({ ...formPlot, facing: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
                    <option value="NORTH">NORTH</option>
                    <option value="SOUTH">SOUTH</option>
                    <option value="EAST">EAST</option>
                    <option value="WEST">WEST</option>
                    <option value="NORTHEAST">NORTHEAST</option>
                    <option value="NORTHWEST">NORTHWEST</option>
                    <option value="SOUTHEAST">SOUTHEAST</option>
                    <option value="SOUTHWEST">SOUTHWEST</option>
                  </select>
                </div>
                <div className="flex items-center gap-2.5 pt-4">
                  <input type="checkbox" id="modalCornerPlot" checked={formPlot.corner_plot} onChange={(e) => setFormPlot({ ...formPlot, corner_plot: e.target.checked })} className="w-4 h-4 text-indigo-650" />
                  <label htmlFor="modalCornerPlot" className="text-xs font-bold text-slate-700">Corner layout lot</label>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Text Dimensions label</label>
                <input type="text" placeholder="e.g. 30 x 45" value={formPlot.dimensions} onChange={(e) => setFormPlot({ ...formPlot, dimensions: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PLC (Preferential Location Charges)</label>
                  <input type="text" placeholder="e.g. 10% Corner Premium" value={formPlot.plc} onChange={(e) => setFormPlot({ ...formPlot, plc: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Polygon Reference (Future)</label>
                  <input type="text" placeholder="e.g. polygon_ref_098" value={formPlot.polygon_ref} onChange={(e) => setFormPlot({ ...formPlot, polygon_ref: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Latitude coordinate</label>
                  <input type="text" placeholder="e.g. 12.9716" value={formPlot.latitude} onChange={(e) => setFormPlot({ ...formPlot, latitude: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Longitude coordinate</label>
                  <input type="text" placeholder="e.g. 77.5946" value={formPlot.longitude} onChange={(e) => setFormPlot({ ...formPlot, longitude: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plot Remarks / Notes</label>
                <textarea rows={2} placeholder="Add specific catalog details, trees, gradient comments..." value={formPlot.remarks} onChange={(e) => setFormPlot({ ...formPlot, remarks: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none" />
              </div>
              <div className="flex justify-end gap-2.5 pt-3">
                <button type="button" onClick={() => setCurrModal(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold">Catalog Plot</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Bulk Generate Series modal */}
      {currModal === "bulk_create_plots" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-indigo-650" />
                <span>Bulk Sequence Plots Builder</span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Define a starting and ending index to auto-generate multiple plots in series</p>
            </div>
            <form onSubmit={handleBulkCreatePlotsSequence} className="space-y-3 test-xs text-left">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Subdivision layout destination *</label>
                <select value={bulkCreate.layout_id} onChange={(e) => setBulkCreate({ ...bulkCreate, layout_id: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
                  {lookupLayouts.map(l => (
                    <option key={l.id} value={l.id}>[{l.code}] {l.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prefix label</label>
                  <input required type="text" value={bulkCreate.prefix} onChange={(e) => setBulkCreate({ ...bulkCreate, prefix: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs font-mono font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Start No.</label>
                  <input required type="number" value={bulkCreate.startNo} onChange={(e) => setBulkCreate({ ...bulkCreate, startNo: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">End No.</label>
                  <input required type="number" value={bulkCreate.endNo} onChange={(e) => setBulkCreate({ ...bulkCreate, endNo: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Scribed Area value</label>
                  <input required type="number" value={bulkCreate.area_value} onChange={(e) => setBulkCreate({ ...bulkCreate, area_value: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Measurement Unit</label>
                  <select value={bulkCreate.measurement_unit_id} onChange={(e) => setBulkCreate({ ...bulkCreate, measurement_unit_id: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.symbol || u.code})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Facing Direction</label>
                  <select value={bulkCreate.facing} onChange={(e) => setBulkCreate({ ...bulkCreate, facing: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
                    <option value="NORTH">NORTH</option>
                    <option value="SOUTH">SOUTH</option>
                    <option value="EAST">EAST</option>
                    <option value="WEST">WEST</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Road access Width m</label>
                  <input type="number" value={bulkCreate.road_width} onChange={(e) => setBulkCreate({ ...bulkCreate, road_width: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-150">
                <button type="button" onClick={() => setCurrModal(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-semibold">Generate Series</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Bulk Properties Update modal */}
      {currModal === "bulk_update_plots" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Bulk Modify Dimension Properties</h4>
            <form onSubmit={handleBulkPropertiesChangeSubmit} className="space-y-3.5 test-xs text-left">
              <p className="text-[10px] text-indigo-800 bg-indigo-50 p-2.5 rounded-lg border border-indigo-150">You are editing dimensions properties of <strong>{selectedPlotIds.length}</strong> selected plots simultaneously.</p>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Area Value (Leave blank to keep original)</label>
                <input type="number" value={bulkUpdateProps.area_value} onChange={(e) => setBulkUpdateProps({ ...bulkUpdateProps, area_value: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Facing Direction (Optional)</label>
                <select value={bulkUpdateProps.facing} onChange={(e) => setBulkUpdateProps({ ...bulkUpdateProps, facing: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
                  <option value="">Do Not Change</option>
                  <option value="NORTH">NORTH</option>
                  <option value="SOUTH">SOUTH</option>
                  <option value="EAST">EAST</option>
                  <option value="WEST">WEST</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Road access width m (Optional)</label>
                <input type="number" placeholder="No change" value={bulkUpdateProps.road_width} onChange={(e) => setBulkUpdateProps({ ...bulkUpdateProps, road_width: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
              <div className="flex justify-end gap-2.5 pt-3">
                <button type="button" onClick={() => setCurrModal(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold">Bulk Commit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Bulk Status Update modal */}
      {currModal === "bulk_status_plots" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 flex flex-col items-center justify-center text-center shadow-xl">
            <Settings2 className="w-8 h-8 text-indigo-600 mb-2" />
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 w-full">Bulk Status Update</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Choose the target inventory status states to apply across all <strong>{selectedPlotIds.length}</strong> selected plots on the checklist:</p>
            <div className="grid grid-cols-1 gap-2 w-full pt-2">
              {["AVAILABLE", "RESERVED", "BOOKED", "SOLD", "BLOCKED"].map((st) => (
                <button
                  key={st}
                  onClick={() => handleBulkStatusChange(st)}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 py-1.5 rounded-lg text-xs tracking-wider transition-colors"
                >
                  SET '{st}' STATUS STATE
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrModal(null)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-900 mt-4 outline-none"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Move Plot Modal */}
      {currModal === "move_plot" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-left">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Move Plot to Layout Subdivision</h4>
            <div className="space-y-3 text-xs">
              <p className="text-xs text-slate-500">
                You are moving Plot <strong>{movePlotTarget.plotNumber}</strong> to a different layout subdivision.
              </p>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Target Layout phase *</label>
                <select
                  value={movePlotTarget.layoutId}
                  onChange={(e) => setMovePlotTarget({ ...movePlotTarget, layoutId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                >
                  <option value="">-- Select Target Layout --</option>
                  {lookupLayouts.map(l => (
                    <option key={l.id} value={l.id}>[{l.code}] {l.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2.5 pt-3">
                <button type="button" onClick={() => setCurrModal(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50">Cancel</button>
                <button type="button" onClick={handleMovePlot} className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold">Move Plot</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Split Plot Modal */}
      {currModal === "split_plot" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl text-left max-h-[85vh] overflow-y-auto">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Split Land Plot Tract</h4>
            <div className="space-y-4 text-xs">
              <p className="text-xs text-slate-500">
                Split Plot <strong>{splitPlotTarget.plotNumber}</strong> (Total Area: {splitPlotTarget.areaValue} units) into two separate plots.
              </p>
              
              <div className="border border-slate-100 rounded-xl p-3 bg-slate-50 space-y-3">
                <h5 className="font-bold text-slate-700 text-xs">First Subdivision (Plot A)</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Plot A Number *</label>
                    <input
                      required
                      type="text"
                      value={splitPlotTarget.plotANumber}
                      onChange={(e) => setSplitPlotTarget({ ...splitPlotTarget, plotANumber: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Plot A Area *</label>
                    <input
                      required
                      type="number"
                      step="any"
                      value={splitPlotTarget.plotAArea}
                      onChange={(e) => setSplitPlotTarget({ ...splitPlotTarget, plotAArea: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="border border-slate-100 rounded-xl p-3 bg-slate-50 space-y-3">
                <h5 className="font-bold text-slate-700 text-xs">Second Subdivision (Plot B)</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Plot B Number *</label>
                    <input
                      required
                      type="text"
                      value={splitPlotTarget.plotBNumber}
                      onChange={(e) => setSplitPlotTarget({ ...splitPlotTarget, plotBNumber: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Plot B Area *</label>
                    <input
                      required
                      type="number"
                      step="any"
                      value={splitPlotTarget.plotBArea}
                      onChange={(e) => setSplitPlotTarget({ ...splitPlotTarget, plotBArea: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                <span>Original Area: <strong>{splitPlotTarget.areaValue}</strong></span>
                <span>Sum of Splits: <strong className={Number(splitPlotTarget.plotAArea) + Number(splitPlotTarget.plotBArea) !== splitPlotTarget.areaValue ? "text-amber-600" : "text-emerald-600"}>{(Number(splitPlotTarget.plotAArea) + Number(splitPlotTarget.plotBArea)).toFixed(2)}</strong></span>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button type="button" onClick={() => setCurrModal(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50">Cancel</button>
                <button type="button" onClick={handleSplitPlot} className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold">Perform Split</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Merge Plots Modal */}
      {currModal === "merge_plots" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl text-left">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Merge Subdivision Plots</h4>
            <div className="space-y-3 text-xs">
              <p className="text-xs text-slate-500">
                You are merging <strong>{mergePlotTarget.sourcePlotIds.length}</strong> selected plots into a single new consolidated plot.
              </p>
              
              <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-600 border border-slate-100 max-h-28 overflow-y-auto space-y-1">
                <span className="font-bold block text-slate-400 text-[9px] uppercase tracking-wider mb-1">Plots to Merge:</span>
                {mergePlotTarget.sourcePlotIds.map(id => {
                  const p = plots.find(x => x.id === id);
                  return (
                    <div key={id} className="flex justify-between items-center">
                      <span>Plot No: {p?.plot_number || "N/A"}</span>
                      <span className="font-mono">{p?.area_value || 0} units</span>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">New Merged Plot No. *</label>
                  <input
                    required
                    type="text"
                    value={mergePlotTarget.newPlotNumber}
                    onChange={(e) => setMergePlotTarget({ ...mergePlotTarget, newPlotNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                    placeholder="e.g. PL-merged"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">New Area Value *</label>
                  <input
                    required
                    type="number"
                    step="any"
                    value={mergePlotTarget.newAreaValue}
                    onChange={(e) => setMergePlotTarget({ ...mergePlotTarget, newAreaValue: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button type="button" onClick={() => setCurrModal(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50">Cancel</button>
                <button type="button" onClick={handleMergePlots} className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold">Perform Merge</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Guide Contextual Onboarding Drawer */}
      <UsageGuideDrawer
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        projects={projects}
        layouts={layouts}
        plots={plots}
        onCreateLayout={() => {
          setEditId(null);
          const pId = lookupProjects[0]?.id || "";
          setFormLay({
            project_id: pId,
            name: "",
            code: "",
            layout_type: "RESIDENTIAL",
            approval_number: "",
            survey_number: "",
            approval_date: "",
            total_area_value: "",
            total_area_unit_id: getDefaultUnitId(pId),
            measurement_unit_id: getDefaultUnitId(pId),
            status: "DRAFT",
            phase: "",
            description: ""
          });
          setCurrModal("create_layout");
        }}
      />

      </div>
    </div>
  );
}
