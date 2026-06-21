import React, { useState, useEffect } from "react";
import { 
  UploadCloud, 
  FileCode2, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Activity, 
  Save, 
  Bookmark, 
  Building2, 
  AlertCircle, 
  Check, 
  Trash2, 
  Play, 
  Search,
  FileSpreadsheet,
  Copy
} from "lucide-react";
import { api } from "../lib/api.ts";
import { UserProfile } from "../types/auth.ts";

interface CADImportManagerProps {
  user: UserProfile;
  lookupProjects: any[];
  lookupLayouts: any[];
  displaySuccess: (msg: string) => void;
  displayError: (msg: string) => void;
}

export const CADImportManager: React.FC<CADImportManagerProps> = ({
  user,
  lookupProjects,
  lookupLayouts,
  displaySuccess,
  displayError
}) => {
  // DXF State Hooks
  const [dxfFiles, setDxfFiles] = useState<any[]>([]);
  const [importJobs, setImportJobs] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Form State Hooks
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedLayoutId, setSelectedLayoutId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Active selected entities for mapping and logs review
  const [activeDxfFile, setActiveDxfFile] = useState<any | null>(null);
  const [activeJob, setActiveJob] = useState<any | null>(null);
  const [activeLogs, setActiveLogs] = useState<any[]>([]);
  
  // Layer mappings state: layer_name -> layer_type
  const [currentMappings, setCurrentMappings] = useState<Record<string, string>>({});
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const hasDxfUpload = user.permissions?.includes("dxf.upload") || false;
  const hasDxfProcess = user.permissions?.includes("dxf.process") || false;

  useEffect(() => {
    loadDxfData();
  }, []);

  useEffect(() => {
    if (lookupProjects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(lookupProjects[0].id);
    }
  }, [lookupProjects]);

  const loadDxfData = async () => {
    setLoading(true);
    try {
      const filesRes = await api.fetchDxfFiles();
      setDxfFiles(filesRes);

      const jobsRes = await api.fetchDxfJobs();
      setImportJobs(jobsRes);

      const templatesRes = await api.fetchDxfTemplates();
      setTemplates(templatesRes);
    } catch (err: any) {
      console.error(err);
      displayError(err.message || "Failed to load DXF pipeline registries.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith(".dxf")) {
        displayError("Strict CAD Validation Error: Only standard ASCII DXF vector drawings can be accepted.");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadDxf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      displayError("Must choose a valid DXF drawing layout to upload.");
      return;
    }
    if (!selectedProjectId) {
      displayError("Must designate a parent Project context.");
      return;
    }

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("project_id", selectedProjectId);
      if (selectedLayoutId) {
        formData.append("layout_id", selectedLayoutId);
      }
      formData.append("dxf_file", selectedFile);

      const response = await api.uploadDxfFile(formData);
      displaySuccess(`DXF Cad ${response.dxf_file.file_name} successfully uploaded and queued!`);
      
      setSelectedFile(null);
      
      // Auto register first active view models
      setActiveDxfFile(response.dxf_file);
      await loadDxfData();
      
      // Select newly created job
      if (response.import_job) {
        handleSelectJob(response.import_job.id);
      }
    } catch (err: any) {
      console.error(err);
      displayError(err.message || "DXF upload aborted. Please check project mapping validations.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSelectJob = async (jobId: string) => {
    try {
      const jobDetail = await api.fetchDxfJobDetail(jobId);
      setActiveJob(jobDetail);
      setActiveLogs(jobDetail.logs || []);
      
      if (jobDetail.dxf_file) {
        setActiveDxfFile(jobDetail.dxf_file);
        
        // Populate layer mappings inputs based on discover list, prioritizing database mappings
        const layers = jobDetail.extracted_metadata?.layers || [];
        const initialMappings: Record<string, string> = {};
        layers.forEach((layer: any) => {
          const dbMap = (jobDetail.layer_mappings || []).find((m: any) => m.layer_name === layer.name);
          initialMappings[layer.name] = dbMap?.layer_type || layer.assigned_type || layer.suggested_type || "IGNORE";
        });
        setCurrentMappings(initialMappings);
      }
    } catch (err: any) {
      console.error(err);
      displayError("Failed to fetch granular job audit records.");
    }
  };

  const handleApplyTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tempId = e.target.value;
    setSelectedTemplateId(tempId);
    if (!tempId) return;

    const t = templates.find((item) => item.id === tempId);
    if (t && t.mappings) {
      const newMappings = { ...currentMappings };
      Object.keys(newMappings).forEach((key) => {
        if (t.mappings[key]) {
          newMappings[key] = t.mappings[key];
        }
      });
      setCurrentMappings(newMappings);
      displaySuccess(`Applied mapping preset template: "${t.name}"`);
    }
  };

  const handleLayerTypeChange = (layerName: string, type: string) => {
    setCurrentMappings(prev => ({
      ...prev,
      [layerName]: type
    }));
  };

  const handleSaveLayerMappings = async () => {
    if (!activeDxfFile) {
      displayError("No CAD Drawing context selected.");
      return;
    }

    setLoading(true);
    try {
      const mappingsList = Object.entries(currentMappings).map(([name, type]) => ({
        layer_name: name,
        layer_type: type
      }));

      await api.saveDxfMappings(activeDxfFile.id, mappingsList);
      displaySuccess("Discovered layer taxonomies updated and committed.");
      
      if (activeJob) {
        await handleSelectJob(activeJob.id);
      }
    } catch (err: any) {
      console.error(err);
      displayError("Layer mapping submission failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      displayError("Please provide a name for your custom templates mapping.");
      return;
    }

    setLoading(true);
    try {
      await api.storeDxfTemplate(templateName, currentMappings);
      displaySuccess(`Reusable template "${templateName}" registered successfully!`);
      setTemplateName("");
      // Reload template directories list
      const templatesRes = await api.fetchDxfTemplates();
      setTemplates(templatesRes);
    } catch (err: any) {
      console.error(err);
      displayError("Template creation aborted: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplateId) {
      displayError("Please choose a saved mapping template to delete.");
      return;
    }
    const target = templates.find((t) => t.id === selectedTemplateId);
    if (!target) return;

    if (!window.confirm(`Are you sure you want to permanently delete template "${target.name}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await api.deleteDxfTemplate(selectedTemplateId);
      displaySuccess(`Mapping preset template "${target.name}" deleted.`);
      setSelectedTemplateId("");
      const templatesRes = await api.fetchDxfTemplates();
      setTemplates(templatesRes);
    } catch (err: any) {
      console.error(err);
      displayError("Template deletion failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloneTemplate = async () => {
    if (!selectedTemplateId) {
      displayError("Please select an existing template definition to clone.");
      return;
    }
    const target = templates.find((t) => t.id === selectedTemplateId);
    if (!target) return;

    const copyName = window.prompt(`Enter a name for the cloned template:`, `Copy of ${target.name}`);
    if (!copyName || !copyName.trim()) return;

    setLoading(true);
    try {
      await api.storeDxfTemplate(copyName.trim(), target.mappings);
      displaySuccess(`Preset template successfully cloned under name "${copyName.trim()}"!`);
      const templatesRes = await api.fetchDxfTemplates();
      setTemplates(templatesRes);
    } catch (err: any) {
      console.error(err);
      displayError("Clonification aborted: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndProcess = async () => {
    if (!activeDxfFile) return;

    // Direct check mappings are saved or assigned
    const hasMappedAtLeastOne = Object.values(currentMappings).some(val => val !== "IGNORE");
    if (!hasMappedAtLeastOne) {
      displayError("Aborted. At least one layer must be classified as a primary target type (e.g., PLOT, ROAD) to initiate validation.");
      return;
    }

    setProcessingId(activeDxfFile.id);
    try {
      // Step 1: Save mappings first
      const mappingsList = Object.entries(currentMappings).map(([name, type]) => ({
        layer_name: name,
        layer_type: type
      }));
      await api.saveDxfMappings(activeDxfFile.id, mappingsList);

      // Step 2: Trigger approve
      const response = await api.approveDxfMappings(activeDxfFile.id);
      displaySuccess(response.message || "CAD Model mappings verified under dry-run check!");
      
      if (activeJob) {
        await handleSelectJob(activeJob.id);
      }
      await loadDxfData();
    } catch (err: any) {
      console.error(err);
      displayError("Approval sequence failed: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6" id="cad-import-root">
      
      {/* Scope Disclaimer Banner */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex gap-3 text-slate-600 shadow-sm" id="cad-disclaimer">
        <AlertCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-slate-800 block uppercase tracking-wider text-[10px] mb-1">Sprint 3A CAD Import Core Boundaries</span>
          <p className="leading-relaxed">
            This module represents the **DXF Import Foundation Layer**. It handles secure binary uploading, SHA-256 data versioning, asynchronous queue emulation, layer taxonomy classifications, and audit logs. No SVG geometry rendering, GIS displays, or automated plot inventory generation is performed during this phase.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="cad-main-grid">
        
        {/* LEFT PANEL: UPLOAD AND REGISTRY CHANNELS (6 cols) */}
        <div className="xl:col-span-5 space-y-6" id="cad-left-panel">
          
          {/* UPLOAD FORM */}
          {hasDxfUpload && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5" id="cad-upload-container">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-indigo-650" />
                <span>Upload New CAD Layout drawing</span>
              </h3>

              <form onSubmit={handleUploadDxf} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Parent Project Context *</label>
                  <select 
                    value={selectedProjectId} 
                    onChange={(e) => setSelectedProjectId(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                    required
                  >
                    {lookupProjects.map(p => (
                      <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subdivision Layout (Optional)</label>
                  <select 
                    value={selectedLayoutId} 
                    onChange={(e) => setSelectedLayoutId(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                  >
                    <option value="">No Layout Allocation Context</option>
                    {lookupLayouts
                      .filter(l => l.project_id === selectedProjectId)
                      .map(l => (
                        <option key={l.id} value={l.id}>[{l.code}] {l.name}</option>
                      ))}
                  </select>
                </div>

                {/* Dropzone field */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">ASCII DXF Cad Blueprint Drawing *</label>
                  <div className="border border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer relative transition-all">
                    <input 
                      type="file" 
                      accept=".dxf" 
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="dxf-file-input"
                    />
                    <FileCode2 className={`w-8 h-8 mb-2 ${selectedFile ? "text-indigo-600 animate-pulse" : "text-slate-400"}`} />
                    {selectedFile ? (
                      <div className="text-xs">
                        <p className="font-semibold text-slate-900 line-clamp-1">{selectedFile.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{(selectedFile.size / 1024).toFixed(1)} KB — Ready to analyze</p>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500">
                        <p className="font-medium text-slate-700">Drag or click to choose layout DXF file</p>
                        <p className="mt-0.5">Only standard vector geometries can be parsed</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploadLoading || !selectedFile}
                  className={`w-full text-center py-2.5 px-4 rounded-lg text-xs font-semibold text-white cursor-pointer transition-all ${
                    uploadLoading || !selectedFile 
                      ? "bg-slate-300 cursor-not-allowed" 
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                  }`}
                >
                  {uploadLoading ? "Reading header and transmitting streams..." : "Upload DXF to parser pipeline"}
                </button>
              </form>
            </div>
          )}

          {/* DXF FILES REGISTRY */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5" id="cad-registry-container">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>CAD Files Catalog ({dxfFiles.length})</span>
              <Activity className="w-3.5 h-3.5 text-slate-400" />
            </h3>

            {loading ? (
              <div className="text-center py-10 text-xs text-slate-400">Querying secure storage pools...</div>
            ) : dxfFiles.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 border border-dashed border-slate-100 rounded-lg bg-slate-50/50">
                No CAD drawings currently uploaded under this Workspace.
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1" id="dxf-files-list">
                {dxfFiles.map((file) => {
                  const hasActiveJob = importJobs.find(j => j.dxf_file_id === file.id);
                  const status = hasActiveJob?.status || "uploaded";
                  
                  return (
                    <div 
                      key={file.id}
                      onClick={() => {
                        if (hasActiveJob) {
                          handleSelectJob(hasActiveJob.id);
                        }
                      }}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        activeDxfFile?.id === file.id 
                          ? "border-indigo-400 bg-indigo-50/30" 
                          : "border-slate-100 bg-slate-50/30 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex gap-2">
                          <FileCode2 className="w-4 h-4 text-indigo-650 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-slate-800 line-clamp-1">{file.file_name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Size: {(file.file_size / 1024).toFixed(1)} KB · Version {file.version}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                              Project: {file.project?.name || "Allocation In Progress"}
                            </p>
                          </div>
                        </div>

                        {/* Status Label */}
                        <div className="flex-shrink-0">
                          {status === "completed" && (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Ready</span>
                            </span>
                          )}
                          {status === "processing" && (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase animate-pulse">
                              <Activity className="w-2.5 h-2.5" />
                              <span>Parsing</span>
                            </span>
                          )}
                          {status === "failed" && (
                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">
                              <XCircle className="w-2.5 h-2.5" />
                              <span>Failed</span>
                            </span>
                          )}
                          {status === "uploaded" && (
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">
                              <span>Uploaded</span>
                            </span>
                          )}
                          {status === "queued" && (
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">
                              <span>Queued</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT PANEL: METADATA, MAPPINGS & TRACKING LOGS (7 cols) */}
        <div className="xl:col-span-7 space-y-6" id="cad-right-panel">
          
          {activeDxfFile ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 space-y-6" id="cad-active-review">
              
              {/* Header Title Information */}
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between" id="cad-review-header">
                <div>
                  <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Discovered Layout Draft
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 mt-1 line-clamp-1">{activeDxfFile.file_name}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Secure ID: {activeDxfFile.id}</p>
                </div>
                
                {hasDxfProcess && activeJob?.status === "completed" && (
                  <button
                    onClick={handleApproveAndProcess}
                    disabled={processingId === activeDxfFile.id}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer shadow-sm transition-all"
                  >
                    <Play className="w-3 h-3" />
                    <span>{processingId === activeDxfFile.id ? "Processing Approvals..." : "Approve CAD Layout Design"}</span>
                  </button>
                )}
              </div>

              {/* Real-time Validation Rules alerts panel */}
              {(() => {
                const mappedTypes = Object.values(currentMappings);
                const hasPlot = mappedTypes.includes("PLOT");
                const hasRoad = mappedTypes.includes("ROAD");
                const boundaryMatches = mappedTypes.filter(t => t === "BOUNDARY").length;
                
                const warnings: string[] = [];
                if (!hasPlot) {
                  warnings.push("No Plot Layer mapped: Plots cannot be extracted without at least one PLOT layer boundary.");
                }
                if (!hasRoad) {
                  warnings.push("No Road Layer mapped: A circulation network is highly recommended for subdivision zoning.");
                }
                if (boundaryMatches > 1) {
                  warnings.push("Duplicate Boundaries mapped: Multiple layers are designated as BOUNDARY. Only one primary outer frame is permitted.");
                }

                if (warnings.length === 0) return null;

                return (
                  <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3.5 text-xs text-amber-850 space-y-1.5" id="validation-warnings-alerts">
                    <div className="font-bold uppercase text-[9px] tracking-wider text-amber-850 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Layer Studio Validation Checks</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800">
                      {warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                );
              })()}

              {/* Grid split showing Extracted Metadata Summary & Templates Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2" id="cad-meta-split">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">CAD Vector Extents</span>
                  <div className="space-y-1.5 text-slate-600 font-mono text-[10px]">
                    <div className="flex justify-between">
                      <span>Spatial entities count:</span>
                      <span className="font-bold text-slate-800">{activeJob?.total_entities_found || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bounding Min Bounds (X, Y):</span>
                      <span className="font-bold text-slate-800">
                        ({activeJob?.extracted_metadata?.extents?.min?.x || 0}, {activeJob?.extracted_metadata?.extents?.min?.y || 0})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bounding Max Bounds (X, Y):</span>
                      <span className="font-bold text-slate-800">
                        ({activeJob?.extracted_metadata?.extents?.max?.x || 1000}, {activeJob?.extracted_metadata?.extents?.max?.y || 800})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Template Management settings</span>
                    <div className="flex gap-2 items-center">
                      <select 
                        onChange={handleApplyTemplate} 
                        value={selectedTemplateId}
                        className="flex-1 bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none"
                      >
                        <option value="">-- Or Choose Presaved Survey Presets --</option>
                        {templates.map((temp) => (
                          <option key={temp.id} value={temp.id}>{temp.name}</option>
                        ))}
                      </select>
                      
                      {selectedTemplateId && (
                        <>
                          <button
                            type="button"
                            onClick={handleCloneTemplate}
                            className="bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 rounded-lg p-1.5 flex items-center justify-center cursor-pointer transition-all"
                            title="Clone selected preset"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={handleDeleteTemplate}
                            className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg p-1.5 flex items-center justify-center cursor-pointer transition-all"
                            title="Delete template permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-400 leading-normal mt-2 italic">
                    Applying preset templates pre-fills matching vector layers into PLOT, ROAD, etc. configurations.
                  </p>
                </div>
              </div>

              {/* LAYER DISCOVERY AND TAXONOMY MAPPING FORM */}
              <div className="space-y-4" id="cad-layer-mappings-stage">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-650" />
                    <span>Layer Review Screen & Classification taxonomic</span>
                  </h4>
                  
                  <span className="text-[11px] text-slate-500 font-mono font-medium">
                    {Object.keys(currentMappings).length} drawing layers found
                  </span>
                </div>

                <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                        <th className="py-2.5 px-4 w-[28%]">CAD Layer name</th>
                        <th className="py-2.5 px-4 text-center w-[10%]">Count</th>
                        <th className="py-2.5 px-4 w-[20%]">Suggested Type</th>
                        <th className="py-2.5 px-4 w-[12%]">Confidence</th>
                        <th className="py-2.5 px-4 w-[18%]">User Mapping</th>
                        <th className="py-2.5 px-4 w-[12%]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(activeJob?.extracted_metadata?.layers || []).map((layer: any) => {
                        const selectedType = currentMappings[layer.name] || "IGNORE";
                        const suggestedType = layer.suggested_type || "UNKNOWN";
                        const confidenceScore = typeof layer.confidence_score === "number" ? layer.confidence_score : 0;
                        
                        // Heuristic formatting
                        let typeBadgeClass = "text-slate-500 bg-slate-50 border-slate-150";
                        if (suggestedType === "PLOT") typeBadgeClass = "text-blue-700 bg-blue-50 border-blue-150";
                        if (suggestedType === "ROAD") typeBadgeClass = "text-amber-800 bg-amber-50 border-amber-150";
                        if (suggestedType === "AMENITY") typeBadgeClass = "text-emerald-700 bg-emerald-50 border-emerald-150";
                        if (suggestedType === "UTILITY") typeBadgeClass = "text-cyan-700 bg-cyan-50 border-cyan-150";
                        if (suggestedType === "BOUNDARY") typeBadgeClass = "text-purple-750 bg-purple-50 border-purple-150";

                        // Confidence color
                        const barColor = confidenceScore >= 85 ? "bg-emerald-500" : (confidenceScore > 0 ? "bg-amber-450 bg-[#eab308]" : "bg-slate-200");

                        // Row validation
                        let rowValidationLabel = "Valid Map";
                        let rowValidationColor = "text-emerald-700 bg-emerald-50 border-emerald-100";

                        if (selectedType === "IGNORE") {
                          if (suggestedType !== "UNKNOWN") {
                            rowValidationLabel = "Miss Suggest";
                            rowValidationColor = "text-amber-700 bg-amber-50 border-amber-100";
                          } else {
                            rowValidationLabel = "Skipped";
                            rowValidationColor = "text-slate-400 bg-slate-50/50 border-slate-100";
                          }
                        } else if (selectedType === "BOUNDARY") {
                          const boundaryMatches = Object.values(currentMappings).filter(t => t === "BOUNDARY").length;
                          if (boundaryMatches > 1) {
                            rowValidationLabel = "Duplicate";
                            rowValidationColor = "text-rose-600 bg-rose-50 border-rose-100";
                          }
                        }

                        return (
                          <tr key={layer.name} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4 font-mono text-[11px] text-slate-800 font-medium truncate max-w-[120px]" title={layer.name}>
                              {layer.name}
                            </td>
                            <td className="py-2.5 px-4 text-center text-slate-500 font-mono text-[11px]">
                              {layer.entity_count || layer.object_count || 0}
                            </td>
                            <td className="py-2.5 px-4">
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${typeBadgeClass}`}>
                                {suggestedType}
                              </span>
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex flex-col gap-1 w-full max-w-[50px]">
                                <span className="font-mono text-[9px] font-semibold text-slate-600">{confidenceScore}%</span>
                                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full ${barColor}`} style={{ width: `${confidenceScore}%` }}></div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-4">
                              <select
                                value={selectedType}
                                onChange={(e) => handleLayerTypeChange(layer.name, e.target.value)}
                                className="bg-white border border-slate-200 rounded p-1 text-[11px] text-slate-705 focus:outline-none w-full"
                              >
                                <option value="IGNORE">IGNORE (Skip)</option>
                                <option value="PLOT">PLOT (Zoning parcels)</option>
                                <option value="ROAD">ROAD (Circulation network)</option>
                                <option value="AMENITY">AMENITY (Green open zones)</option>
                                <option value="UTILITY">UTILITY (Services grid)</option>
                                <option value="BOUNDARY">BOUNDARY (Subdivision frame)</option>
                              </select>
                            </td>
                            <td className="py-2.5 px-4">
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold border ${rowValidationColor}`}>
                                {rowValidationLabel}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mapping Actions bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100" id="mappings-save-preservation">
                  
                  {/* Template creation wrapper */}
                  <form onSubmit={handleSaveAsTemplate} className="flex gap-2 w-full sm:w-auto">
                    <input 
                      type="text" 
                      placeholder="Save mapping as Template name..." 
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none w-full sm:w-56"
                    />
                    <button
                      type="submit"
                      className="bg-slate-850 hover:bg-slate-900 text-white rounded-lg p-1.5 flex items-center justify-center cursor-pointer transition-all flex-shrink-0 bg-slate-800"
                      title="Save as re-usable CAD Template mapping"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  <button
                    onClick={handleSaveLayerMappings}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ml-auto transition-all w-full sm:w-auto"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Commit Mapped taxonomy layer settings</span>
                  </button>

                </div>
              </div>

              {/* DETAILED DIAGNOSTIC LOG PROGRESS (Job progress logs) */}
              <div className="space-y-3 pt-2" id="cad-diagnostic-milestones">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Audit logs & processing pipelines
                </h4>

                <div className="bg-slate-900 text-slate-350 rounded-xl p-4 font-mono text-[11px] space-y-2 h-[220px] overflow-y-auto" id="diagnostic-screen">
                  {activeLogs.length === 0 ? (
                    <div className="text-slate-500 text-center py-10 italic">Initializing diagnostic metrics...</div>
                  ) : (
                    activeLogs.map((log) => {
                      const levelColor = log.log_level === "ERROR" ? "text-rose-400" : (log.log_level === "WARNING" ? "text-amber-300" : "text-emerald-400");
                      return (
                        <div key={log.id} className="flex items-start gap-2 border-b border-slate-800 pb-1.5 last:border-0 leading-normal">
                          <span className={`${levelColor} font-bold text-[9px] uppercase px-1 bg-slate-800 rounded font-sans tracking-wide mt-0.5`}>
                            {log.log_level}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                              <span className="font-bold text-slate-200">[{log.step_name}]</span>
                              <span>{log.duration_ms ? `+${log.duration_ms}ms` : ""}</span>
                            </div>
                            <p className="text-slate-300">{log.message}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-12 text-center flex flex-col items-center justify-center" id="cad-registry-empty">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mb-3 animate-bounce" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Analyze a CAD Blueprint Layout</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Choose or upload a CAD layout drawing (.dxf) from the left catalog to perform automatic parsing, layer identification, and category taxonomy mappings.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
