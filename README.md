# Lowrider.js

##### (To see Lowrider.js in action, check out Hydra Media Center)

Lowrider.js is a web component class written for Hydra Media Center that aims to
simplify working with web components in a completely vanilla JavaScript
envrionment.

It does this by providing methods for managing the **lifecycle** and **state** of
your web components, which normalizes their behavior, providing you with a more
predictable foundation upon which to build your components.

Lowrider.js is not a framework. It's only job is to implement a few critical
core concepts.

## Component Lifecycle

Working with a web component's lifecycle is simplified by breaking down the
rendering process into a few distinct steps. This section may seem daunting, but
in reality, all of this happens behind the scenes.

The table below maps each lifestyle step to a hook and a verb class method.

| Step          | Hook        | Method (verb) |
|---------------|-------------|---------------|
| spawn         | `onSpawn()` | `spawn()`     |
| build         | `onBuild()` | `build()`     |
| load          | `onLoad()`  | `load()`      |

**<ins>tl;dr of Each Step</ins>:**

1. `spawn` - Always the first step triggered when an Element instance is
   created in the document, or the component's `render()` method is called. Can
   be thought of as a "pre-innerHTML-render" hook.
2. `build` - Builds the inner HTML of the web component. Expensive queries
   should be performed here, as the results of this step are what's cached.
   Whether this step runs or not is determined by the component's `shouldBuild()`
   method, which determines if this instance already has cached data and whether
   it should perform a full render. By default, it checks for the existance of
   any inner HTML.
3. `load` - Triggered after all child Elements, *and their children*, have
   rendered. The *waiting for children* part only works if all the child
   Elements are either native HTML elements (`div`, `span`, etc), or they are
   instances of Lowrider.js.

Lowrider.js's main benefit is that it will automatically manage these
lifecycle events for you, and only trigger the appropiate hooks when
necessary.

**<ins>Detailed Breakdown of Each Hook</ins>:**

#### `.onSpawn()`
- Usage:
  - The `spawn` event is the very first step in the rendering process. It is
    triggered immediately after the custom Element is inserted into the DOM,
    before the Element has been painted onto the screen. Your `onSpawn`
    method should be the "brains" of the Element, and can handle loading
    dynamic data that's required during the entire lifecycle of the Element.
    Do not interact with innerHTML during the spawn step.
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
  - The `spawn` event should not create any new inner HTML (it will overwrite
    what may have been cached).
  - The `onSpawn` method can be used to register event handlers directly on
    the custom Element, to determine context, to load internal data, to
    register IPC listeners, MutationObservers, and more.
- Real life example:
  - If you were making a todo list application, this step could be used to
    register event listeners directly on the `<todo-list>` itself (**not** on
    child HTML), or to register an attribute observer. A simple todo app
    could completely omit this step.

#### `.onBuild()`
- Usage:
  - The `build` event triggers after the `spawn` event has completed. Your
    `onBuild` method should create the "body" of the instance by injecting inner
    HTML. The HTML may come from a .html file on the local disk, from a XHR
    request, or may be statically typed within the class definition. This method
    should always perform a "fresh" build and overwrite any preexisting child
    HTML. Other Elements should be able to invoke your Lowrider.js included
    `build()` method and the result should be a fresh build every time.
- Solves these issues:
  - When loading pre-rendered custom Elements from cache, it is necessary to
    maintain the state of the pre-rendered HTML. To do that, we must be able
    to block the Element from rendering when it's being loaded from cache.
    This is easy when the rendering logic is separate from all other logic.
    It also prevents needless XHR requests when we already have the data.
- Tips:
  - The `onBuild` method is the right place for the heaviest work of your
    component.
  - Do not register event handlers in the `onBuild` hook, because they won't
    fire on subsequent reloads of this instance from cache. Defer your event
    handler registration to the `onLoad` step, which guarentees that everything
    from this step has rendered.
- Real life example:
  - A todo list application should definitely use this step to query the
    database for the contents of the todo list, and any other data that needs
    to be shown. It should also use this step to build the inner HTML and
    inject it into the DOM. These are the heaviest tasks of the todo list,
    and it's what we would want to be cached.

#### `.onLoad()`
- Usage:
  - This is triggered after this instance, and all child Lowrider.js/vanilla
    Elements have rendered (only when **all child custom Elements** extend
    Lowrider.js).
