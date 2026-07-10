import React, { useState, useEffect } from "react";
import api from "../lib/api.ts";
import { UserProfile } from "../types/auth.ts";
import { CADImportManager } from "./CADImportManager.tsx";
import InteractiveLayoutViewer from "./InteractiveLayoutViewer.tsx";
import MapWorkspaceIndex from "./MapWorkspace/index.tsx";
import { EnterpriseTaxConsole } from "./saas/EnterpriseTaxConsole.tsx";
import {
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
  CheckCircle2
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
  const [activeTab, setActiveTab] = useState<"projects" | "layouts" | "plots" | "cad" | "viewer" | "marketplace" | "commercial">("projects");
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
  const [units, setUnits] = useState<any[]>([]);

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

  // Derived safe metadata for plot details panel to prevent rendering crashes
  const plotMeta = selectedPlot ? tryParseJSON(selectedPlot.dimensions_metadata, {}) : {};

  // Global search input
  const [globalSearch, setGlobalSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input to avoid API slamming
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(globalSearch);
    }, 400);
    return () => clearTimeout(handler);
  }, [globalSearch]);

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
  const hasPlotView = user.permissions?.includes("plots.view") || isTenantOwnerOrAdmin || false;
  const hasPlotManage = user.permissions?.includes("plots.manage") || isTenantOwnerOrAdmin || false;
  const hasDxfView = user.permissions?.includes("dxf.view") || isTenantOwnerOrAdmin || false;

  // Measurement Units reference caching helper
  const getUnitCode = (unitId: string) => {
    const matched = units.find(u => u.id === unitId);
    return matched ? matched.code : "SQFT";
  };

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

          // Menu adapts automatically based on resolved commercial feature engine:
          if (!hasSetInitialTab.current) {
            const hasMaps = expandedFeats.includes("gis_maps") || expandedFeats.includes("interactive_map.view");
            const hasDxf = expandedFeats.includes("dxf_import") || expandedFeats.includes("layout_viewer");
            
            if (hasMaps) {
              setActiveTab("viewer"); // Professional / Enterprise (Map-focused)
            } else if (hasDxf) {
              setActiveTab("layouts"); // Growth (Layout-focused)
            } else {
              setActiveTab("plots"); // Starter (Grid-focused)
            }
            hasSetInitialTab.current = true;
          }
        }
      } catch (sumErr) {
        console.warn("Failed to retrieve subscription summary in InventoryManager:", sumErr);
      }

      const unitsData = await api.fetchMeasurementUnits();
      setUnits(unitsData);

      // Pre-populate units in fields
      if (unitsData.length > 0) {
        setFormLay(prev => ({ ...prev, total_area_unit_id: unitsData[0].id, measurement_unit_id: unitsData[0].id }));
        setFormPlot(prev => ({ ...prev, measurement_unit_id: unitsData[0].id }));
        setBulkCreate(prev => ({ ...prev, measurement_unit_id: unitsData[0].id }));
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
    if (activeTab === "layouts") {
      fetchLayoutsPage();
    }
  }, [activeTab, layoutPage, debouncedSearch, filterLayProject, filterLayType, filterLayStatus, laySortBy, laySortDir]);

  useEffect(() => {
    if (activeTab === "plots") {
      fetchPlotsPage();
    }
  }, [activeTab, plotPage, debouncedSearch, filterPlotStatus, filterPlotFacing, filterPlotCorner, filterPlotLayoutId, filterPlotRoadWidth, filterPlotMinArea, filterPlotMaxArea, plotSortBy, plotSortDir]);

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
    if (onAuditLogged) {
      onAuditLogged({
        id: `LocalAudit-${Date.now()}`,
        action,
        entity_name: model,
        entity_id: modelId,
        details: summary,
        created_at: new Date().toISOString()
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

      // Safe packing of Survey numbers and other extra fields into approval_number text field to survive schema restrictions
      const packedStr = packApprovalNumber(
        formLay.approval_number,
        formLay.survey_number,
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
        total_area_unit_id: formLay.total_area_unit_id || formLay.measurement_unit_id || null,
        measurement_unit_id: formLay.measurement_unit_id || null,
        status: formLay.status
      };

      if (editId) {
        const res = await api.updateLayout(editId, payload);
        displaySuccess(`Layout plan '${res.name}' specification modified!`);
        dispatchAuditLog("LAYOUT_UPDATE", "layouts", res.id, `Updated metrics and layouts state config for Phase: ${res.code}`);
      } else {
        const res = await api.createLayout(payload);
        displaySuccess(`New Layout Phase register '${res.name}' created!`);
        dispatchAuditLog("LAYOUT_CREATE", "layouts", res.id, `Created New Layout subdivisions zone: ${res.name} (${res.code})`);
      }
      setCurrModal(null);
      await loadData();
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
        const res = await api.updatePlot(editId, payload);
        displaySuccess(`Plot [${res.plot_number}] details updated!`);
        dispatchAuditLog("PLOT_UPDATE", "plots", res.id, `Updated individual Plot metrics for Plot No: ${res.plot_number}`);
        if (selectedPlot?.id === editId) setSelectedPlot(res);
      } else {
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
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden" id="inventory-manager-container">
      {/* 2B Workspace Navigation & Tab Control */}
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4" id="inv-header">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Grid className="w-5 h-5 text-indigo-600" />
            <span>Inventory Management Core (BhoomiOne ERP)</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Maintain physical land holdings, development zones, and custom-attributed plots</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-200/50 p-1 rounded-xl w-full lg:w-auto border border-slate-200/60" id="inv-tabs-group">
          <button
            onClick={() => { setActiveTab("projects"); setErrorMess(null); }}
            className={`flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "projects" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
            id="tab-projects"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Projects ({projects.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab("layouts"); setErrorMess(null); }}
            disabled={!hasLayView}
            className={`flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              !hasLayView ? "opacity-40" : ""
            } ${activeTab === "layouts" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
            id="tab-layouts"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Layouts ({layouts.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab("plots"); setErrorMess(null); }}
            disabled={!hasPlotView || !enabledFeatures.includes("plot_grid_view")}
            className={`flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              (!hasPlotView || !enabledFeatures.includes("plot_grid_view")) ? "opacity-45 cursor-not-allowed" : ""
            } ${activeTab === "plots" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
            id="tab-plots"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Plots ({plots.length}){!enabledFeatures.includes("plot_grid_view") && " 🔒"}</span>
          </button>
          {hasLayView && enabledFeatures.includes("gis_maps") && (
            <button
              onClick={() => { setActiveTab("viewer"); setErrorMess(null); }}
              className={`flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "viewer" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
              id="tab-viewer"
            >
              <Compass className="w-3.5 h-3.5 text-rose-500" />
              <span>Interactive Map</span>
            </button>
          )}
          {hasDxfView && enabledFeatures.includes("dxf_import") && (
            <button
              onClick={() => { setActiveTab("cad"); setErrorMess(null); }}
              className={`flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "cad" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
              id="tab-cad"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>CAD Imports</span>
            </button>
          )}
          {enabledFeatures.includes("marketplace_publish") && (
            <button
              onClick={() => { setActiveTab("marketplace"); setErrorMess(null); }}
              className={`flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "marketplace" ? "bg-white text-indigo-700 border border-indigo-200 shadow-xs font-bold" : "text-slate-500 hover:text-slate-900"
              }`}
              id="tab-marketplace"
            >
              <Grid className="w-3.5 h-3.5 text-indigo-650" />
              <span>Marketplace & Leads</span>
            </button>
          )}
          <button
            onClick={() => { setActiveTab("commercial"); setErrorMess(null); }}
            className={`flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "commercial" ? "bg-white text-emerald-700 border border-emerald-200 shadow-xs font-bold" : "text-slate-500 hover:text-slate-900"
            }`}
            id="tab-commercial"
          >
            <Percent className="w-3.5 h-3.5 text-emerald-600" />
            <span>Commercial</span>
          </button>
        </div>
      </div>

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

      {/* Two-Column split Workspace (Main List Ledger & Technical Spec drawer) */}
      {activeTab !== "cad" && activeTab !== "viewer" && activeTab !== "marketplace" && activeTab !== "commercial" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 p-6" id="inv-main-workspace">
        
        {/* LEFT COMPONENT - GRID & ACTIONS LEDGER */}
        <div className="xl:col-span-8 space-y-6">

          {/* 1. PROJECTS TABPANEL */}
          {activeTab === "projects" && (
            <div className="space-y-4" id="projects-view-panel">
              {/* Controls and Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Projects Master Ledger</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Multi-tenant approved construction projects directory</p>
                </div>
                {hasProjManage && (
                  <button
                    id="btn-new-project"
                    onClick={() => { setEditId(null); setFormProj({ name: "", code: "", developer_name: "", location: "", status: "PLANNING", rera_number: "", approval_status: "PENDING", approval_authority: "", launch_date: "", possession_target_date: "", approvals_metadata: "{}", project_type: "RESIDENTIAL", state: "", description: "", village: "", taluk: "", district: "", country: "INDIA", pincode: "", latitude: "", longitude: "" }); setCurrModal("create_project"); }}
                    className="inline-flex items-center gap-1 bg-indigo-600 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-white stroke-[3px]" />
                    <span>+ New Project</span>
                  </button>
                )}
              </div>

              {/* Filtering Suite */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Location Filter</label>
                  <select
                    value={filterProjLocation}
                    onChange={(e) => { setFilterProjLocation(e.target.value); setProjectPage(1); }}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All Locations</option>
                    {Array.from(new Set(lookupProjects.map(p => p.location))).filter(Boolean).map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Approval status</label>
                  <select
                    value={filterProjAppr}
                    onChange={(e) => { setFilterProjAppr(e.target.value); setProjectPage(1); }}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All Approvals</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
                  <select
                    value={filterProjStatus}
                    onChange={(e) => { setFilterProjStatus(e.target.value); setProjectPage(1); }}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PLANNING">PLANNING</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              {/* Ledger Grid */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
                <table className="w-full text-left text-xs text-slate-500">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Project Name</th>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">RERA No.</th>
                      <th className="px-4 py-3 text-center">Approval</th>
                      <th className="px-4 py-3 text-center">Layouts</th>
                      <th className="px-4 py-3 text-center">Plots</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mb-1" />
                            <span className="font-semibold text-xs text-slate-700">Loading cataloged projects...</span>
                            <span className="text-[10px] text-slate-400">Querying database engine records</span>
                          </div>
                        </td>
                      </tr>
                    ) : errorMess && projects.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-rose-600">
                          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                          <span className="font-bold text-xs block mb-1">Failed to query project database</span>
                          <span className="text-[10px] text-slate-500 max-w-sm mx-auto block leading-normal px-4 mb-3">{errorMess}</span>
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
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <span>No projects cataloged matching the selected parameters.</span>
                        </td>
                      </tr>
                    ) : (
                      displayProj.map((p) => {
                        const nestedLays = getLayoutsForProject(p.id);
                        const nestedPlts = getPlotsForProject(p.id);
                        return (
                          <tr
                            key={p.id}
                            className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${selectedProject?.id === p.id ? "bg-slate-55/70" : ""}`}
                            onClick={() => setSelectedProject(p)}
                          >
                            <td className="px-4 py-3.5 font-semibold text-slate-900">{p.name}</td>
                            <td className="px-4 py-3.5 font-mono font-bold text-indigo-600">{p.code}</td>
                            <td className="px-4 py-3.5">{p.location}</td>
                            <td className="px-4 py-3.5 font-mono text-[11px] font-medium">{p.rera_number || "N/A"}</td>
                            <td className="px-4 py-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold inline-block border ${
                                p.approval_status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                p.approval_status === "REJECTED" ? "bg-rose-50 text-rose-700 border-rose-100" :
                                "bg-amber-50 text-amber-700 border-amber-100"
                              }`}>
                                {p.approval_status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center font-bold text-slate-700">{nestedLays.length}</td>
                            <td className="px-4 py-3.5 text-center font-bold text-slate-700">{nestedPlts.length}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                p.status === "ACTIVE" ? "bg-emerald-50 text-emerald-800 border-emerald-100" :
                                p.status === "PLANNING" ? "bg-blue-50 text-blue-800 border-blue-100" :
                                "bg-slate-100 text-slate-600 border-slate-200"
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleStartEditProject(p)}
                                  className="p-1 text-slate-400 hover:text-slate-900 transition-colors"
                                  title="Edit properties"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                {p.status === "ARCHIVED" ? (
                                  <button
                                    onClick={() => handleRestoreProject(p.id)}
                                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                    title="Restore Project"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleArchiveProject(p.id, p.status)}
                                    className="p-1 text-slate-400 hover:text-amber-600 transition-colors"
                                    title="Archive Project"
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDuplicateProject(p.id)}
                                  className="p-1 text-slate-400 hover:text-teal-600 transition-colors"
                                  title="Duplicate Project"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProject(p.id, p.code)}
                                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
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
          {activeTab === "layouts" && (
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
                      setFormLay({
                        project_id: lookupProjects[0]?.id || "",
                        name: "",
                        code: "",
                        layout_type: "RESIDENTIAL",
                        approval_number: "",
                        survey_number: "",
                        approval_date: "",
                        total_area_value: "",
                        total_area_unit_id: units[0]?.id || "",
                        measurement_unit_id: units[0]?.id || "",
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

              {/* Filtering suite */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Project filter</label>
                  <select
                    value={filterLayProject}
                    onChange={(e) => { setFilterLayProject(e.target.value); setLayoutPage(1); }}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none"
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
            </div>
          )}

          {/* 3. PLOTS TABPANEL */}
          {activeTab === "plots" && (
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
                      {lookupLayouts.map(l => (
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
          )}

        </div>

        {/* RIGHT COMPONENT - SPECIFICATION DRAWER INSPECTOR */}
        <div className="xl:col-span-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 shadow-xs space-y-5" id="inv-specs-inspector">
          
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
            <Info className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Dynamic Technical Inspector</h4>
          </div>

          {/* PROJECT DETAIL SCREEN */}
          {activeTab === "projects" && selectedProject ? (
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
                <div className="space-y-4" id="project-inspector">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase">{selectedProject.code}</span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedProject.name}</h3>
                    </div>
                    <button onClick={() => setSelectedProject(null)} className="text-[10px] text-indigo-600 hover:underline">Clear</button>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3 text-xs">
                    <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Basic Information</p>
                    <div className="space-y-1 text-[11px]">
                      <p className="flex justify-between"><span>Developer Name:</span> <span className="font-semibold text-slate-800">{selectedProject.developer_name}</span></p>
                      <p className="flex justify-between"><span>Location Matrix:</span> <span className="font-semibold text-slate-800">{selectedProject.location}</span></p>
                      <p className="flex justify-between"><span>Active Status:</span> <span className="font-semibold text-slate-800">{selectedProject.status}</span></p>
                    </div>

                    <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 pt-1">Location Details</p>
                    <div className="space-y-1 text-[11px]">
                      <p className="flex justify-between"><span>Village:</span> <span className="font-semibold text-slate-800">{village}</span></p>
                      <p className="flex justify-between"><span>Taluk:</span> <span className="font-semibold text-slate-800">{taluk}</span></p>
                      <p className="flex justify-between"><span>District:</span> <span className="font-semibold text-slate-800">{district}</span></p>
                      <p className="flex justify-between"><span>Country:</span> <span className="font-semibold text-slate-800">{country}</span></p>
                      <p className="flex justify-between"><span>PIN Code:</span> <span className="font-semibold text-slate-800">{pincode}</span></p>
                      <p className="flex justify-between"><span>Coordinates:</span> <span className="font-mono font-semibold text-indigo-600">{latitude}, {longitude}</span></p>
                    </div>

                    <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 pt-1">Description</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed italic bg-slate-50 p-2 rounded-lg border border-slate-100">{projectDesc}</p>

                    <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 pt-1">Approval Information</p>
                    <div className="space-y-1 text-[11px] font-sans">
                      <p className="flex justify-between"><span>RERA Registration:</span> <span className="font-medium text-slate-800">{selectedProject.rera_number || "PENDING"}</span></p>
                      <p className="flex justify-between"><span>Regulatory Status:</span> <span className="font-medium text-slate-850">{selectedProject.approval_status}</span></p>
                      <p className="flex justify-between"><span>Approval Authority:</span> <span className="font-medium text-slate-800">{selectedProject.approval_authority || "N/A"}</span></p>
                      <p className="flex justify-between"><span>Launch date:</span> <span className="font-medium text-slate-800">{selectedProject.launch_date ? selectedProject.launch_date.split("T")[0] : "N/A"}</span></p>
                      <p className="flex justify-between"><span>Possession target:</span> <span className="font-medium text-slate-800">{selectedProject.possession_target_date ? selectedProject.possession_target_date.split("T")[0] : "N/A"}</span></p>
                    </div>

                    <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 pt-1">Chronology</p>
                    <div className="space-y-1 text-[11px]">
                      <p className="flex justify-between"><span>Created Date:</span> <span className="font-mono text-slate-600">{formattedCreated}</span></p>
                      <p className="flex justify-between"><span>Last Updated:</span> <span className="font-mono text-slate-600">{formattedUpdated}</span></p>
                      <p className="flex justify-between"><span>Created By:</span> <span className="font-medium text-slate-700">System Admin</span></p>
                    </div>

                <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 pt-1">Sub layout subdivisions summary</p>
                <div className="space-y-2 max-h-32 overflow-y-auto pt-1">
                  {getLayoutsForProject(selectedProject.id).length === 0 ? (
                    <p className="text-[10px] text-slate-400 text-center">No layouts attached yet.</p>
                  ) : (
                    getLayoutsForProject(selectedProject.id).map(l => (
                      <div key={l.id} className="bg-slate-50 p-1.5 rounded border border-slate-150 text-[10.5px] flex justify-between items-center">
                        <span className="font-semibold text-slate-800">[{l.code}] {l.name}</span>
                        <span className="text-slate-400 font-mono text-[9px]">{getPlotsForLayout(l.id).length} plots</span>
                      </div>
                    ))
                  )}
                </div>

                <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 pt-1">Individual Plots Aggregate</p>
                <div className="grid grid-cols-2 gap-2 text-center pt-1 font-mono text-[10.5px]">
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-1 rounded">
                    <p className="font-bold text-[11px]">{getPlotsForProject(selectedProject.id).filter(p => p.status === "AVAILABLE").length}</p>
                    <p className="text-[8px] uppercase font-sans">Available</p>
                  </div>
                  <div className="bg-amber-50 text-amber-800 border border-amber-100 p-1 rounded">
                    <p className="font-bold text-[11px]">{getPlotsForProject(selectedProject.id).filter(p => p.status === "RESERVED").length}</p>
                    <p className="text-[8px] uppercase font-sans">Reserved</p>
                  </div>
                </div>
              </div>
            </div>
              );
            })()
          ) : activeTab === "layouts" && selectedLayout ? (
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
                  </div>
                </div>
              );
            })()
          ) : activeTab === "plots" && selectedPlot ? (
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
            <div className="py-12 text-center text-slate-400 space-y-2" id="empty-inspector">
              <Info className="w-7 h-7 text-slate-300 mx-auto" />
              <div>
                <p className="font-semibold text-slate-500 text-[11px]">Inspector Panel Offline</p>
                <p className="text-[10px] leading-normal max-w-xs mx-auto">Click on any record row in the Left inventory charts to load specs dynamic inspectors.</p>
              </div>
            </div>
          )}

        </div>

      </div>
      )}

      {/* Interactive Layout Map tab workspace */}
      {activeTab === "viewer" && (
        <div className="p-0">
          <MapWorkspaceIndex
            initialLayoutId={selectedLayout?.id || null}
          />
        </div>
      )}

      {/* CAD Imports Full Workspace Integration */}
      {activeTab === "cad" && (
        <div className="p-6">
          <CADImportManager 
            user={user}
            lookupProjects={lookupProjects}
            lookupLayouts={lookupLayouts}
            displaySuccess={(msg) => setSuccessMess(msg)}
            displayError={(msg) => setErrorMess(msg)}
          />
        </div>
      )}

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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Standard Measurement Unit ID</label>
                  <select value={formLay.measurement_unit_id} onChange={(e) => setFormLay({ ...formLay, measurement_unit_id: e.target.value, total_area_unit_id: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                    ))}
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
                <button type="button" onClick={() => setCurrModal(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50">Cancel</button>
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
                      <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
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
                      <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
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

    </div>
  );
}
