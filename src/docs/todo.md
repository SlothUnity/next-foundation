Next Foundation — Development Summary (Sprint 1 & 2)
Project Vision

Next Foundation is a reusable framework built on Next.js for CMS-driven websites.

The objective is to separate content from implementation so that every project shares the same architecture while allowing completely different designs, themes and modules.

The CMS is responsible only for content and page composition.

The frontend is responsible for rendering.

Core Principles

The project follows these principles:

Small and independent modules.
Clear separation of responsibilities.
Strong typing.
Framework first, project second.
Everything should be replaceable (CMS, API, themes, adapters...).
Avoid premature abstraction.
Add complexity only when there is a real need.
Current Architecture
CMS (future)
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

The rendering pipeline is now fully functional.

Current Folder Structure
src/

app/

core/
foundation/
modules/
registry/
renderer/
setup/

modules/
hero/

mocks/

types/
Foundation

The Foundation is the application's root object.

Current responsibility:

create the ModuleRegistry
register every available module

Current API:

const foundation = createFoundation();

Future responsibilities:

configuration
themes
adapters
API client
plugins
internationalisation
Registry

A generic Registry implementation exists.

ModuleRegistry extends Registry and stores every registered module.

Modules are registered automatically during Foundation creation.

Current flow:

createFoundation()

↓

registerModules()

↓

ModuleRegistry
Renderer

PageRenderer receives:

PageDefinition
ModuleRegistry (planned to become Foundation)

The renderer:

renders navigation
renders every module inside main
renders footer

renderModule():

resolves the alias
gets the registered module
renders its component

Current rendering flow:

PageDefinition

↓

PageRenderer

↓

renderModule()

↓

ModuleRegistry

↓

Hero Component

The first module is successfully rendered.

Modules

Current module structure:

hero/

components/
Hero.tsx

types/
Hero.ts

module.ts

index.ts

Every module exports:

alias
name
component

using:

defineModule(...)

Modules are automatically registered.

Mocks

Pages are currently loaded from:

mocks/pages/

Example:

home.ts

This replaces the future CMS while the architecture is developed.

Important Architectural Decisions 1.

The objective was never to build a Hero component.

The objective was to validate the complete rendering pipeline.

That milestone has now been achieved.

2.

The Core should know as little as possible.

The Renderer should only render.

The Registry should only resolve modules.

Modules should contain implementation details.

3.

Avoid over-engineering.

Several abstractions (render(), factories, wrappers...) were intentionally postponed until they solve a real problem.

4.

The current architecture is considered a functional MVP.

Future improvements will strengthen contracts rather than redesign the Core.

Known Technical Debt

These are intentional and accepted.

Module validation

Currently module props are cast.

Future direction:

Every module will expose a validation schema.

Example:

Hero

↓

HeroSchema

↓

HeroProps (derived)

↓

Component

The renderer will validate CMS data before rendering.

PageSource

Currently:

Mocks

↓

PageRenderer

Future:

PageSource

↓

MockPageSource

PayloadPageSource

FilesystemPageSource

↓

PageRenderer

The renderer should never know where data comes from.

Foundation Singleton

Currently:

createFoundation()

is called directly.

Future:

The Foundation should become a singleton shared across the application.

Error Handling

Unknown module aliases currently throw an exception.

Future behaviour:

Development:

throw immediately

Production:

log warning
skip the invalid module
Tests

No tests exist yet.

Priority tests:

Registry duplicate aliases
Unknown module alias
Renderer output
Module rendering
CI

Planned after the architecture stabilises.

Deferred Features

These are intentionally postponed.

Payload CMS Adapter
Theme Engine
API Client
Plugins
Lazy loading
Internationalisation
Dynamic routing
SEO integration
Open Questions
PageDefinition

Current:

navigation
main
footer

Possible future:

regions: Record<string, ModuleInstance[]>

Decision postponed until layouts become more complex.

Module Contract

Current:

component

Possible future:

schema
transform()
render()

Decision postponed until validation is introduced.

Development Strategy

The project now follows this rule:

Never introduce an abstraction before it solves a real problem.

Every architectural decision should answer:

Does this solve an existing problem?
Will changing it later be expensive?
Can it be implemented without rewriting the Core?

Only if all answers are positive should the architecture evolve.

Current Status

Completed:

Next.js setup
TypeScript
ESLint
Prettier
Husky
lint-staged

Core:

Foundation
Registry
ModuleRegistry
Renderer
Module registration
Mock pages

Modules:

Hero
Automatic registration
Successful rendering

The architecture has successfully validated the complete rendering flow.

The project is now ready to begin strengthening contracts (PageSource, schemas and validation) instead of redesigning the Core.
