# Lowrider.js

*To see Lowrider.js in action, check out the
[Cardinal apps](https://cardinalapps.xyz).*

**Lowrider.js** is a JavaScript library that aims to simplify working with [Web
Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components) in a
completely vanilla environment.

Specifically, it implements a **[component lifecycle](#component-lifecycle)**
that makes Web Components more reusable and flexible, especially when being used
together to create a single-page application.

Lowrider.js also provides unopinionated functionality for building single-page
applications, such as HTML5 drag-and-drop, infinite scroll, content caching,
content rendering, and more.

## Component Lifecycle

Lowrider.js implements a straightforward 3-step rendering process. Each step has
a distinct purpose, and using Lowrider.js efficiently means using these steps correctly.

#### 3-Step Lifecycle

1. `spawn` - The Web Component has entered the DOM, but has not yet rendered.
2. `build` - The Web Component should build itself (i.e., inject inner HTML).
3. `load` - The Web Component's inner HTML **and all child Web Components** will
   render.

This design alleviates many pain points that vanilla Web Components
suffer from, like 