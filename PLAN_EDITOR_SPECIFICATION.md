# Plan Editor Specification
**BhoomiOne v2 – Phase 1F.13**

## 1. Overview
The Advanced Plan Editor provides platform administrators with character-level control over subscription tier characteristics, commercial pricing slabs, resource limits, and feature availability. 

## 2. Tab Structure & Form Fields

### Tab A: General Parameters
- **Plan Name**: Text input (`name`)
- **Plan Code / Identifier**: Immutable string (`code`)
- **Public Description**: Text area for public marketing text (`description`)
- **Status / Lifecycle state**: Toggle/Select (`status` - ACTIVE, INACTIVE, DRAFT)
- **Visibility Link Type**: Select (`visibility` - PUBLIC, PRIVATE, INTERNAL)
- **Sort Order Position**: Numeric priority rating (`sortOrder`)
- **Most Popular Indicator**: Boolean recommendation badge flag (`isRecommended`)

### Tab B: Pricing & Licensing
- **Monthly Subscription Fee**: Base recurring cost (`monthlyPrice`)
- **Yearly Subscription Fee**: Annual discounted recurring cost (`yearlyPrice`)
- **One-Time Enterprise License Fee**: Non-recurring upfront setup/capital cost (`oneTimeLicenseFee`)
- **Annual Maintenance Charge (AMC)**: Base maintenance contract cost (`amcFee`)
- **Trial Evaluation Days**: Complementary evaluation window duration (`trialDays`)

### Tab C: Allocated Capacity Limits
- **Max Workspace Projects**: Absolute numeric projects cap (`projectsLimit`, or `-1` for unlimited)
- **Max Design Layouts**: Absolute layouts limit (`layoutsLimit`)
- **Max GIS Plots**: Allocated plot cap (`plotsLimit`)
- **Max Users / Accounts**: Maximum corporate accounts (`usersLimit`)
- **Dedicated Disk Storage**: Allocated workspace file space in GB (`storageLimitGb`)

### Tab D: Feature Capabilities Matrix
- **Module Enablement Checklist**: Grouped toggle matrix of granular features linked to the plan template (e.g., DXF Ingestion, GIS Overlay, Advanced Map Telemetry). Enables administrators to toggle specific feature swappables on a per-plan basis.
