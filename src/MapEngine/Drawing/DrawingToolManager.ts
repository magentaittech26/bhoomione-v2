import { MockGeometry, WorkspaceTool } from "../../components/MapWorkspace/types.ts";
import { GeometryLayer, GeometryObject } from "../Contracts/models.ts";

/**
 * Define the comprehensive workspace tool list requested.
 */
export type AppTool =
  | "select"
  | "pan"
  | "boundary"
  | "road"
  | "plot"
  | "park"
  | "amenity"
  | "utility"
  | "label"
  | "measure";

/**
 * Command interface representing the classic Command Pattern for layout history.
 */
export interface Command {
  id: string;
  name: string;
  timestamp: Date;
  execute(): void;
  undo(): void;
}

/**
 * Tool configuration registry interface.
 */
export interface ToolDescriptor {
  id: AppTool;
  name: string;
  category: "NAVIGATION" | "VECTOR" | "ANALYTICS";
  shortcutKey: string; // Keyboard key trigger e.g. "v" for Select, "h" for Pan, etc.
  cursor: string;      // CSS cursor e.g. "default", "grab", "crosshair"
  description: string;
}

/**
 * Prepared Interfaces for upcoming features (Drawing & Measurement).
 * Signatures declared clearly to support next phases without full implementation.
 */
export interface IPolygonDrawingSession {
  points: Array<[number, number]>;
  layerId: string;
  addPoint(pt: [number, number]): void;
  closeAndComplete(): void;
  cancel(): void;
}

export interface IPolylineDrawingSession {
  points: Array<[number, number]>;
  layerId: string;
  addPoint(pt: [number, number]): void;
  complete(): void;
  cancel(): void;
}

export interface ILabelPlacementSession {
  coordinate: [number, number];
  text: string;
  layerId: string;
  place(text: string, pt: [number, number]): void;
}

export interface IMeasurementSession {
  startPoint: [number, number] | null;
  endPoint: [number, number] | null;
  calculatedDistance: number; // in meters
  reset(): void;
}

/**
 * Professional, high-fidelity Drawing Engine Foundation containing
 * Tool Registry, Switching, Cursor states, Selection/Hover bindings, Undo/Redo queues,
 * and Keyboard Shortcut Managers.
 */
export class DrawingToolManager {
  private toolRegistry: Map<AppTool, ToolDescriptor> = new Map();
  private activeTool: AppTool = "select";
  private previousTool: AppTool | null = null;
  private isSpacePanActive: boolean = false;

  // History Stack Manager
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private historyLimit: number = 50;

  // Selection & Hover Manager
  private selectedObjectId: string | null = null;
  private hoveredObjectId: string | null = null;

  // Listeners for state change events
  private toolChangeListeners: Array<(tool: AppTool) => void> = [];
  private selectionListeners: Array<(id: string | null) => void> = [];
  private hoverListeners: Array<(id: string | null) => void> = [];
  private historyChangeListeners: Array<(undoCount: number, redoCount: number) => void> = [];
  private logListeners: Array<(log: string) => void> = [];

  constructor() {
    this.registerDefaultTools();
  }

  /**
   * Registers the 10 core tools with their metadata.
   */
  private registerDefaultTools(): void {
    const tools: ToolDescriptor[] = [
      { id: "select", name: "Selection Cursor", category: "NAVIGATION", shortcutKey: "v", cursor: "default", description: "Select layout features and edit custom metadata properties." },
      { id: "pan", name: "Hand Panning Tool", category: "NAVIGATION", shortcutKey: "h", cursor: "grab", description: "Hold and drag to pan infinite viewport. Spacebar hotkey override supported." },
      { id: "boundary", name: "Boundary Limit Tool", category: "VECTOR", shortcutKey: "b", cursor: "crosshair", description: "Vector tool prepared for laying out primary site parcel boundaries." },
      { id: "road", name: "Road Alignments Tool", category: "VECTOR", shortcutKey: "r", cursor: "crosshair", description: "Vector line drawer prepared for drawing roadways and links." },
      { id: "plot", name: "Subdivided Plot Tool", category: "VECTOR", shortcutKey: "p", cursor: "crosshair", description: "Standard subdivision tool prepared for plotting residential parcels." },
      { id: "park", name: "Parks & Green Zone Tool", category: "VECTOR", shortcutKey: "g", cursor: "crosshair", description: "Zoning tool prepared for creating municipal park boundaries." },
      { id: "amenity", name: "Community Amenity Tool", category: "VECTOR", shortcutKey: "a", cursor: "crosshair", description: "Zoning tool prepared for civic amenity layout placements." },
      { id: "utility", name: "Utility Line Alignment Tool", category: "VECTOR", shortcutKey: "u", cursor: "crosshair", description: "Linear overlay drawer prepared for water and electric lines." },
      { id: "label", name: "Geometric Text Label", category: "VECTOR", shortcutKey: "l", cursor: "text", description: "Text placement cursor prepared for inserting map titles and tags." },
      { id: "measure", name: "CAD Scale Measure", category: "ANALYTICS", shortcutKey: "m", cursor: "cell", description: "CAD ruler tool prepared for calculating high-precision path lengths." }
    ];

    tools.forEach((tool) => this.toolRegistry.set(tool.id, tool));
  }

