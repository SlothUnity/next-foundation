Architecture
Overview

Next Foundation is a modular frontend framework built with Next.js.

Its purpose is to provide a reusable foundation for building websites and web applications while keeping the frontend independent from the CMS.

The CMS is responsible for managing content.

The frontend is responsible for rendering that content.

Core Principles
Modular

Every feature is implemented as an independent module.

A module can provide:

React components
CMS integration
Services
Hooks
Types
Utilities

Modules should be reusable and should not depend on other modules whenever possible.

Headless

The frontend never depends directly on the CMS implementation.

The CMS only provides structured data.

The frontend decides how to render it.

Renderer Driven

Pages are not hardcoded.

A page is described by a JSON object returned by the CMS.

The Renderer transforms that JSON into a React component tree.

Component Driven

UI components are independent from business logic.

Reusable components live inside components.

Feature-specific components live inside their own module.

Extensible

The framework should allow new modules to be added without changing the Core.

The only requirement is that every module follows the same contract.

Architecture
Request
│
▼
Next.js Router
│
▼
Page Renderer
│
▼
Page Definition
│
▼
Module Registry
│
▼
React Components
│
▼
HTML
Responsibilities
Next.js
Routing
Rendering
Server Components
API Routes
Renderer
Resolve the requested page
Load the page definition
Resolve modules
Render the page
Registry

The Registry maps a module alias to its implementation.

Example:

hero → Hero Module

navigation → Navigation Module

footer → Footer Module

Modules

Each module is responsible for a single feature.

Examples:

Hero
Header
Navigation
Footer
Forms
Components

Reusable UI components.

Examples:

Button
Input
Modal

These components do not know anything about the CMS.
