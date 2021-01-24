# Lowrider.js

##### (To see Lowrider.js in action, check out Hydra Media Center)

Lowrider.js is a web component class written for Hydra Media Center that aims to
simplify working with web components in a completely vanilla JavaScript
envrionment.

It does this by providing methods for managing the **component lifecycle** and
**component state**, which normalizes their behavior, providing you with a more
predictable foundation upon which to build your components.

Lowrider.js is not a framework. It's only job is to implement a few critical
core concepts.

## Component Lifecycle

Working with a web component's lifecycle is simplified by breaking down the
rendering process into a few distinct steps. This section may seem daunting, but
much of this happens behind the scenes.

The table below maps each lifecycle step to a hook and a verb class method.

| Event         | Hook          | Method (verb) |
|---------------|---------------|---------------|
| spawn         | `onSpawn()`   | `spawn()`     |
| build         | `onBuild()`   | `build()`     |
| load          | `onLoad()`    | `load()`      |
| removed       | `onRemoved()` | -             |

**<ins>Component Lifecycle tl;dr:</ins>:**

1. `spawn` - Always the first step triggered when an Element instance is
   created in the document, or the component's `render()` method is called. Can
   be thought of as a "pre-innerHTML-render" hook.
2. `build` - Builds the inner HTML of the web component. Expensive logic
   should be performed here. This step is skipped when loading cached
   components, making them feel very fast.
3. `load` - Triggered after all child Elements, *and their children*, have
   rendered. The *waiting for children* part only works if all the child
   Elements are either native HTML elements (`div`, `span`, etc), or they are
   instances of `Lowrider`.

Lowrider.js's primary benefit is that it will automatically manage these
lifecycle events for you, and only trigger the appropiate events when
necessary.

### Lifecycle Event Hooks

Lifecycle **hooks** are used to react to the lifecycle events of your
Lowrider.js component. Properly separating your component's code into the
appropiate hooks is crucial for building components that behave in the ways that
you expect after reading this documentation.

When the component is first created (inserted into the DOM), it will run through
the `spawn`, `build`, and `load` lifecycle events and trigger the associated
hooks that you've implemented, which should result in a fully functional web
component. Each event waits for the previous one to finish during the rendering
process.

When a component is removed from the DOM, the `removed` event triggers. This
event triggers *before* the actual removal, so you still have access to
component data in this hook.

When a component is reinserted into the DOM with a cached state, the `build`
event does not trigger, allowing for much faster rendering using cached data.
The `spawn` and `load` events will still trigger. Efficiently separating
your code between these three events is the art of using Lowrider.js.

Ultimately, Lowrider.js implements a reliable and efficient 'render -> cache ->
rerender-from-cache' cycle that is ready for complex logic to be built upon.

#### `.onSpawn()`
- Usage:
  - The `spawn` event is the very first step in the rendering process. It is
    triggered immediately after the custom Element is inserted into the DOM,
    before the Element has been painted onto the screen.
- Solves these issues:
  - When loading a pre-rendered custom Element from cache, the instance will
    no longer have any dynamic data because the Element itself was removed
    from the DOM, which makes the browser erase it from memory. The spawn
    event should be used to (re)initialize the dynamic data that your component
    needs.
- Tips:
  - Keep the spawn event as lightweight as possible because many of them will
    trigger at the same time if there are many instances of the Element in
    the DOM, even when loading from cache.
  - The `spawn` event should not create any new inner HTML, or even attempt to
    interact with inner HTML.
  - The `onSpawn` method can be used to register event handlers directly on
    the custom Element, to determine context, to load internal data, to
    register IPC listeners, MutationObservers, and more.
- Real life example:
  - If you were making a todo list application, this hook could be used to
    register event listeners directly on the `<todo-list>` itself (**not** on
    child HTML), or to register an attribute observer. A simpler todo app
    could completely omit this hook.

#### `.onBuild()`
- Usage:
  - The `build` event triggers after the `spawn` event has completed. Your
    `onBuild` method should create the "body" of the instance by injecting inner
    HTML. Typically, HTML may come from a .html file on the local disk, from a
    XHR request, or may be statically typed within the class definition. This
    method should always perform a "fresh" build and overwrite any preexisting
    inner HTML.
- Solves these issues:
  - When loading cached components, it is necessary to maintain the state of the
    cached HTML. This is easy when the rendering logic is separate from all
    other logic. It also prevents needless network requests when we already have
    the data.
- Tips:
  - The `onBuild` method is the right place for the heaviest work of your
    component.
  - Do not register event handlers in the `onBuild` hook, because they won't
    fire on subsequent reloads of this instance from cache. Defer your event
    handler registration to the `load` event, which guarentees that everything
    from this step has rendered.
- Real life example:
  - A todo list application should definitely use this hook to query the
    database for the contents of the todo list, and any other data that needs
    to be shown. It should also use this hook to build the inner HTML and
    inject it into the DOM. These are the heaviest tasks of the todo list,
    and it's what we would want to be cached.

#### `.onLoad()`
- Usage:
  - This is triggered after this instance, and all child Lowrider.js/vanilla
    Elements have rendered (only when **all child custom Elements** extend
    `Lowrider`).
- Solves these issues:
  - One issue with web components face in the DOM is that when you use custom
    Element "A" to inject custom Element "B", code execution within "A" does not
    wait for "B" to render *its own inner HTML*. The top-level
    `connectedCallback()` of "B" will have executed, but any subsequent Promises
    or callbacks will still be executing. The `onLoad` callback fixes this and
    will only fire after child components have rendered *their* inner HTML. When
    all of your child custom Elements extend Lowrider, you can be sure that the
    entire chain of custom Elements has rendered before "A"s `onLoad` hook
    triggers. This makes working with nested components easier.