- Solves these issues:
  - One issue with web components and the light DOM is that when you use custom
    Element "A" to inject custom Element "B", code execution within "A" does not
    wait for "B" to render *its own inner HTML*. The top-level
    `connectedCallback()` of "B" will have executed, but any subsequent Promises
    or callbacks will still be executing. The `onLoad` callback fixes this and
    will only fire after child custom Elements have rendered *their* inner HTML.
    When all of your child custom Elements extend Lowrider, you can be sure that
    the entire chain of child Elements has rendered before "A"s `onLoad`
    triggers.
- Tips:
  - In general, web components should avoid registering event handlers on the
    contents of other web components. A DOM nodes concerns should be scoped
    to within its own component.
- Real life example:
  - A todo list application would use this step to register event handlers on
    its rendered inner HTML. They could be drag-n-drop handlers, clicks, or
    whatever else. This is the right time to interact with inner HTML.

#### `onRemoved()`
- Usage:
  - This is triggered when the Element is removed from the DOM.
- Tips:
  - Use this to clean up any delegated event handlers, IPC listeners,
    EventEmitters, and MutationObservers.
- Real life example:
  - A todo list application would proabably omit this step (event handlers
    would be automatically removed when those nodes are removed), but could
    use this step to perform last second writes to the database to record
    user interaction.

## Component State

Managing component state is complicated by caching. While Lowrider.js does not
provide a built-in cache storage, it is prepared for you to cache your
components by saving their **outerHTML** property. When you cache a component
this way and reinject it, Lowrider.js will detect the existing innerHTML, and
the `build` event will not trigger.

Each component can use a custom render checker. Simply overwrite Lowrider.js's
built in `shouldRender()` method with your own when extending the Lowrider class
and make sure your method returns a boolean.

## Typical Component Experience:

The typical experience that you can expect to deliver to your users is:

1. User loads HTML document with Lowrider.js components.
2. Each Lowrider.js component goes through it's `spawn`, `build`, and `load`
   steps, since this is the first load of the document.
3. The user may interact with a component, changing its state. Perhaps a table
   is sorted after a click, or maybe more data is injected via AJAX.
4. The user navigates away to a new page...
5. ...But before you load the new page for the user, you cache the `outerHTML`
   property of the web component that the user interacted with.
6. The user eventually navigates back to the same page from before, but instead
   of loading a fresh component instance, you reinject the previously cached `outerHTML`.
7. Lowrider.js automatically detects this, and does not trigger the `build` step
   of your component. Your component is loaded in its preserved state.

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

// your component will automatically have these methods and properties,
// they are the public API of your Element instances.
// do not overwrite them (but you can if you know what you're doing)
let songListElement = document.querySelector('song-list')

// since Elements automatically render upon injection in the DOM,
// calling `render()` is always technically are*render
songListElement.render(options) // you can give options to render()

// you can trigger individual lifecycle steps if you want, but this
// isn't normally needed
songListElement.spawn()
songListElement.build()
songListElement.load()

// watch certain attributes of this instance
songListElement.watchAttr(['id'])

// enable infinite scroll on this instance
songListElement.supportInfiniteScroll()

// "Interacting" state, implemented specifically for Hydra Media Center
songListElement.supportInteractingState()
songListElement.enterInteractingState()

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

Lowrider.js comes with a static method that can create web component
instances with data pre-bound to them. This is especially useful when you
have a parent-child relationship between two components, and the child is
designed to spawn with data from the parent that cannot be stringified
(functions, Element references, etc), or is too large to fit into an element
attribute when stringified.

Usage:
```javascript
import Lowrider from 'Lowrider'

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
   - This anti-pattern is solved by the `Lowrider.elementFactory()`, which
     you can use to pre-bind your data to the component.
- It is easy to accidentially create infinite loops by watching an attribute
  that triggers a render, and in the render setting/updating that attribute.

## Disadvantages

This section aims to bring attention to things that might make you not want to use
Lowrider.js, to save you from having to find out on your own after putting time into it.

- Since there is no virtual DOM, Lowrider.js feels *very* fast. But, virtual
  DOM's exist for a reason, and you should make sure you don't need one before
  adopting Lowrider.js.
  
  Without a virtual DOM, your web component can only exist in the real DOM...
  the one the user sees. If you want to have "background" components, you'll
  need to hide them with CSS, and they can't execute code until they exist in
  the DOM.
- Lowrider.js is designed for use with the light DOM and hasn't been tested with
  the Shadow DOM.