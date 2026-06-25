# BhoomiOne Documentation Inventory

This document represents the comprehensive audit of the accumulated documentation, blueprints, reports, specs, and verification matrices inside the BhoomiOne project. 

---

## 1. Document Inventory & Mapping

| File Name | Current Location | Category | Purpose | Duplicate/Superseded | Recommended Location |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `BHOOMIONE-V2-ARCHITECTURAL-MANDATES.md` | `/` | Core Architecture | Architecture standards & technical stack constraints | Active Source of Truth | `/docs/01_Architecture/SYSTEM_ARCHITECTURE.md` |
| `BHOOMIONE-V2-ARCHITECTURE-AUDIT.md` | `/` | Audits | Compliance audit of V2 codebase | Active Audit | `/docs/10_Audits/BHOOMIONE-V2-ARCHITECTURE-AUDIT.md` |
| `BHOOMIONE-V2-INFRASTRUCTURE-BLUEPRINT.md` | `/` | Infrastructure | Operational environments and runtime specs | Active Architecture | `/docs/01_Architecture/SYSTEM_ARCHITECTURE.md` |
| `BHOOMIONE-V2-SUBSCRIPTION-MATRIX.md` | `/` | Commercial | Plan, addons, pricing models, and flag matrix | Active Policy | `/docs/05_Commercial/SubscriptionPlans.md` |
| `BHOOMIONE-V2-TENANCY-DECISION.md` | `/` | Database | Architecture decision record on multi-tenancy models | Active Decision | `/docs/02_Database/TENANT_ISOLATION.md` |
| `COMMERCIAL_ENGINE_CONSOLIDATION_AUDIT.md` | `/` | Audits | Reconciliation audit of Express & Laravel subscription flows | Active Audit | `/docs/10_Audits/COMMERCIAL_ENGINE_CONSOLIDATION_AUDIT.md` |
| `DEPLOYMENT-COMPOSER-SECURITY-FIX-REPORT.md` | `/` | Operations | Composer vulnerability security fixes in Laravel container | Active Fix Report | `/docs/08_Deployment/ProductionChecklist.md` |
| `DEPLOYMENT-DOCKERFILE-FIX-REPORT.md` | `/` | Operations | Custom multi-stage Docker environment build corrections | Active Fix Report | `/docs/08_Deployment/Docker.md` |
| `DEPLOYMENT-LARAVEL-RUNTIME-FIX-REPORT.md` | `/` | Operations | Fixing PHP FastCGI execution environments on Cloud Run | Active Fix Report | `/docs/08_Deployment/LaravelDeployment.md` |
| `DEPLOYMENT-LARAVEL12-PROVIDER-FIX-REPORT.md` | `/` | Operations | Integration fix report for Laravel service provider lifecycle | Active Fix Report | `/docs/08_Deployment/LaravelDeployment.md` |
| `DEPLOYMENT-PATCH-REPORT.md` | `/` | Operations | Compilation of recent hotfixes to the Docker builds | Active Report | `/docs/08_Deployment/ProductionChecklist.md` |
| `DEPLOYMENT-STAGING-GUIDE.md` | `/` | Operations | Guide for spinning up Cloud Run staging nodes | Active Guide | `/docs/08_Deployment/ProductionChecklist.md` |
| `DEPLOYMENT_IMPACT_ANALYSIS.md` | `/` | Operations | Analysis of Cloud Run routing configurations | Active Report | `/docs/08_Deployment/ProductionChecklist.md` |
| `DOMAIN_ROUTING_HARDENING_REPORT.md` | `/` | Network | Hardening of custom domains routing matrix | Active Network Report | `/docs/08_Deployment/ProductionChecklist.md` |
| `DOMAIN_ROUTING_IMPLEMENTATION_REPORT.md` | `/` | Network | Implementation details of multi-tenant domain mapping | Active Network Report | `/docs/01_Architecture/MULTITENANCY.md` |
| `LARAVEL_BASE_CONTROLLER_FIX_REPORT.md` | `/` | Core Backend | Corrections to Laravel API base routing classes | Active Fix Report | `/docs/04_APIs/ErrorCodes.md` |
| `MIGRATION_SYNTAX_FIX_REPORT.md` | `/` | Database | Syntax corrections for PostgreSQL UUID generation | Active Fix Report | `/docs/02_Database/DATABASE_ARCHITECTURE.md` |
| `NGINX_API_ROUTING_FIX_REPORT.md` | `/` | Network | Routing configurations between React SPA and Laravel API | Active Network Report | `/docs/08_Deployment/ProductionChecklist.md` |
| `NGINX_FINAL_WORKING_FIX_REPORT.md` | `/` | Network | Permanent Nginx FastCGI configuration verification | Active Network Report | `/docs/08_Deployment/ProductionChecklist.md` |
| `NGINX_VERIFIED_FASTCGI_RECOVERY_REPORT.md` | `/` | Network | Disaster recovery steps for corrupted Nginx proxies | Active Recovery Report | `/docs/08_Deployment/Rollback.md` |
| `PHASE1D_SAAS_ADMIN_STABILIZATION_REPORT.md` | `/` | Phase Reports | Phase 1D SaaS administration modules summary | Active Phase Report | `/docs/11_Phases/PHASE1D_SAAS_ADMIN_STABILIZATION_REPORT.md` |
| `PHASE1EA_API_DESIGN.md` | `/` | Phase Reports | REST API structures for project and layout metadata | Active Phase Report | `/docs/11_Phases/PHASE1EA_API_DESIGN.md` |
| `PHASE1EA_DEPLOYMENT_AUDIT.md` | `/` | Phase Reports | Deployment verification for Phase 1EA backend | Active Phase Report | `/docs/11_Phases/PHASE1EA_DEPLOYMENT_AUDIT.md` |
| `PHASE1EA_IMPLEMENTATION_REPORT.md` | `/` | Phase Reports | Implementation outcomes for Phase 1EA components | Active Phase Report | `/docs/11_Phases/PHASE1EA_IMPLEMENTATION_REPORT.md` |
| `PHASE1EA_RUNTIME_VERIFICATION.md` | `/` | Phase Reports | Runtime verification suite for Phase 1EA APIs | Active Phase Report | `/docs/11_Phases/PHASE1EA_RUNTIME_VERIFICATION.md` |
| `PHASE1EA_SCHEMA_DESIGN.md` | `/` | Phase Reports | Database layouts and constraints for core registries | Active Phase Report | `/docs/11_Phases/PHASE1EA_SCHEMA_DESIGN.md` |
| `PHASE1EA_VALIDATION_REPORT.md` | `/` | Phase Reports | Payload validations and endpoint integrity tests | Active Phase Report | `/docs/11_Phases/PHASE1EA_VALIDATION_REPORT.md` |
| `PHASE1EB5_UI_ARCHITECTURE_CLEANUP_REPORT.md` | `/` | Phase Reports | UI component structural refactoring outcomes | Active Phase Report | `/docs/11_Phases/PHASE1EB5_UI_ARCHITECTURE_CLEANUP_REPORT.md` |
| `PHASE1EB5_UI_TEST_MATRIX.md` | `/` | Phase Reports | UI unit and integration tests checklist | Active Test Matrix | `/docs/11_Phases/PHASE1EB5_UI_TEST_MATRIX.md` |
| `PHASE1EB6_PERSISTENCE_AUDIT.md` | `/` | Phase Reports | Audit of client-side local storage behaviors | Active Phase Audit | `/docs/11_Phases/PHASE1EB6_PERSISTENCE_AUDIT.md` |
| `PHASE1EB7_SUBSCRIPTION_CENTER_CLEANUP_REPORT.md` | `/` | Phase Reports | Cleanup report for SaaS Billing customer interfaces | Active Phase Report | `/docs/11_Phases/PHASE1EB7_SUBSCRIPTION_CENTER_CLEANUP_REPORT.md` |
| `PHASE1EB7_SUBSCRIPTION_CENTER_TEST_MATRIX.md` | `/` | Phase Reports | Test verification suites for SaaS Billing pages | Active Test Matrix | `/docs/11_Phases/PHASE1EB7_SUBSCRIPTION_CENTER_TEST_MATRIX.md` |
| `PHASE1EB8_RUNTIME_VERIFICATION.md` | `/` | Phase Reports | Verification metrics for multi-tenant rendering | Active Phase Report | `/docs/11_Phases/PHASE1EB8_RUNTIME_VERIFICATION.md` |
| `PHASE1EB_ARCHITECTURE_AUDIT.md` | `/` | Phase Reports | Core UI structural architecture validation | Active Phase Audit | `/docs/11_Phases/PHASE1EB_ARCHITECTURE_AUDIT.md` |
| `PHASE1EB_CLEANUP_AUDIT.md` | `/` | Phase Reports | Removal of outdated legacy files across directories | Active Phase Audit | `/docs/11_Phases/PHASE1EB_CLEANUP_AUDIT.md` |
| `PHASE1EB_ERROR_RESOLUTION_REPORT.md` | `/` | Phase Reports | React router and dependency error fixes | Active Phase Report | `/docs/11_Phases/PHASE1EB_ERROR_RESOLUTION_REPORT.md` |
| `PHASE1EB_FINAL_VALIDATION.md` | `/` | Phase Reports | UI form validation rules and bounds tests | Active Phase Validation | `/docs/11_Phases/PHASE1EB_FINAL_VALIDATION.md` |
| `PHASE1EB_FRONTEND_DEPLOYMENT_FIX_REPORT.md` | `/` | Phase Reports | Refactoring build tasks for production deployment | Active Phase Report | `/docs/11_Phases/PHASE1EB_FRONTEND_DEPLOYMENT_FIX_REPORT.md` |
| `PHASE1EB_FRONTEND_DEPLOYMENT_TEST_MATRIX.md` | `/` | Phase Reports | Deployment tests and responsiveness benchmarks | Active Test Matrix | `/docs/11_Phases/PHASE1EB_FRONTEND_DEPLOYMENT_TEST_MATRIX.md` |
| `PHASE1EC_API_MATRIX.md` | `/` | Phase Reports | Consolidated matrix of SaaS subscription API routes | Active Phase Report | `/docs/11_Phases/PHASE1EC_API_MATRIX.md` |
| `PHASE1EC_DEPLOYMENT_AUDIT.md` | `/` | Phase Reports | Operational auditing of Laravel Billing controllers | Active Phase Audit | `/docs/11_Phases/PHASE1EC_DEPLOYMENT_AUDIT.md` |
| `PHASE1EC_ENFORCEMENT_ARCHITECTURE.md` | `/` | Phase Reports | Architectural diagram of Subscription middleware | Active Phase Report | `/docs/11_Phases/PHASE1EC_ENFORCEMENT_ARCHITECTURE.md` |
| `PHASE1EC_RUNTIME_AUDIT.md` | `/` | Phase Reports | In-memory verification of billing gates | Active Phase Audit | `/docs/11_Phases/PHASE1EC_RUNTIME_AUDIT.md` |
| `PHASE1EC_TEST_MATRIX.md` | `/` | Phase Reports | SaaS commercial system integration tests checklist | Active Test Matrix | `/docs/11_Phases/PHASE1EC_TEST_MATRIX.md` |
| `PHASE1E_BACKEND_GAP_REPORT.md` | `/` | Phase Reports | Functional gaps identified between Laravel & Express | Active Phase Report | `/docs/11_Phases/PHASE1E_BACKEND_GAP_REPORT.md` |
| `PHASE1E_FINAL_DEPLOYMENT_AUDIT.md` | `/` | Phase Reports | Final security audits of Phase 1E routing | Active Phase Audit | `/docs/11_Phases/PHASE1E_FINAL_DEPLOYMENT_AUDIT.md` |
| `PHASE1E_FRONTEND_VISIBILITY_FIX_REPORT.md` | `/` | Phase Reports | Correcting UI elements access levels dynamically | Active Phase Report | `/docs/11_Phases/PHASE1E_FRONTEND_VISIBILITY_FIX_REPORT.md` |
| `PHASE1E_FRONTEND_VISIBILITY_TEST_MATRIX.md` | `/` | Phase Reports | Gating visibility validation suite | Active Test Matrix | `/docs/11_Phases/PHASE1E_FRONTEND_VISIBILITY_TEST_MATRIX.md` |
| `PHASE1E_MODULE_REGISTRY_SUBSCRIPTION_REPORT.md`|`/`| Phase Reports | Commercial definitions of core application modules | Active Phase Report | `/docs/11_Phases/PHASE1E_MODULE_REGISTRY_SUBSCRIPTION_REPORT.md`|
| `PHASE1E_PERSISTENCE_AUDIT.md` | `/` | Phase Reports | DB transaction isolation audit on shared tenant nodes | Active Phase Audit | `/docs/11_Phases/PHASE1E_PERSISTENCE_AUDIT.md` |
| `PHASE1E_PRE_DEPLOY_AUDIT.md` | `/` | Phase Reports | Audit checkpoint prior to Phase 1E merge | Active Phase Audit | `/docs/11_Phases/PHASE1E_PRE_DEPLOY_AUDIT.md` |
| `PHASE1E_SUBSCRIPTION_TEST_MATRIX.md` | `/` | Phase Reports | Plan tier transitions and billing validations | Active Test Matrix | `/docs/11_Phases/PHASE1E_SUBSCRIPTION_TEST_MATRIX.md` |
| `PHASE1F10_TENANT_EXPERIENCE_REPORT.md` | `/` | Phase Reports | Refinements to user workflows in multi-tenant contexts| Active Phase Report | `/docs/11_Phases/PHASE1F10_TENANT_EXPERIENCE_REPORT.md` |
| `PHASE1F10_TEST_MATRIX.md` | `/` | Phase Reports | UX benchmark tests and form interaction validation | Active Test Matrix | `/docs/11_Phases/PHASE1F10_TEST_MATRIX.md` |
| `PHASE1F2_COMPLETION_AUDIT.md` | `/` | Phase Reports | Audit verification for Phase 1F.2 integration | Active Phase Audit | `/docs/11_Phases/PHASE1F2_COMPLETION_AUDIT.md` |
| `PHASE1F2_MIGRATION_SAFETY_FIX_REPORT.md` | `/` | Phase Reports | Safe SQL scripts execution guidelines without data loss| Active Phase Report | `/docs/11_Phases/PHASE1F2_MIGRATION_SAFETY_FIX_REPORT.md` |
| `PHASE1F2_UI_MOUNTING_COMPLETION_REPORT.md` | `/` | Phase Reports | Multi-tenant dynamic UI loading stabilization | Active Phase Report | `/docs/11_Phases/PHASE1F2_UI_MOUNTING_COMPLETION_REPORT.md` |
| `PHASE1F3A_TENANT_OVERRIDE_ARCHITECTURE_AUDIT.md`|`/`| Phase Reports | Audit of explicit billing overrides architecture | Active Phase Audit | `/docs/11_Phases/PHASE1F3A_TENANT_OVERRIDE_ARCHITECTURE_AUDIT.md`|
| `PHASE1F3B_TENANT_OVERRIDE_TEST_MATRIX.md` | `/` | Phase Reports | Override test matrix checking billing modifications | Active Test Matrix | `/docs/11_Phases/PHASE1F3B_TENANT_OVERRIDE_TEST_MATRIX.md` |
| `PHASE1F4_ARCHITECTURE_CORRECTION_REPORT.md` | `/` | Phase Reports | Adjustments made to the pricing model architecture | Active Phase Report | `/docs/11_Phases/PHASE1F4_ARCHITECTURE_CORRECTION_REPORT.md` |
| `PHASE1F4_SAAS_SETTINGS_PRICING_REPORT.md` | `/` | Phase Reports | Implementation of platform global pricing sliders | Active Phase Report | `/docs/11_Phases/PHASE1F4_SAAS_SETTINGS_PRICING_REPORT.md` |
| `PHASE1F4_TEST_MATRIX.md` | `/` | Phase Reports | Pricing configurations test scenarios | Active Test Matrix | `/docs/11_Phases/PHASE1F4_TEST_MATRIX.md` |
| `PHASE1F5A_SETTINGS_DASHBOARD_AUDITLOG_CLEANUP_REPORT.md`|`/`| Phase Reports | Clean up report for system dashboards and logs | Active Phase Report | `/docs/11_Phases/PHASE1F5A_SETTINGS_DASHBOARD_AUDITLOG_CLEANUP_REPORT.md`|
| `PHASE1F5A_TEST_MATRIX.md` | `/` | Phase Reports | Test matrices for logs tracing and visibility checks | Active Test Matrix | `/docs/11_Phases/PHASE1F5A_TEST_MATRIX.md` |
| `PHASE1F8A_COMMERCIAL_ENGINE_VERIFICATION.md` | `/` | Phase Reports | Comprehensive mathematical verification of pricing math| Active Phase Audit | `/docs/11_Phases/PHASE1F8A_COMMERCIAL_ENGINE_VERIFICATION.md` |
| `PHASE1F9_COMMERCIAL_RUNTIME_ENFORCEMENT_REPORT.md`|`/`| Phase Reports | Runtime blockades validation suite | Active Phase Report | `/docs/11_Phases/PHASE1F9_COMMERCIAL_RUNTIME_ENFORCEMENT_REPORT.md`|
| `PHASE1F9_TEST_MATRIX.md` | `/` | Phase Reports | Functional assertions list for edge case billing | Active Test Matrix | `/docs/11_Phases/PHASE1F9_TEST_MATRIX.md` |
| `PHASE2A1B_ARCHITECTURE_AUDIT.md` | `/` | Phase Reports | Verification of DXF coordinates versus global GIS | Active Phase Audit | `/docs/11_Phases/PHASE2A1B_ARCHITECTURE_AUDIT.md` |
| `PHASE2A1_GEOREFERENCE_REPORT.md` | `/` | Phase Reports | Math formulas & Express code for Georeferencing | Superseded by 2A2 | `/docs/11_Phases/PHASE2A1_GEOREFERENCE_REPORT.md` |
| `PHASE2A1_TEST_MATRIX.md` | `/` | Phase Reports | Integration tests for legacy Express routes | Superseded by 2A2 | `/docs/11_Phases/PHASE2A1_TEST_MATRIX.md` |
| `PHASE2A2_GEOREFERENCE_LARAVEL_MIGRATION_REPORT.md`|`/`| Phase Reports | Complete porting of GIS algorithms to Laravel engine | Active Phase Report | `/docs/11_Phases/PHASE2A2_GEOREFERENCE_LARAVEL_MIGRATION_REPORT.md`|
| `PHASE2A2_TEST_MATRIX.md` | `/` | Phase Reports | Active testing matrix of Laravel georeference APIs | Active Test Matrix | `/docs/11_Phases/PHASE2A2_TEST_MATRIX.md` |
| `PHASE2A_DEPLOYMENT_PLAYBOOK.md` | `/` | Phase Reports | Playbook to transition layouts modules | Active Phase Report | `/docs/11_Phases/PHASE2A_DEPLOYMENT_PLAYBOOK.md` |
| `PHASE2A_GIS_REALITY_AUDIT.md` | `/` | Phase Reports | Physical surveying vs digital grid integrity checks | Active Phase Audit | `/docs/11_Phases/PHASE2A_GIS_REALITY_AUDIT.md` |
| `PHASE2A_GIS_WORKSPACE_REPORT.md` | `/` | Phase Reports | UI mapping components wireframe specifications | Active Phase Report | `/docs/11_Phases/PHASE2A_GIS_WORKSPACE_REPORT.md` |
| `PHASE2A_PRE_DEPLOY_AUDIT.md` | `/` | Phase Reports | Quality gating parameters before projects release | Active Phase Audit | `/docs/11_Phases/PHASE2A_PRE_DEPLOY_AUDIT.md` |
| `PHASE2A_PROJECTS_IMPLEMENTATION_REPORT.md` | `/` | Phase Reports | Implementation of clean Project registries in Laravel | Active Phase Report | `/docs/11_Phases/PHASE2A_PROJECTS_IMPLEMENTATION_REPORT.md` |
| `PHASE2A_PROJECTS_TEST_MATRIX.md` | `/` | Phase Reports | Test scripts list verifying project boundaries | Active Test Matrix | `/docs/11_Phases/PHASE2A_PROJECTS_TEST_MATRIX.md` |
| `PHASE2A_REGRESSION_AUDIT.md` | `/` | Phase Reports | Codebase regression checks on Projects features | Active Phase Audit | `/docs/11_Phases/PHASE2A_REGRESSION_AUDIT.md` |
| `PHASE2A_REGRESSION_FIX_REPORT.md` | `/` | Phase Reports | Fixed controller overlaps in Laravel routes | Active Phase Report | `/docs/11_Phases/PHASE2A_REGRESSION_FIX_REPORT.md` |
| `PHASE2A_REGRESSION_FIX_TEST_MATRIX.md` | `/` | Phase Reports | Regression validation scripts | Active Test Matrix | `/docs/11_Phases/PHASE2A_REGRESSION_FIX_TEST_MATRIX.md` |
| `PHASE2A_TEST_MATRIX.md` | `/` | Phase Reports | Complete verification index for Phase 2A | Active Test Matrix | `/docs/11_Phases/PHASE2A_TEST_MATRIX.md` |
| `PHASE2B_LAYOUT_IMPLEMENTATION_REPORT.md` | `/` | Phase Reports | Multidimensional layouts registration under projects | Active Phase Report | `/docs/11_Phases/PHASE2B_LAYOUT_IMPLEMENTATION_REPORT.md` |
| `PHASE2B_LAYOUT_TEST_MATRIX.md` | `/` | Phase Reports | Quality check list of layout entity bindings | Active Test Matrix | `/docs/11_Phases/PHASE2B_LAYOUT_TEST_MATRIX.md` |
| `PHASE2C_FINAL_DEPLOYMENT_AUDIT.md` | `/` | Phase Reports | Pre-release check list for plots registers | Active Phase Audit | `/docs/11_Phases/PHASE2C_FINAL_DEPLOYMENT_AUDIT.md` |
| `PHASE2C_PLOT_IMPLEMENTATION_REPORT.md` | `/` | Phase Reports | Creation of trace-compliant Plots controller logic | Active Phase Report | `/docs/11_Phases/PHASE2C_PLOT_IMPLEMENTATION_REPORT.md` |
| `PHASE2C_PLOT_TEST_MATRIX.md` | `/` | Phase Reports | Dimensional validation suites for parcel plots | Active Test Matrix | `/docs/11_Phases/PHASE2C_PLOT_TEST_MATRIX.md` |
| `PHASE2C_PRE_DEPLOY_AUDIT.md` | `/` | Phase Reports | Phase 2C final check audits | Active Phase Audit | `/docs/11_Phases/PHASE2C_PRE_DEPLOY_AUDIT.md` |
| `PLAN_FEATURE_ARCHITECTURE_AUDIT.md` | `/` | Audits | Enterprise plan definitions system-wide audit | Active Audit | `/docs/10_Audits/PLAN_FEATURE_ARCHITECTURE_AUDIT.md` |
| `RECOVERY-POINT-S3-STAGING.md` | `/` | Operations | Snapshot backup guidelines for remote S3 buckets | Active Operations | `/docs/14_Operations/BackupRecovery.md` |
| `SPRINT-1-TECHNICAL-SPEC.md` | `/` | Sprints | Technical architectural blueprints for Sprint 1 | Active Sprint Spec | `/docs/12_Sprints/SPRINT-1-TECHNICAL-SPEC.md` |
| `SPRINT1C-RBAC-IMPLEMENTATION-REPORT.md` | `/` | Sprints | Realization of granular RBAC permissions tree | Active Sprint Report | `/docs/12_Sprints/SPRINT1C-RBAC-IMPLEMENTATION-REPORT.md` |
| `SPRINT2A-COMPLIANCE-REPORT.md` | `/` | Sprints | Compliance matrix for standard spatial databases | Active Sprint Report | `/docs/12_Sprints/SPRINT2A-COMPLIANCE-REPORT.md` |
| `SPRINT2A-LARAVEL-IMPLEMENTATION-REPORT.md` | `/` | Sprints | Implementation report of Laravel controllers migration | Active Sprint Report | `/docs/12_Sprints/SPRINT2A-LARAVEL-IMPLEMENTATION-REPORT.md` |
| `SPRINT2A-PROJECT-LAYOUT-PLOT-IMPLEMENTATION-REPORT.md`|`/`| Sprints | Consolidated registration for core entities | Active Sprint Report | `/docs/12_Sprints/SPRINT2A-PROJECT-LAYOUT-PLOT-IMPLEMENTATION-REPORT.md`|
| `SPRINT2A-PROJECT-LAYOUT-PLOT-TECHNICAL-SPEC.md`|`/`| Sprints | System blueprint mapping cadastral datasets | Active Sprint Spec | `/docs/12_Sprints/SPRINT2A-PROJECT-LAYOUT-PLOT-TECHNICAL-SPEC.md`|
| `SPRINT2B-COMPLIANCE-REPORT.md` | `/` | Sprints | Compliance audit of Laravel admin UI controllers | Active Sprint Report | `/docs/12_Sprints/SPRINT2B-COMPLIANCE-REPORT.md` |
| `SPRINT2B-MANAGEMENT-UI-FINAL-SPEC.md` | `/` | Sprints | Production requirements for dynamic tabular grids | Active Sprint Spec | `/docs/12_Sprints/SPRINT2B-MANAGEMENT-UI-FINAL-SPEC.md` |
| `SPRINT2B-MANAGEMENT-UI-IMPLEMENTATION-REPORT.md`|`/`| Sprints | Completed layout rendering elements checklist | Active Sprint Report | `/docs/12_Sprints/SPRINT2B-MANAGEMENT-UI-IMPLEMENTATION-REPORT.md`|
| `SPRINT2B-MANAGEMENT-UI-TECHNICAL-SPEC.md` | `/` | Sprints | Structural design of tables views in dashboard | Active Sprint Spec | `/docs/12_Sprints/SPRINT2B-MANAGEMENT-UI-TECHNICAL-SPEC.md` |
| `SPRINT2B.1-SCALABILITY-IMPLEMENTATION-REPORT.md`|`/`| Sprints | Optimized indexing strategies for UUID elements | Active Sprint Report | `/docs/12_Sprints/SPRINT2B.1-SCALABILITY-IMPLEMENTATION-REPORT.md`|
| `SPRINT3A-COMPLIANCE-REPORT.md` | `/` | Sprints | Compliance verification of client-side file uploaders| Active Sprint Report | `/docs/12_Sprints/SPRINT3A-COMPLIANCE-REPORT.md` |
| `SPRINT3A-DXF-FOUNDATION-FINAL-SPEC.md` | `/` | Sprints | CAD upload and sanitization routines | Active Sprint Spec | `/docs/12_Sprints/SPRINT3A-DXF-FOUNDATION-FINAL-SPEC.md` |
| `SPRINT3A-DXF-IMPORT-FOUNDATION-TECHNICAL-SPEC.md`|`/`| Sprints | Architectural specification of three-stage import | Active Sprint Spec | `/docs/12_Sprints/SPRINT3A-DXF-IMPORT-FOUNDATION-TECHNICAL-SPEC.md`|
| `SPRINT3B-COMPLIANCE-REPORT.md` | `/` | Sprints | Compliance report for Layer Mapping studio | Active Sprint Report | `/docs/12_Sprints/SPRINT3B-COMPLIANCE-REPORT.md` |
| `SPRINT3B-LARAVEL-ALIGNMENT-FIX-REPORT.md` | `/` | Sprints | Correcting Express routes mapping errors in production | Active Sprint Report | `/docs/12_Sprints/SPRINT3B-LARAVEL-ALIGNMENT-FIX-REPORT.md` |
| `SPRINT3B-LAYER-MAPPING-STUDIO-FINAL-SPEC.md` | `/` | Sprints | Final schema mapping instructions for DXF-to-GIS | Active Sprint Spec | `/docs/12_Sprints/SPRINT3B-LAYER-MAPPING-STUDIO-FINAL-SPEC.md` |
| `SPRINT3B-LAYER-MAPPING-STUDIO-IMPLEMENTATION-REPORT.md`|`/`| Sprints | Layer mapping components development checklist | Active Sprint Report | `/docs/12_Sprints/SPRINT3B-LAYER-MAPPING-STUDIO-IMPLEMENTATION-REPORT.md`|
| `SPRINT3B-LAYER-MAPPING-STUDIO-TECHNICAL-SPEC.md`|`/`| Sprints | Logical model linking DXF layers to plot registers | Active Sprint Spec | `/docs/12_Sprints/SPRINT3B-LAYER-MAPPING-STUDIO-TECHNICAL-SPEC.md`|
| `SPRINT3C-COMPLIANCE-REPORT.md` | `/` | Sprints | Compliance verification of vector mapping models | Active Sprint Report | `/docs/12_Sprints/SPRINT3C-COMPLIANCE-REPORT.md` |
| `SPRINT3C-GEOMETRY-EXTRACTION-ENGINE-TECHNICAL-SPEC.md`|`/`| Sprints| Low-level extraction formulas for polygon structures | Active Sprint Spec | `/docs/12_Sprints/SPRINT3C-GEOMETRY-EXTRACTION-ENGINE-TECHNICAL-SPEC.md`|
| `SPRINT3C-GEOMETRY-EXTRACTION-FINAL-SPEC.md` | `/` | Sprints | Final structural pipeline for CAD file scanning | Active Sprint Spec | `/docs/12_Sprints/SPRINT3C-GEOMETRY-EXTRACTION-FINAL-SPEC.md` |
| `SPRINT3C-GEOMETRY-EXTRACTION-IMPLEMENTATION-REPORT.md`|`/`| Sprints| Complete implementation details of Geometry parser | Active Sprint Report | `/docs/12_Sprints/SPRINT3C-GEOMETRY-EXTRACTION-IMPLEMENTATION-REPORT.md`|
| `SPRINT3D-AUTO-PLOT-GENERATION-FINAL-SPEC.md` | `/` | Sprints | Standard plot allocation algorithms specs | Active Sprint Spec | `/docs/12_Sprints/SPRINT3D-AUTO-PLOT-GENERATION-FINAL-SPEC.md` |
| `SPRINT3D-AUTO-PLOT-GENERATION-IMPLEMENTATION-REPORT.md`|`/`| Sprints| Automated parcel mapping algorithms checklist | Active Sprint Report | `/docs/12_Sprints/SPRINT3D-AUTO-PLOT-GENERATION-IMPLEMENTATION-REPORT.md`|
| `SPRINT3D-AUTO-PLOT-GENERATION-TECHNICAL-SPEC.md`|`/`| Sprints| Algebraic intersection models of overlapping boundary | Active Sprint Spec | `/docs/12_Sprints/SPRINT3D-AUTO-PLOT-GENERATION-TECHNICAL-SPEC.md`|
| `SPRINT3D-COMPLIANCE-REPORT.md` | `/` | Sprints | Compliance matrix for algorithmic land subdivisions | Active Sprint Report | `/docs/12_Sprints/SPRINT3D-COMPLIANCE-REPORT.md` |
| `SPRINT3D-FINAL-VERIFICATION-REPORT.md` | `/` | Sprints | Precision verification test outcomes for AutoPlot | Active Sprint Report | `/docs/12_Sprints/SPRINT3D-FINAL-VERIFICATION-REPORT.md` |
| `SPRINT3D.1-SAFETY-HARDENING-COMPLIANCE-REPORT.md`|`/`| Sprints | Dynamic data injection hardening audits | Active Sprint Report | `/docs/12_Sprints/SPRINT3D.1-SAFETY-HARDENING-COMPLIANCE-REPORT.md`|
| `SPRINT3D.1-SAFETY-HARDENING-IMPLEMENTATION-REPORT.md`|`/`|Sprints | Implementation details of transaction limits safety | Active Sprint Report | `/docs/12_Sprints/SPRINT3D.1-SAFETY-HARDENING-IMPLEMENTATION-REPORT.md`|
| `SPRINT3E-COMPLIANCE-REPORT.md` | `/` | Sprints | Compliance checks on raw vector-to-SVG builders | Active Sprint Report | `/docs/12_Sprints/SPRINT3E-COMPLIANCE-REPORT.md` |
| `SPRINT3E-SVG-GENERATION-ENGINE-TECHNICAL-SPEC.md`|`/`| Sprints| Blueprint of dynamic DOM rendering parameters | Active Sprint Spec | `/docs/12_Sprints/SPRINT3E-SVG-GENERATION-ENGINE-TECHNICAL-SPEC.md`|
| `SPRINT3E-SVG-GENERATION-FINAL-SPEC.md` | `/` | Sprints | Scaled vector views styling profiles specs | Active Sprint Spec | `/docs/12_Sprints/SPRINT3E-SVG-GENERATION-FINAL-SPEC.md` |
| `SPRINT3E-SVG-GENERATION-IMPLEMENTATION-REPORT.md`|`/`| Sprints| Development check list of dynamic SVG generator | Active Sprint Report | `/docs/12_Sprints/SPRINT3E-SVG-GENERATION-IMPLEMENTATION-REPORT.md`|
| `SPRINT4A-COMPLIANCE-REPORT.md` | `/` | Sprints | Compliance audits of dynamic Map Canvas modules | Active Sprint Report | `/docs/12_Sprints/SPRINT4A-COMPLIANCE-REPORT.md` |
| `SPRINT4A-INTERACTIVE-LAYOUT-VIEWER-IMPLEMENTATION-REPORT.md`|`/`|Sprints| Canvas click and hover events tracking checklist | Active Sprint Report | `/docs/12_Sprints/SPRINT4A-INTERACTIVE-LAYOUT-VIEWER-IMPLEMENTATION-REPORT.md`|
| `SPRINT4A-INTERACTIVE-LAYOUT-VIEWER-TECHNICAL-SPEC.md`|`/`| Sprints| Mathematical transformation vectors for canvas zoom | Active Sprint Spec | `/docs/12_Sprints/SPRINT4A-INTERACTIVE-LAYOUT-VIEWER-TECHNICAL-SPEC.md`|
| `SPRINT4A-PERFORMANCE-REPORT.md` | `/` | Sprints | Frame rate and memory profiling for SVG views | Active Sprint Report | `/docs/12_Sprints/SPRINT4A-PERFORMANCE-REPORT.md` |
| `SPRINT4A-UX-BLUEPRINT.md` | `/` | Sprints | Visual state transitions mapping for buyer portal | Active Sprint Spec | `/docs/12_Sprints/SPRINT4A-UX-BLUEPRINT.md` |
| `SPRINT4A.1-VIEWER-VERIFICATION-REPORT.md` | `/` | Sprints | Verification checklist of dynamic layouts renderer | Active Sprint Report | `/docs/12_Sprints/SPRINT4A.1-VIEWER-VERIFICATION-REPORT.md` |
| `SPRINT4B-BOOKING-ENGINE-TECHNICAL-SPEC.md` | `/` | Sprints | Functional rules of downpayment workflows | Active Sprint Spec | `/docs/12_Sprints/SPRINT4B-BOOKING-ENGINE-TECHNICAL-SPEC.md` |
| `TENANT_LOGIN_PREFILL_FIX_REPORT.md` | `/` | Operations | Corrects cross-origin issues with domain login prefills | Active Fix Report | `/docs/08_Deployment/Rollback.md` |
| `UUID_AUDIT_REPORT.md` | `/` | Audits | Complete verification of schema UUID references | Active Audit | `/docs/10_Audits/UUID_AUDIT_REPORT.md` |

---

## 2. Archival and Consolidative Cleanliness

The physical files currently located at `/` **must not** be deleted to preserve the historical audit trail of our engineering development. 
Instead, we establish `/docs` as the single structured gateway for all production-grade, long-term engineering documentation, blueprints, architecture definitions, and operational references. 

New contributors, systems, and AI models should interact with BhoomiOne exclusively via the standardized `/docs` index hierarchy.
