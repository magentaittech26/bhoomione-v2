import React, { useState, useEffect } from "react";
import api from "../lib/api.ts";
import { UserProfile } from "../types/auth.ts";
import { CADImportManager } from "./CADImportManager.tsx";
import InteractiveLayoutViewer from "./InteractiveLayoutViewer.tsx";
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
  Activity
} from "lucide-react";

interface InventoryManagerProps {
  user: UserProfile;
  onAuditLogged?: (log: any) => void;
}

export default function InventoryManager({ user, onAuditLogged }: InventoryManagerProps) {
  const [activeTab, setActiveTab] = useState<"projects" | "layouts" | "plots" | "cad" | "viewer">("projects");
  
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
  const [errorMess, setErrorMess] = useState<string | null>(null);
  const [successMess, setSuccessMess] = useState<string | null>(null);

  // Inspection Drawer Focus
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<any | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<any | null>(null);

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

  // Selectable row IDs for bulk actions
  const [selectedPlotIds, setSelectedPlotIds] = useState<string[]>([]);

  // Modals & Forms states
  const [currModal, setCurrModal] = useState<string | null>(null); // "create_project", "edit_project", "create_layout", "edit_layout", "create_plot", "edit_plot", "bulk_create_plots", "bulk_update_plots", "bulk_status_plots"
  const [editId, setEditId] = useState<string | null>(null);

  // Form Fields
  const [formProj, setFormProj] = useState({
    name: "", code: "", developer_name: "", location: "", status: "PLANNING",
    rera_number: "", approval_status: "PENDING", approval_authority: "",
    launch_date: "", possession_target_date: "", approvals_metadata: "{}"
  });

  const [formLay, setFormLay] = useState({
    project_id: "", name: "", code: "", layout_type: "RESIDENTIAL",
    approval_number: "", approval_date: "", total_area_value: "",
    total_area_unit_id: "", measurement_unit_id: "", status: "DRAFT"
  });

  const [formPlot, setFormPlot] = useState({
    layout_id: "", plot_number: "", area_value: "", measurement_unit_id: "",
    length: "", width: "", road_width: "", corner_plot: false,
    facing: "NORTH", dimensions: "", dimensions_metadata: "{}", status: "AVAILABLE"
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

  // Permissions validation
  const hasProjView = user.permissions?.includes("projects.view") || false;
  const hasProjManage = user.permissions?.includes("projects.manage") || false;
  const hasLayView = user.permissions?.includes("layouts.view") || false;
  const hasLayManage = user.permissions?.includes("layouts.manage") || false;
  const hasPlotView = user.permissions?.includes("plots.view") || false;
  const hasPlotManage = user.permissions?.includes("plots.manage") || false;
  const hasDxfView = user.permissions?.includes("dxf.view") || false;

  // Measurement Units reference caching helper
  const getUnitCode = (unitId: string) => {
    const matched = units.find(u => u.id === unitId);
    return matched ? matched.code : "SQFT";
  };

  // Safe JSON conversion wrapper
  const tryParseJSON = (str: string, fallback: any = {}) => {
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  };

  // Dynamic seeding flag check from backend server environments (Sprints 1 and 2 check)
  const [isSeeding, setIsSeeding] = useState(false);

  const loadLookups = async () => {
    try {
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
  }, [activeTab, plotPage, debouncedSearch, filterPlotStatus, filterPlotFacing, filterPlotCorner, filterPlotRoadWidth, filterPlotMinArea, filterPlotMaxArea, plotSortBy, plotSortDir]);

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
  
  // 1. Projects Actions
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMess(null);
    try {
      const parsedMetadata = tryParseJSON(formProj.approvals_metadata);
      const payload = {
        ...formProj,
        approvals_metadata: parsedMetadata,
        rera_number: formProj.rera_number || null,
        approval_authority: formProj.approval_authority || null,
        launch_date: formProj.launch_date || null,
        possession_target_date: formProj.possession_target_date || null,
      };

      if (editId) {
        const res = await api.updateProject(editId, payload);
        displaySuccess(`Project [${res.code}] updated successfully!`);
        dispatchAuditLog("PROJECT_UPDATE", "projects", res.id, `Modified Project Specifications for ${res.name}`);
      } else {
        const res = await api.createProject(payload);
        displaySuccess(`New Project [${res.code}] created successfully!`);
        dispatchAuditLog("PROJECT_CREATE", "projects", res.id, `Created New Real estate Project registry: ${res.name}`);
      }
      setCurrModal(null);
      await loadData();
    } catch (err: any) {
      setErrorMess(err.message || "Failed to submit project schema validation.");
    }
  };

  const handleStartEditProject = (p: any) => {
    setEditId(p.id);
    setFormProj({
      name: p.name,
      code: p.code,
      developer_name: p.developer_name,
      location: p.location,
      status: p.status,
      rera_number: p.rera_number || "",
      approval_status: p.approval_status || "PENDING",
      approval_authority: p.approval_authority || "",
      launch_date: p.launch_date ? p.launch_date.split("T")[0] : "",
      possession_target_date: p.possession_target_date ? p.possession_target_date.split("T")[0] : "",
      approvals_metadata: JSON.stringify(p.approvals_metadata || {}, null, 2)
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

  // 2. Layouts Actions
  const handleSaveLayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMess(null);
    try {
      const payload = {
        ...formLay,
        total_area_value: formLay.total_area_value ? Number(formLay.total_area_value) : null,
        approval_date: formLay.approval_date || null,
        approval_number: formLay.approval_number || null,
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
    setFormLay({
      project_id: l.project_id,
      name: l.name,
      code: l.code,
      layout_type: l.layout_type,
      approval_number: l.approval_number || "",
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

  // 3. Single Plot Actions
  const handleSavePlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMess(null);
    try {
      const parsedDimMeta = tryParseJSON(formPlot.dimensions_metadata);
      const payload = {
        ...formPlot,
        area_value: Number(formPlot.area_value),
        length: formPlot.length ? Number(formPlot.length) : null,
        width: formPlot.width ? Number(formPlot.width) : null,
        road_width: formPlot.road_width ? Number(formPlot.road_width) : 0,
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
      dimensions_metadata: JSON.stringify(pl.dimensions_metadata || {}, null, 2),
      status: pl.status || "AVAILABLE"
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

  // --- EXTENSIBLE ATTRIBUTES CONTROLS ---
  // Users toggle custom plot parameters dynamically, mapped to the plot's JSON metadata
  const handleToggleExtAttribute = async (key: string, currentValue: boolean) => {
    if (!selectedPlot) return;
    setErrorMess(null);
    try {
      const currentAttributes = selectedPlot.dimensions_metadata?.plot_attributes || {};
      const updatedAttributes = {
        ...currentAttributes,
        [key]: !currentValue
      };

      const updatedMeta = {
        ...(selectedPlot.dimensions_metadata || {}),
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
      const currentAttributes = selectedPlot.dimensions_metadata?.plot_attributes || {};
      const updatedAttributes = {
        ...currentAttributes,
        [newKey.trim()]: true
      };

      const updatedMeta = {
        ...(selectedPlot.dimensions_metadata || {}),
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
            disabled={!hasPlotView}
            className={`flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              !hasPlotView ? "opacity-40" : ""
            } ${activeTab === "plots" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
            id="tab-plots"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Plots ({plots.length})</span>
          </button>
          {hasLayView && (
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
          {hasDxfView && (
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
      {activeTab !== "cad" && activeTab !== "viewer" && (
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
                    onClick={() => { setEditId(null); setFormProj({ name: "", code: "", developer_name: "", location: "", status: "PLANNING", rera_number: "", approval_status: "PENDING", approval_authority: "", launch_date: "", possession_target_date: "", approvals_metadata: "{}" }); setCurrModal("create_project"); }}
                    className="inline-flex items-center gap-1 bg-indigo-650 text-white font-semibold text-xs px-3 py-2 rounded-xl hover:bg-indigo-750 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Project</span>
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
                    onClick={() => { setEditId(null); setFormLay(prev => ({ ...prev, name: "", code: "", layout_type: "RESIDENTIAL", approval_number: "", approval_date: "", total_area_value: "", status: "DRAFT" })); setCurrModal("create_layout"); }}
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
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Zoning Type</th>
                      <th className="px-4 py-3 text-center">Unit</th>
                      <th className="px-4 py-3 text-right">Total Area</th>
                      <th className="px-4 py-3 text-center">Plot Count</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {displayLay.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <span>No layouts cataloged matching search filters.</span>
                        </td>
                      </tr>
                    ) : (
                      displayLay.map((l) => {
                        const plotsInLay = getPlotsForLayout(l.id);
                        return (
                          <tr
                            key={l.id}
                            className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${selectedLayout?.id === l.id ? "bg-slate-55/70" : ""}`}
                            onClick={() => setSelectedLayout(l)}
                          >
                            <td className="px-4 py-3.5">
                              <p className="font-semibold text-slate-900">{l.name}</p>
                              <p className="text-[10px] text-slate-400">Proj: {l.project_name || l.project?.name || "N/A"}</p>
                            </td>
                            <td className="px-4 py-3.5 font-mono font-semibold text-indigo-600">{l.code}</td>
                            <td className="px-4 py-3.5 text-slate-700 font-semibold text-[11px]">{l.layout_type}</td>
                            <td className="px-4 py-3.5 text-center font-mono font-medium">{getUnitCode(l.measurement_unit_id)}</td>
                            <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-800">
                              {l.total_area_value ? Number(l.total_area_value).toLocaleString() : "N/A"}
                            </td>
                            <td className="px-4 py-3.5 text-center font-bold text-slate-700">{plotsInLay.length}</td>
                            <td className="px-4 py-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                l.status === "LAUNCHED" ? "bg-emerald-50 text-emerald-800 border-emerald-100" :
                                l.status === "APPROVED" ? "bg-blue-50 text-blue-800 border-blue-100" :
                                "bg-slate-100 text-slate-600 border-slate-200"
                              }`}>
                                {l.status}
                              </span>
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
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLayout(l.id, l.code)}
                                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
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
                      onClick={() => { setEditId(null); setFormPlot(prev => ({ ...prev, plot_number: "", area_value: "", length: "", width: "", road_width: "", corner_plot: false, dimensions: "", status: "AVAILABLE" })); setCurrModal("create_plot"); }}
                      className="inline-flex items-center gap-1 bg-indigo-650 text-white font-semibold text-xs px-3 py-2 rounded-xl hover:bg-indigo-750 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Single Plot</span>
                    </button>
                  </div>
                )}
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

              {/* Data Table List of Plots */}
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

                <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 pt-1">Approval Information</p>
                <div className="space-y-1 text-[11px] font-sans">
                  <p className="flex justify-between"><span>RERA Registration:</span> <span className="font-medium text-slate-800">{selectedProject.rera_number || "PENDING"}</span></p>
                  <p className="flex justify-between"><span>Regulatory Status:</span> <span className="font-medium text-slate-850">{selectedProject.approval_status}</span></p>
                  <p className="flex justify-between"><span>Approval Authority:</span> <span className="font-medium text-slate-800">{selectedProject.approval_authority || "N/A"}</span></p>
                  <p className="flex justify-between"><span>Launch date:</span> <span className="font-medium text-slate-800">{selectedProject.launch_date ? selectedProject.launch_date.split("T")[0] : "N/A"}</span></p>
                  <p className="flex justify-between"><span>Possession target:</span> <span className="font-medium text-slate-800">{selectedProject.possession_target_date ? selectedProject.possession_target_date.split("T")[0] : "N/A"}</span></p>
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
          ) : activeTab === "layouts" && selectedLayout ? (
            <div className="space-y-4" id="layout-inspector">
              <div className="flex justify-between items-start">
                <div>
                  <span className="bg-amber-50 border border-amber-150 text-amber-800 font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase">{selectedLayout.layout_type}</span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedLayout.name}</h3>
                </div>
                <button onClick={() => setSelectedLayout(null)} className="text-[10px] text-indigo-600 hover:underline">Clear</button>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3.5 text-xs">
                <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Layout Information</p>
                <div className="space-y-1.5 text-[11px]">
                  <p className="flex justify-between"><span>Phase Code:</span> <span className="font-mono font-bold text-slate-900">{selectedLayout.code}</span></p>
                  <p className="flex justify-between"><span>Parent Projects:</span> <span className="font-semibold text-slate-800">{selectedLayout.project_name || selectedLayout.project?.name || "N/A"}</span></p>
                  <p className="flex justify-between"><span>Approval reference:</span> <span className="font-mono font-medium text-slate-850">{selectedLayout.approval_number || "REQUIRING REGISTRATION"}</span></p>
                  <p className="flex justify-between"><span>Approval validation:</span> <span className="font-semibold text-slate-800">{selectedLayout.approval_date ? selectedLayout.approval_date.split("T")[0] : "N/A"}</span></p>
                  <p className="flex justify-between"><span>Lifecycle State:</span> <span className="font-bold font-mono text-indigo-700">{selectedLayout.status}</span></p>
                </div>

                <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Area Information</p>
                <div className="space-y-1.5 text-[11px]">
                  <p className="flex justify-between"><span>Allocated Size:</span> <span className="font-mono font-bold text-slate-950">{selectedLayout.total_area_value ? Number(selectedLayout.total_area_value).toLocaleString() : "UNDEFINED"} {getUnitCode(selectedLayout.measurement_unit_id)}</span></p>
                  <p className="flex justify-between"><span>Standard unit:</span> <span className="font-medium text-slate-800 font-mono">{getUnitCode(selectedLayout.measurement_unit_id)}</span></p>
                </div>

                <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Zoned Plots directory</p>
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
                </div>

                <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">Extensible Custom attributes</p>
                
                {/* Visual Custom Attributes Tags list parsed dynamically */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(selectedPlot.dimensions_metadata?.plot_attributes || {}).map(([key, value]) => {
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
                  {Object.keys(selectedPlot.dimensions_metadata?.plot_attributes || {}).length === 0 && (
                    <p className="text-[10px] text-slate-400 block w-full text-center py-1">No custom tags registered.</p>
                  )}
                </div>

                {/* Predefined custom attributes triggers */}
                {hasPlotManage && (
                  <div className="border-t border-slate-100 pt-2.5 space-y-2">
                    <p className="text-[9.5px] font-bold text-slate-400 block">Predefined Attributes Toggles:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["Park Facing", "Clubhouse Facing", "Lake Facing", "Sea Facing", "Premium Plot"].map((attr) => {
                        const isSet = !!selectedPlot.dimensions_metadata?.plot_attributes?.[attr];
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
        <div className="p-6">
          <InteractiveLayoutViewer
            user={user}
            initialLayoutId={selectedLayout?.id || null}
            onAuditLogged={onAuditLogged}
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

      {/* ============================================================ */}
      {/* DIALOG AND POPUPS ENGINE                                      */}
      // Mapped dynamic overlays
      {`============================================================`}
      
      {/* 1. Project modal overlay (Create/Edit) */}
      {currModal === "create_project" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Catalog New Real estate Project</h4>
            <form onSubmit={handleSaveProject} className="space-y-3 test-xs text-left">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Project Name *</label>
                <input required type="text" value={formProj.name} onChange={(e) => setFormProj({ ...formProj, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Project Code *</label>
                  <input required type="text" value={formProj.code} onChange={(e) => setFormProj({ ...formProj, code: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Developer Name *</label>
                  <input required type="text" value={formProj.developer_name} onChange={(e) => setFormProj({ ...formProj, developer_name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Location *</label>
                <input required type="text" value={formProj.location} onChange={(e) => setFormProj({ ...formProj, location: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">RERA Validation No.</label>
                  <input type="text" value={formProj.rera_number} onChange={(e) => setFormProj({ ...formProj, rera_number: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approval Status</label>
                  <select value={formProj.approval_status} onChange={(e) => setFormProj({ ...formProj, approval_status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approval Authority / Agency</label>
                <input type="text" value={formProj.approval_authority} onChange={(e) => setFormProj({ ...formProj, approval_authority: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Launch Date</label>
                  <input type="date" value={formProj.launch_date} onChange={(e) => setFormProj({ ...formProj, launch_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Possession Target Date</label>
                  <input type="date" value={formProj.possession_target_date} onChange={(e) => setFormProj({ ...formProj, possession_target_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-3">
                <button type="button" onClick={() => setCurrModal(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold">Save Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {currModal === "edit_project" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Edit Project Specifications</h4>
            <form onSubmit={handleSaveProject} className="space-y-3.5 test-xs text-left">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Project Name *</label>
                <input required type="text" value={formProj.name} onChange={(e) => setFormProj({ ...formProj, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Project Code (ReadOnly)</label>
                  <input disabled type="text" value={formProj.code} className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-400" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Developer Name *</label>
                  <input required type="text" value={formProj.developer_name} onChange={(e) => setFormProj({ ...formProj, developer_name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Location *</label>
                <input required type="text" value={formProj.location} onChange={(e) => setFormProj({ ...formProj, location: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">RERA Validation No.</label>
                  <input type="text" value={formProj.rera_number} onChange={(e) => setFormProj({ ...formProj, rera_number: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Project status</label>
                  <select value={formProj.status} onChange={(e) => setFormProj({ ...formProj, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
                    <option value="PLANNING">PLANNING</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approval Status</label>
                  <select value={formProj.approval_status} onChange={(e) => setFormProj({ ...formProj, approval_status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approval Authority</label>
                  <input type="text" value={formProj.approval_authority} onChange={(e) => setFormProj({ ...formProj, approval_authority: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Launch Date</label>
                  <input type="date" value={formProj.launch_date} onChange={(e) => setFormProj({ ...formProj, launch_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Possession Target</label>
                  <input type="date" value={formProj.possession_target_date} onChange={(e) => setFormProj({ ...formProj, possession_target_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-3">
                <button type="button" onClick={() => setCurrModal(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-semibold">Save Changes</button>
              </div>
            </form>
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
                  <input type="text" value={formLay.approval_number} onChange={(e) => setFormLay({ ...formLay, approval_number: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Authority Approval Date</label>
                  <input type="date" value={formLay.approval_date} onChange={(e) => setFormLay({ ...formLay, approval_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Area Value *</label>
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

    </div>
  );
}
