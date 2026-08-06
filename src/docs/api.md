Page Definition API
Overview

The frontend never consumes CMS-specific responses.

Every page must be transformed into a common structure called Page Definition.

The Renderer only understands this structure.

This makes the frontend independent from the CMS implementation.

Page Definition
PageDefinition
│
├── meta
├── page
├── globals
└── regions
Meta

Contains information required to render the current request.

Examples:

locale
seo
robots
canonical
status

Example:

{
"locale": "en",
"status": "published",
"seo": {}
}
Page

Contains information about the current page.

Examples:

id
title
slug
template

Example:

{
"id": "home",
"title": "Home",
"slug": "/"
}
Globals

Contains global data shared across the application.

Examples:

Theme
Header
Navigation
Footer
Settings

Example:

{
"theme": {},
"header": {},
"navigation": {},
"footer": {}
}
Regions

A page is composed of one or more regions.

Examples:

main
sidebar
footer
modal

Each region contains one or more modules.

Example:

{
"main": [
{
"id": "hero-home",
"alias": "hero",
"data": {}
},
{
"id": "services-home",
"alias": "services",
"data": {}
}
]
}
Module Definition

Every renderable module follows the same structure.

{
"id": "hero-home",
"alias": "hero",
"data": {}
}
id

Unique identifier of the module instance.

Useful for:

analytics
anchors
tracking
animations
alias

Unique module identifier.

The Renderer uses the alias to resolve the correct module.

Example:

hero
│
▼
Module Registry
│
▼
Hero Module
│
▼
Hero Component
data

Contains all information required by the module.

The Renderer never reads this object.

It simply forwards it to the module.

Renderer

The Renderer is responsible for:

Receiving a Page Definition.
Rendering globals.
Rendering every region.
Resolving each module using the Module Registry.
Rendering the final React tree.

The Renderer never depends on the CMS implementation.