- Tips:
  - In general, web components should avoid registering event handlers on the
    contents of other web components. A DOM node's concerns should be scoped
    to within its own component.
- Real life example:
  - A todo list application would use this step to register event handlers on
    the inner HTML, because we can be certain that is has rendered by this
    point. They could be drag-n-drop handlers, clicks, or whatever else. This is
    the right time to interact with inner HTML.

#### `onRemoved()`
- Usage:
  - This is triggered when the Element is removed from the DOM. There is no
    Lowrider.js verb method for this event; instead use the native DOM methods
    for removing Elements.
- Tips:
  - Use this to clean up any delegated event handlers, IPC listeners,
    EventEmitters, or MutationObservers.
  - This fires before the actual removal of the Element, so you still have
    access to its state.
- Real life example:
  - A todo list application would proabably omit this step (event handlers would
    be automatically removed when those nodes are removed), but could use this
    step to perform last second writes to the database to record data.

## Component State

(Hydra Media Center uses `hydra-ui-router` to perform the caching of Lowrider.js
components.)

Managing and maintaining a components state is a critical part of building an
application. While Lowrider.js does not provide a built-in cache storage, it is
prepared for you to cache your components by saving their **outerHTML**
property. When you cache a component this way and reinject it, Lowrider.js will
detect the existing innerHTML, and the `build` event will not trigger.

Each component can use a custom render checker. Simply overwrite Lowrider.js's
built in `shouldRender()` method with your own when extending the Lowrider class
and make sure your method returns a boolean.

## Usage example

```javascript
import Lowrider from './Lowrider.js/'

// create a class that extends the Lowrider class
class SongList extends Lowrider {
  // you can implement these methods
  onSpawn(renderOpts) {}
  onBuild(renderOpts) {}
  onLoad(renderOpts) {}
  onRemoved(renderOpts) {}
  shouldBuild() {}
}

// register your custom Element with the browser
window.customElements.define('song-list', SongList)

// inject the Element anywhere in your document body,
// it will automatically perform a full render, which
// begins by invoking your `onSpawn` method.
document.body.innerHTML = '<song-list></song-list>'

let songListElement = document.querySelector('song-list')

// you can trigger individual lifecycle steps if you want, but this
// isn't normally needed
songListElement.spawn()
songListElement.build()
songListElement.load()

// watch certain attributes of this instance.
songListElement.watchAttr(['data-list', 'data-date'], () => {
  console.log('data-list or data-date changed')
})

// enable infinite scroll on this instance
// (arguments are not defined in this example)
songListElement.supportInfiniteScroll(() => {
  console.log('user scrolled to near the bottom of this element')
})

// "Interacting" state, implemented specifically for Hydra Media Center
songListElement.supportInteractingState()
songListElement.enterInteractingState()

// since Elements automatically render upon injection in the DOM,
// calling `render()` is always technically a *rerender*
songListElement.render(options) // you can give options to render()

// one-way text binding with child Elements
songListElement.props.title = 'Hello'
```

## Using `props`

Lowrider.js web components have a property called `props`. This property is
an object that can be used for for one-way data binding with inner HTML.

**Do not overwrite the `props` property itself, it is a special proxied
object.**

Example:

```javascript
// in the inner HTML:
<p data-prop="listName"></p>

// in the Element instance
this.props.listName = 'Playlist 1'
```

## Dynamically creating live components (`Lowrider.elementFactory()`)

Lowrider.js comes with a static method that can create web component instances
with data pre-bound to them. This is especially useful when you have a
parent-child relationship between two components, and the child is designed to
spawn with data from the parent that cannot be stringified (e.g., functions,
object refs, Element refs), or is too large to fit into an element attribute
when stringified.

Usage:
```javascript
import Lowrider from './Lowrider/'

// in the parent component, create a child component with pre-bound data
let childEl = Lowrider.elementFactory('child-element', {
  'bindings': {
    'speak': () => { console.log("Help I'm alive") }
  }
})

// insert child, the lifecycle events will trigger for the first time
parentNode.appendChild(childEl)

childEl.speak() // "Help I'm alive"
```

## Common Pitfalls

- Do not try to inject an "empty" component, then on the next line call it's
  `render(data)` function.
   - You are actually rendering twice, and even if you lock down your
     component to not render unless it has that custom `data` given through
     `render(data)`, you will run into issues when loading from the cache
     because the `render()` function is not called at all, so you won't have
     your custom `data`.
   - Since Lowrider components wait for their children to render, you will
     almost surely call `render(data)` before `onLoad()` triggers in the
     first render when the element was inserted, leaving your component
     partially rendered before rerendering, potentially creating an undesired
     state.
   - This anti-pattern is solved by `Lowrider.elementFactory()`, which you can
     use to pre-bind your data to the component.
- It is easy to accidentially create infinite loops by watching an attribute
  that triggers a render, and in the render setting/updating that attribute.

## Disadvantages

This section aims to bring attention to things that might make you not want to use
Lowrider.js, to save you from having to find out on your own after putting time into it.

- Since there is no virtual DOM, Lowrider.js feels *very* fast. But, virtual
  DOM's exist for a reason, and you should make sure you don't need one before
  adopting Lowrider.js.
  
  Without a virtual DOM, your web components can only exist in the real DOM...
  the one the user sees. If you want to have "background" components, you'll
  need to hide them with CSS, and they can't execute code or listen for events
  until they exist in the real DOM.
- Lowrider.js is designed for use with the light DOM and hasn't been tested with
  the Shadow DOM.