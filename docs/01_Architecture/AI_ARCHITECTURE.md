# AI Architecture & Agent Integration

BhoomiOne leverages advanced AI agents to optimize developer productivity and automate spatial parsing. This document defines the architectural guardrails, prompting models, and SDK constraints governing AI operations within the workspace.

---

## 🤖 AI Architectural Boundaries

To maintain platform stability, AI agents operate under a strict, isolated tier configuration:

```
+-----------------------------------+
|     User Prompt / Assistant       |
+-----------------------------------+
                  ||
                  \/
+-----------------------------------+
|   Laravel API Server Gateway      |  <--- Access checks, JWT, Rate Limits
+-----------------------------------+
                  ||
                  \/
+-----------------------------------+
|      Gemini 2.5 Flash SDK         |  <--- Stateless inference
+-----------------------------------+
```

### 1. Stateless Server-Side Execution Only
* **Rule**: All AI and LLM inference calls must occur exclusively within server-side environments (e.g. Laravel).
* **Reasoning**: Standard browser environments must never make direct calls to AI APIs. This protects private API secrets (`GEMINI_API_KEY`) from exposure.

### 2. No Database Modifications by AI
* **Rule**: AI models must never execute direct database modifications, ALTER schemas, or execute dynamic queries without passing through Laravel's Eloquent database validation structures.
* **Reasoning**: Protects tenant isolation integrity and database parameters structure.

---

## 🛠️ Gemini SDK standard Patterns

Developers and agents interacting with Gemini API within BhoomiOne utilize the modern `@google/genai` TypeScript SDK (within server scripts) or native Laravel integrations.

### Key Integration Directives:
* **Model Selection**: Always use `gemini-2.5-flash` for high-speed spatial evaluations, layout mapping translations, and report summaries.
* **Prompt Isolation**: System instructions must be structured using explicit JSON schema guidelines to ensure outputs conform to predictable API expectations.
* **Graceful Key Errors**: AI engines must evaluate if the API key exists before attempting connections, returning appropriate warnings if missing.
