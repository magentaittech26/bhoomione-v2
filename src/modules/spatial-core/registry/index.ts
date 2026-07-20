import { BhoomiModuleDefinition } from "../contracts/module.ts";
import { WorkspaceTool } from "../../../components/MapWorkspace/types.ts";

export class BhoomiModuleRegistry {
  private static instance: BhoomiModuleRegistry | null = null;
  private modules: Map<string, BhoomiModuleDefinition> = new Map();
  
  // Simulated entitlement database, replaceable by backend response
  private tenantEntitlements: Set<string> = new Set([
    "maps.workspace",
    "maps.boundary",
    "maps.roads",
    "maps.parks",
    "maps.amenities",
    "maps.utilities",
    "maps.plots"
  ]);

  // Current active disabled/enabled status overrides for interactive SaaS simulation
  private disabledModules: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): BhoomiModuleRegistry {
    if (!BhoomiModuleRegistry.instance) {
      BhoomiModuleRegistry.instance = new BhoomiModuleRegistry();
    }
    return BhoomiModuleRegistry.instance;
  }

  /**
   * Reset registry (mainly for testing)
   */
  public reset(): void {
    this.modules.clear();
    this.disabledModules.clear();
  }

  /**
   * Register a module, validate its dependencies, and ensure no duplicates
   */
  public register(module: BhoomiModuleDefinition): void {
    if (this.modules.has(module.id)) {
      throw new Error(`Module with ID "${module.id}" is already registered.`);
    }

    // Check for duplicate code
    for (const registered of this.modules.values()) {
      if (registered.code === module.code) {
        throw new Error(`Module with duplicate code "${module.code}" cannot be registered.`);
      }
    }

    // Validate static dependencies
    for (const dep of module.dependencies) {
      // Core workspace is built-in; for other deps, if they are registered we can verify
      if (dep !== "maps.workspace" && !Array.from(this.modules.values()).some(m => m.entitlementKey === dep)) {
        console.warn(`Module "${module.name}" has unresolved dependency: "${dep}"`);
      }
    }

    this.modules.set(module.id, module);
    if (module.lifecycleHooks?.onRegister) {
      module.lifecycleHooks.onRegister();
    }
  }

  /**
   * Get all registered modules
   */
  public getAllModules(): BhoomiModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  /**
   * Set tenant entitlements (Laravel backend integration)
   */
  public setEntitlements(keys: string[]): void {
    this.tenantEntitlements = new Set(keys);
  }

  /**
   * Expose tenant entitlements
   */
  public getEntitlements(): string[] {
    return Array.from(this.tenantEntitlements);
  }

  public addEntitlement(key: string): void {
    this.tenantEntitlements.add(key);
  }

  public removeEntitlement(key: string): void {
    this.tenantEntitlements.delete(key);
  }

  /**
   * Check if the tenant owns/has license for a specific entitlement key
   */
  public hasEntitlement(key: string): boolean {
    return this.tenantEntitlements.has(key);
  }

  /**
   * Enable/Disable a module manually (SaaS administration simulation)
   */
  public setModuleEnabled(id: string, enabled: boolean): void {
    const mod = this.modules.get(id);
    if (!mod) return;

    if (enabled) {
      if (this.disabledModules.has(id)) {
        this.disabledModules.delete(id);
        if (mod.lifecycleHooks?.onEnable) {
          mod.lifecycleHooks.onEnable();
        }
      }
    } else {
      if (!this.disabledModules.has(id)) {
        this.disabledModules.add(id);
        if (mod.lifecycleHooks?.onDisable) {
          mod.lifecycleHooks.onDisable();
        }
      }
    }
  }

  /**
   * Check if a module is licensed (has tenant entitlement) and currently enabled
   */
  public isModuleActive(id: string): boolean {
    let mod = this.modules.get(id);
    if (!mod && !id.startsWith("mod-")) {
      mod = this.modules.get("mod-" + id);
    }
    if (!mod) return false;

    // A module is active if the tenant has entitlement and it hasn't been disabled
    const hasLicense = this.hasEntitlement(mod.entitlementKey);
    const isNotDisabled = !this.disabledModules.has(id);
    
    // Check dependencies are also active
    if (hasLicense && isNotDisabled) {
      for (const dep of mod.dependencies) {
        if (dep === "maps.workspace") continue;
        const depMod = Array.from(this.modules.values()).find(m => m.entitlementKey === dep);
        if (depMod && !this.isModuleActive(depMod.id)) {
          return false; // Dependency missing or inactive
        }
      }
      return true;
    }
    return false;
  }

  /**
   * Check if module has entitlement but is disabled
   */
  public isModuleDisabled(id: string): boolean {
    return this.disabledModules.has(id);
  }

  /**
   * Expose registered layers for all active modules
   */
  public getActiveLayers(): string[] {
    const layers: string[] = [];
    for (const mod of this.modules.values()) {
      if (this.isModuleActive(mod.id) && mod.layerDefinitions) {
        layers.push(...mod.layerDefinitions);
      }
    }
    return layers;
  }

  /**
   * Expose registered toolbar tools for all active modules
   */
  public getActiveToolbarTools(): WorkspaceTool[] {
    const tools: WorkspaceTool[] = [];
    for (const mod of this.modules.values()) {
      if (this.isModuleActive(mod.id) && mod.toolbarTools) {
        tools.push(...mod.toolbarTools);
      }
    }
    return tools;
  }

  /**
   * Expose registered validators for all active modules
   */
  public getActiveValidators(): string[] {
    const rules: string[] = [];
    for (const mod of this.modules.values()) {
      if (this.isModuleActive(mod.id) && mod.validationRules) {
        rules.push(...mod.validationRules);
      }
    }
    return rules;
  }

  /**
   * Expose registered search providers
   */
  public getActiveSearchProviders(): string[] {
    const providers: string[] = [];
    for (const mod of this.modules.values()) {
      if (this.isModuleActive(mod.id) && mod.searchProviders) {
        providers.push(...mod.searchProviders);
      }
    }
    return providers;
  }

  /**
   * Expose active serializers
   */
  public getActiveSerializers(): string[] {
    const serializers: string[] = [];
    for (const mod of this.modules.values()) {
      if (this.isModuleActive(mod.id) && mod.serializers) {
        serializers.push(...mod.serializers);
      }
    }
    return serializers;
  }

  /**
   * Expose active inspectors
   */
  public getActiveInspectorPanels(): string[] {
    const panels: string[] = [];
    for (const mod of this.modules.values()) {
      if (this.isModuleActive(mod.id) && mod.inspectorPanels) {
        panels.push(...mod.inspectorPanels);
      }
    }
    return panels;
  }
}
