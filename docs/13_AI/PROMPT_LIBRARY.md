# AI Agent Prompt Library

This library contains pre-calibrated, high-fidelity system prompt skeletons that human developers can copy and paste to initialize future AI sessions.

---

## 📋 System Prompts Templates

### 📂 Prompt 1: Adding a new Laravel API endpoint
```text
Act as an expert backend Laravel Developer. I need to introduce a new REST API endpoint.
Guidelines to follow:
1. Target file: backend-api/routes/api.php
2. Map under standard tenant-scoped groupings.
3. Apply appropriate authorization middleware: PermissionRequirementMiddleware and TenantContextMiddleware.
4. If this is a premium feature, wrap with SubscriptionFeatureGate middleware.
5. Create a clean Controller and implement request payload checks before database query execution.
```

### 📂 Prompt 2: Creating a new modular React Component
```text
Act as an expert React & Tailwind CSS engineer. I want to build a new sub-component.
Guidelines to follow:
1. Create the file inside /src/components/ following standard TypeScript conventions.
2. Ensure touch targets are at least 44px to preserve mobile responsiveness.
3. Import icons exclusively from 'lucide-react'.
4. Do not bundle styles or local storage persistence in isolation; use standard hooks.
```
