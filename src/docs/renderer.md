# Renderer

## Overview

The renderer converts a `PageDefinition` into a React page.

It is completely independent from the CMS.

---

## Rendering Flow

```
PageDefinition
      │
      ▼
PageRenderer
      │
      ▼
renderModule()
      │
      ▼
ModuleRegistry
      │
      ▼
Module Component
```

---

## Page Structure

A page consists of three sections.

```
Navigation

Main
 ├── Hero
 ├── Services
 ├── CTA
 └── Gallery

Footer
```

Only the modules inside `main` are rendered as a collection.

Navigation and Footer are rendered separately.

---

## Module Resolution

Each module instance contains an alias.

Example:

```json
{
  "alias": "hero",
  "data": {
    "title": "Next Foundation"
  }
}
```

The renderer asks the `ModuleRegistry` for the matching module.

If the alias is not registered, an error is thrown.

---

# API

## Current State

The framework currently uses local mock data.

```
Mocks
    │
    ▼
PageDefinition
    │
    ▼
PageRenderer
```

---

## Future API Flow

The renderer will remain unchanged when a CMS is introduced.

Only the data source changes.

```
CMS
    │
    ▼
API Client
    │
    ▼
PageDefinition
    │
    ▼
PageRenderer
```

This separation keeps rendering independent from transport and storage.

---

## Expected Response

The API should return a page definition containing:

- metadata
- navigation
- main modules
- footer

The frontend is responsible for resolving module aliases and rendering the page.