  /**
   * Retrieves all registered tool descriptors.
   */
  public getRegisteredTools(): ToolDescriptor[] {
    return Array.from(this.toolRegistry.values());
  }

  /**
   * Safe getter for current active tool.
   */
  public getActiveTool(): AppTool {
    return this.activeTool;
  }

  /**
   * Switches active tool, dispatches activation events and updates canvas cursors.
   */
  public switchTool(toolId: AppTool): void {
    if (!this.toolRegistry.has(toolId)) {
      console.warn(`DrawingToolManager: Attempted to switch to unregistered tool "${toolId}".`);
      return;
    }

    if (this.activeTool === toolId) return;

    this.previousTool = this.activeTool;
    this.activeTool = toolId;

    this.notifyToolChange();
    this.notifyLog(`Active tool switched to [${this.toolRegistry.get(toolId)?.name}].`);
  }

  /**
   * Gets cursor styling mapping for current tool (respecting spacebar panning override).
   */
  public getActiveCursor(): string {
    if (this.isSpacePanActive) {
      return "grabbing";
    }
    const descriptor = this.toolRegistry.get(this.activeTool);
    return descriptor ? descriptor.cursor : "default";
  }

  /**
   * Temporarily overrides current cursor to Hand Pan mode on Space keydown.
   */
  public activateSpacePan(): void {
    if (this.isSpacePanActive) return;
    this.isSpacePanActive = true;
    this.notifyToolChange();
    this.notifyLog("Spacebar Panning override activated.");
  }

  /**
   * Restores preceding tool once spacebar is released.
   */
  public deactivateSpacePan(): void {
    if (!this.isSpacePanActive) return;
    this.isSpacePanActive = false;
    this.notifyToolChange();
    this.notifyLog("Spacebar Panning override deactivated. Restored tool cursor.");
  }

  /**
   * Custom Selection Hook.
   */
  public setSelectedObjectId(id: string | null): void {
    if (this.selectedObjectId === id) return;
    this.selectedObjectId = id;
    this.selectionListeners.forEach((l) => l(id));
  }

  public getSelectedObjectId(): string | null {
    return this.selectedObjectId;
  }

  /**
   * Custom Hover Hook.
   */
  public setHoveredObjectId(id: string | null): void {
    if (this.hoveredObjectId === id) return;
    this.hoveredObjectId = id;
    this.hoverListeners.forEach((l) => l(id));
  }

  public getHoveredObjectId(): string | null {
    return this.hoveredObjectId;
  }

  /**
   * Command stack execution engine.
   */
  public executeCommand(command: Command): void {
    try {
      command.execute();
      this.undoStack.push(command);
      // Empty redo stack on new command executions
      this.redoStack = [];

      // Prune history stack if limits breached
      if (this.undoStack.length > this.historyLimit) {
        this.undoStack.shift();
      }

      this.notifyHistoryChange();
      this.notifyLog(`Executed action: "${command.name}"`);
    } catch (err) {
      console.error(`DrawingToolManager: Error executing command ${command.name}`, err);
    }
  }

  /**
   * Standard undo step.
   */
  public undo(): void {
    const cmd = this.undoStack.pop();
    if (!cmd) {
      this.notifyLog("Undo stack is empty. No operations to revert.");
      return;
    }
    try {
      cmd.undo();
      this.redoStack.push(cmd);
      this.notifyHistoryChange();
      this.notifyLog(`Reverted action: "${cmd.name}"`);
    } catch (err) {
      console.error(`DrawingToolManager: Error reverting command ${cmd.name}`, err);
    }
  }

