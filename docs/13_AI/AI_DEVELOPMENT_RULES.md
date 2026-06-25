# AI Development & Coding Rules

This document specifies the strict code structure conventions, type-safety rules, and component parameters required for all AI-guided development on BhoomiOne.

---

## 💻 Code Formatting & Conventions

1. **TypeScript First**: All additions or refactorings in the React front-end or server-side scripts must utilize explicit TypeScript type definitions. The use of `any` types is strictly prohibited.
2. **Standard Imports**: All `import` statements must reside at the top of the file. Named imports are preferred over object destructuring.
3. **Enum Declaration Rules**: Use standard, explicit `enum` structures. Do NOT use `const enum`.

---

## 🧱 Architectural Conventions

1. **Keep App.tsx Clean**: Do not bundle complex features logic, static arrays, or component hierarchies directly inside `/src/App.tsx`. Refactor components into the `/src/components/` directory.
2. **Never expose secrets**: Production secrets, Stripe private keys, database credentials, and `GEMINI_API_KEY` must remain strictly server-side inside Laravel. The React client-side SPA must access these solely through secure, proxied endpoints.
3. **No custom API client implementations**: All frontend API calls must consume the preconfigured API client inside `/src/lib/api.ts` to ensure consistent session handling, JWT refreshes, and header injection.
4. **No Inline Styling**: All visual layouts must be styled using direct Tailwind CSS utility classes. Customized styles must reside in the central `/src/index.css` file.
