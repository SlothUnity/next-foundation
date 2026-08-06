# Architecture

## Overview

Next Foundation is built around a small set of core concepts that work together to render a page from a CMS response.

```
CMS / API
    │
    ▼
PageDefinition
    │
    ▼
PageRenderer
    │
    ▼
ModuleRegistry
    │
    ▼
Module
    │
    ▼
React Component
```

The goal is to keep every responsibility isolated.

- **Foundation** manages the application lifecycle.
- **Registry** stores every available module.
- **Renderer** builds the page.
- **Modules** are independent and reusable.
- **CMS** only provides data.

---

## Folder Structure

```
src/
├── app/
├── core/
│   ├── foundation/
│   ├── modules/
│   ├── registry/
│   ├── renderer/
│   └── setup/
│
├── modules/
│   ├── hero/
│   ├── navigation/
│   └── footer/
│
├── mocks/
│
├── types/
│
└── utils/
```

---

## Foundation

The Foundation is the application's entry point.

It creates and configures all framework services.

Current responsibilities:

- Create the Module Registry.
- Register all available modules.
- Provide shared services to the renderer.

Future responsibilities:

- Theme management
- API Client
- Adapters
- Internationalization
- Plugins
- Global configuration

---

## Registry

The Registry stores every module available in the application.

Each module is registered once during startup.

The renderer never imports modules directly.

Instead, it asks the registry for the module matching a given alias.

---

## Renderer

The renderer receives a `PageDefinition`.

Its responsibility is only to translate that definition into React components.

It does not know where the data comes from.

---

## Modules

Every feature is implemented as an isolated module.

Examples:

- Hero
- CTA
- Navigation
- Footer
- Services
- Testimonials

Modules can be developed independently and reused across multiple projects.

---

## CMS

The CMS is responsible only for content.

It returns a page definition containing:

- page metadata
- navigation
- main modules
- footer

The frontend decides how each module is rendered.