  /**
   * Standard redo step.
   */
  public redo(): void {
    const cmd = this.redoStack.pop();
    if (!cmd) {
      this.notifyLog("Redo stack is empty. No operations to reapply.");
      return;
    }
    try {
      cmd.execute();
      this.undoStack.push(cmd);
      this.notifyHistoryChange();
      this.notifyLog(`Reapplied action: "${cmd.name}"`);
    } catch (err) {
      console.error(`DrawingToolManager: Error reapplying command ${cmd.name}`, err);
    }
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Clears the history stacks.
   */
  public clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.notifyHistoryChange();
  }

  /**
   * Event subscriptions bindings.
   */
  public onToolChange(listener: (tool: AppTool) => void): () => void {
    this.toolChangeListeners.push(listener);
    return () => {
      this.toolChangeListeners = this.toolChangeListeners.filter((l) => l !== listener);
    };
  }

  public onSelectionChange(listener: (id: string | null) => void): () => void {
    this.selectionListeners.push(listener);
    return () => {
      this.selectionListeners = this.selectionListeners.filter((l) => l !== listener);
    };
  }

  public onHoverChange(listener: (id: string | null) => void): () => void {
    this.hoverListeners.push(listener);
    return () => {
      this.hoverListeners = this.hoverListeners.filter((l) => l !== listener);
    };
  }

  public onHistoryChange(listener: (undoCount: number, redoCount: number) => void): () => void {
    this.historyChangeListeners.push(listener);
    return () => {
      this.historyChangeListeners = this.historyChangeListeners.filter((l) => l !== listener);
    };
  }

  public onLogMessage(listener: (log: string) => void): () => void {
    this.logListeners.push(listener);
    return () => {
      this.logListeners = this.logListeners.filter((l) => l !== listener);
    };
  }

  private notifyToolChange(): void {
    this.toolChangeListeners.forEach((l) => l(this.activeTool));
  }

  private notifyHistoryChange(): void {
    this.historyChangeListeners.forEach((l) => l(this.undoStack.length, this.redoStack.length));
  }

  private notifyLog(msg: string): void {
    this.logListeners.forEach((l) => l(msg));
  }
}

/**
 * Sample concrete command pattern to mock/demonstrate Delete features.
 */
export class DeleteObjectCommand implements Command {
  public id: string;
  public timestamp: Date;
  
  constructor(
    private targetObject: MockGeometry,
    private objectsList: MockGeometry[],
    private setObjectsList: (objs: MockGeometry[]) => void,
    private onSelectedObjectReset: () => void
  ) {
    this.id = `cmd-delete-${targetObject.id}-${Date.now()}`;
    this.timestamp = new Date();
  }

  public get name(): string {
    return `Delete [${this.targetObject.layerName}] ${this.targetObject.name}`;
  }

  public execute(): void {
    const updated = this.objectsList.filter((obj) => obj.id !== this.targetObject.id);
    this.setObjectsList(updated);
    this.onSelectedObjectReset();
  }

  public undo(): void {
    const restored = [...this.objectsList, this.targetObject];
    this.setObjectsList(restored);
  }
}

/**
 * Concrete command pattern for metadata property alterations.
 */
export class UpdatePropertiesCommand implements Command {
  public id: string;
  public timestamp: Date;

  constructor(
    private targetId: string,
    private oldProperties: any,
    private newProperties: any,
    private objectsList: MockGeometry[],
    private setObjectsList: (objs: MockGeometry[]) => void,
    private reselectObject: (obj: MockGeometry) => void
  ) {
    this.id = `cmd-update-${targetId}-${Date.now()}`;
    this.timestamp = new Date();
  }

  public get name(): string {
    return `Update Metadata Properties for element id: ${this.targetId}`;
  }

  public execute(): void {
    const updated = this.objectsList.map((obj) => {
      if (obj.id === this.targetId) {
        const altered = { ...obj, properties: { ...obj.properties, ...this.newProperties } };
        setTimeout(() => this.reselectObject(altered), 0);
        return altered;
      }
      return obj;
    });
    this.setObjectsList(updated);
  }

  public undo(): void {
    const updated = this.objectsList.map((obj) => {
      if (obj.id === this.targetId) {
        const altered = { ...obj, properties: { ...obj.properties, ...this.oldProperties } };
        setTimeout(() => this.reselectObject(altered), 0);
        return altered;
      }
      return obj;
    });
    this.setObjectsList(updated);
  }
}
