# Phase 2C – Plot Management Foundation – Test Matrix

This test matrix outlines the testing protocols designed to verify the stability, security boundaries, and validation safety of Phase 2C – Plot Management.

## 1. Unit & Functional Validation Cases

| Test Case ID | Feature Component | Target Assessment | Input / Action | Expected Result | Status |
|---|---|---|---|---|---|
| **PLT-01** | Plot Creation | Basic parcel cataloging | Select active layout, fill unique No. (e.g. "P-401"), select Area, hit Save | Successful record addition; success bubble displayed; audit log triggered | **Passed** |
| **PLT-02** | Plot Duplication | Plot No. uniqueness check inside parent layout | Attempt to register "P-401" inside the exact same layout | Fails validation with block; error message: "*A plot with designation/number 'P-401' already exists in this parent layout*" | **Passed** |
| **PLT-03** | Plot Duplication | Plot No. across separate layouts | Register "P-401" nested under a separate layout code | Successful creation; separate layout namespaces successfully allowed | **Passed** |
| **PLT-04** | Area Validation | Strict non-zero area check | Submit plot with Area size `0` or `-140` | Blocked on front-end; error banner asks for a positive value higher than `0` | **Passed** |
| **PLT-05** | Dimensions Validation | Strict positive metric checks | Submit physical plot containing length `-50` or width `-30` | Blocked on front-end; validation message prevents submission | **Passed** |
| **PLT-06** | Auto-calc Area | Rectangular dimension bounds helper | Enter Length `30` and Width `60`, press "Auto-calc" action button | Net Area Value field instantaneously populates with `1800` | **Passed** |
| **PLT-07** | Layout Association | Dynamic Layout Filtering | Select layout dropdown from "Interactive Filtering Parameters" | Plots list automatically refilters to display only plot parcels related to that layout | **Passed** |
| **PLT-08** | Range Filter | Multivariant constraints | Configure min/max area values, minimum road width, and corner plot toggles | Clean combination queries sent to API; lists update without jarring jumps | **Passed** |
| **PLT-09** | PLC Premium Tags | Location premium visual toggles | Inspect plot, click "Park Facing" or "Clubhouse Facing" premium triggers | Attribute state is instantly toggled under extensible attributes list; visual indicators shown on list view | **Passed** |
| **PLT-10** | Infinite Extension | Custom tag registration | Submit "Main Gate Facing" in custom tag text input | New custom attribute instantly saved and registered on selected plot parcel | **Passed** |

## 2. Integrity & Boundary Verification

- **Graceful Loading states**: When navigating filters, stateful loading banners prevent duplicate actions.
- **Error resilience**: Faulty server responses during connection drops fail gracefully by capturing error logs and providing explicit interactive retry triggers.
- **Tenant Context Verification**: All plot queries pass mandatory `X-Tenant-ID` headers, confirming separate tenant workspaces cannot read, cross-contaminate, or modify plots of neighbor accounts.

---
**Test Certification**: Verified and successfully passed all matrix points on compiled container workspace.
