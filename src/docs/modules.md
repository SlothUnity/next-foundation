# Modules

## Overview

A module is the smallest reusable building block of a page.

Each module exposes:

- an alias
- a name
- a React component

Example:

```ts
export const heroModule = defineModule({
  alias: 'hero',
  name: 'Hero',
  component: createModuleComponent(Hero),
});
```

---

## Folder Structure

```
modules/
└── hero/
    ├── components/
    │   └── Hero.tsx
    │
    ├── types/
    │   └── Hero.ts
    │
    ├── module.ts
    └── index.ts
```

---

## Responsibilities

A module should:

- Render a single feature.
- Define its own props.
- Remain independent from other modules.
- Avoid accessing global state directly.

---

## Registration

Modules are automatically registered during application startup.

```
createFoundation()
        │
        ▼
registerModules()
        │
        ▼
ModuleRegistry
```

After registration, modules are available through their alias.

---

## CMS Mapping

The CMS only needs to return the module alias.

Example:

```json
{
  "alias": "hero",
  "data": {
    "title": "Welcome"
  }
}
```

The renderer resolves the alias using the registry and renders the corresponding component.

---

## Future Evolution

Modules may later support:

- validation
- data transformation
- lazy loading
- variants
- feature flags
- wrappers

These additions should remain internal to the module without changing the renderer.
