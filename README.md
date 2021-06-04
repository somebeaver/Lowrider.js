# Lowrider.js

*To see Lowrider.js in action, check out [Cardinal
apps](https://cardinalapps.xyz).*

**Lowrider.js** is a small dependency-free ES6 JavaScript library that enhances
[Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components) by
implementing a **[lifecycle](#lifecycle)** that turns them into stateful,
reusable, powerful components for building single-page applications.

Lowrider.js also provides unopinionated functionality for:
 - [Lazy rendering](#lazy-rendering)
 - [Render queueing](#render-queueing)
 - [User interaction detection](#interacting-state)
 - [Component factory](#programmatic-creation)
 - [Easy string insertion](#using-the-props-property)
 - [Attribute watching](#attribute-watching)
 - [Infinite scroll](#infinite-scroll)
 - [File drag and drop (drop zone)](#drop-area)
 - Singletons
 - And more

## API Reference

For documentation about Lowrider.js methods, see **[DOCS.md](DOCS.md)**.

## Terminology

Throughout this documentation and source code, these words are defined as:

- `component` - When referring to a DOM Element, it **always** means one that
    extends the `Lowrider` class. Otherwise, it refers to the concept of
    application components in general.
- `Element` - When capitalized, it **always** refers to a DOM Element instance.
- `element` - When lowercase, it refers to DOM elements in general.

## Concepts

Lowrider.js's features revolve around one main concept: the component lifecycle.
Certain things can only happen at certain stages of a component's lifecycle; so
understanding the lifecycle is key to writing efficient Lowrider.js components.

### Lifecycle

Lowrider.js web components begin existing at DOM insertion and stop existing at
DOM removal; everything that happens in between is the lifecycle. Reacting to
**[lifecycle events](#lifecycle-events)** with **[hooks](#hooks)** is how
Lowrider.js components come to life.

Just like vanilla web components, Lowrider.js components only exist in memory
while they exist in the DOM. As such, lifecycle events can only happen while the
component exists in the DOM, and Lowrider.js's true power is in how it
automatically manages these events to **maintain component state** while the
component enters/exits/reenters the DOM, **optimize rendering**, and **remove
the need for a virtual DOM**.

#### Lifecycle Events

0. *An instance of the component (custom element that extends `Lowrider`) is inserted into the DOM.*
1. **`spawn`** - Immediately, the `spawn` event fires. The component knows of
   its own existance and the document in which it lives.
2. **`build`** - Immediately after spawning is completed, the component enters the
   `build` lifecycle event. It should now build itself (i.e., query an
   API, inject inner HTML, spawn more components). This step is **skipped** when
   using a cached component.
3. **`load`** - One event loop tick after building is completed, the component
   enters the `load` lifecycle event. It can now manipulate its child
   HTML, and should listen for user interaction, or wait for DOM removal.
4. **`removed`** - Final moments before the component is removed from the DOM
   and memory.

**Together, steps 1, 2, and 3 make up the "rendering process" that all
components immediately go through when inserted into the DOM.**

*Note:* Lowrider.js provides a `render()` method, but since web components
automatically render themselves upon DOM insertion, the method does not need to be
invoked unless you want to *re*render. More on the [render method](#render).

### Hooks

Hooks are called by Lowrider.js when certain lifecycle events happen. Hooks
should always be `async` functions, or if not, must return a `Promise`. Have the
hook return or resolve false (*not* `reject()`) to stop rendering the
component.

For each lifecycle event, there is a hook.

1. **`onSpawn`**
  - Use the onSpawn() hook to perform the component's initial setup.
  - Example tasks: registering event handlers or mutation observers on itself;
    initial component setup.
  - **Do not** insert inner HTML, do not look downward in the DOM, do not perform
    expensive tasks.
  - **Do** keep this hook as lightweight as possible.
2. **`onBuild`**
  - Use the onBuild() hook to perform the heavy lifting of the component's
    rendering process. This step is skipped when the component is loaded with
    cached internals, which allows the app to maintain component state between
    DOM insertions and removals.
  - Example tasks: fetching remote data; big loops.
  - **Do not** initialize new internal properties.
  - **Do** overwrite inner HTML on each build.
3. **`onLoad`**
  - Use the onLoad() hook to perform after-build tasks and to interact with
    child HTML and components. This hook should be designed to work with the
    component in any expected state, as the component may have been loaded with
    cached contents.
  - Example tasks: manipulating inner HTML, registering event listeners on child
    DOM nodes.
  - **Do not** perform expensive tasks.
  - **Do** make sure that this step is prepared to work with the inner HTML in
    any state. For example, if a component contains pagination, it may now be on
    any page since user interaction state will be maintained with the cache.
4. **`onRemoved`**
  - Use the onRemoved() hook to react to a removal event. The removal cannot be
    stopped. The component will be removed from the DOM and from memory. Does
    not trigger when the user closes the browser.
  - Example tasks: removing event listeners on other non-child elements.
  - **Do not** use this to save on-close state.

### Caching

Since web components cannot exist outside of the DOM, the components themselves
cannot be tasked with caching their own contents. Instead, that responsibility
typically falls to the UI's router or a purpose built module.

Lowrider.js is flexible and can work with anything that can stringify HTML. As
long as the component author utilizes the lifecycle hooks properly, Lowrider.js
components can dissappear from the DOM and memory, then reappear as if they
never left at all. Of course, while they're gone, their code won't execute.

Lowrider.js was designed for use with
[router.js](https://github.com/somebeaver/router.js), an open source
unopinionated UI router for single-page applications written by the same
developer, and optimized for use with Lowrider.js.

#### But Really, Where Does the State Go?

If the component is removed from memory, how can it come back in the same state?
It's really just a mix of Lowrider.js features and component authoring patterns.

The job of the caching module is to preserve a component by saving its
`outerHTML` property. It's crucial to save its attributes and its inner HTML.
Together, they *are* the state, and a properly authored component should be able
to initialize itself using that state, or from scratch. It is up to the
developer to ensure that they don't create any important dynamic component
properties that get lost when the instance is removed; instead, make sure those
things are saved as attributes.

Note that Lowrider.js is not tested for use with the shadow DOM.

## Registering Components

Registering a Lowrider.js component is no different than with vanilla Web
Components, except that it uses the `Lowrider.register()` static method to do
so. Your class must always extend Lowrider.

```javascript
import Lowrider from 'Lowrider.js'

// everything that a basic Lowrider.js component needs
class MyElement extends Lowrider {
  async onSpawn() {}
  async onBuild() {}
  async onLoad() {}
  async onRemoved() {}
}

// register it with the browser
Lowrider.register('my-element', MyElement)
```

Components only need to be registered once, then can be used in the DOM. Trying
to register a component that was already registered will throw in an error.

Lowrider.js components can also be registered with vanilla JS, as long as the class
extends `Lowrider`.

### Creating Component Instances

Once a web component has been registered with the document, instances of it can
be created. There are two ways to do so.

Typically, this is done by inserting statically typed HTML into the DOM, and
doing so will trigger the rendering process. Elements can be inserted naked,
with attributes, and/or with inner HTML. When an Element is inserted with inner
HTML, Lowrider.js assumes it is being loaded with cached content, and the
**build** event will **not** trigger.

Statically typed Elements can cover most use cases, but are limited by the
fact that HTML attributes can only hold a maximum amount of stringified data.

#### Statically Typed Creation

```javascript
// naked, no cache
document.body.innerHTML = '<my-element></my-element>'

// with attributes
document.body.innerHTML = '<my-element example-attr="hello"></my-element>'

// with cached contents
document.body.innerHTML = `<my-element>
                             <div class="foo">
                               <div></div>
                             </div>
                           </my-element>`
```

#### Programmatic Creation

Creating new component instances programmatically using
`Lowrider.elementFactory()` allows us to spawn them with dynamic data like
callback functions and variables that will be available to the component from
the get-go.

```javascript
import Lowrider from 'Lowrider.js'

// create a new component instance with pre-bound data
let childEl = Lowrider.elementFactory('child-element', {
  'bindings': {
    'speak': () => { console.log('I was spawned with this function reference in my properties! Wow!') }
  }
})

// insert child, the lifecycle events will trigger for the first time
someElement.appendChild(childEl)

// all bindingd are immediately available
childEl.speak()
```

The factory is designed to be used to create Lowrider.js components, but
can also be used to create standard HTML Elements (`div`, `span`, etc) with
custom properties.

## Detailed Rendering Breakdown / Rendering in Series vs. Parallel

*Note that this section is not related to lazy rendering or render queueing.
This section is a detailed description of the natural behavior of Lowrider.js
components, which is actually very similar to vanilla web components.*

Lowrider.js takes a top-down approach to UI rendering. It is import to
understand how events trigger, when they trigger, and what the events are
designed to do.

As a simple example, when `<music-app>` *(fig 1)* is **initially** inserted
into the DOM, it is empty.

```html
<!-- fig. 1: initial creation -->

<!doctype html>
<html>
  <head></head>
  <body>

    <music-app></music-app>

  </body>
</html>
```

By default, Lowrider.js handles component state caching by checking if the
component (`<music-app>`) has any inner HTML. In this case it does not, so all
three rendering process steps are triggered (`spawn`, `build`, and `load`)
because there was no cache.

**If the component is designed correctly, the `onSpawn()` hook should perform
instance initialization, the `onBuild()` hook should construct the inner HTML,
and the `onLoad()` hook should manipulate the inner HTML.** However, it is
ultimately up to the developer to decide what these things mean for each
component, and the developer has a lot of freedom in how the component comes to
life.

After the rendering process, the component may now have inner HTML *(fig. 2)*.
Or it may not, it's up to you and what your component is designed to do. In this
case, it inserts inner HTML.

```html
<!-- fig. 2: after rendering process -->

<music-app>
  <app-menu></app-menu>
  
  <section id="view"></section>

  <section id="queue">
    <music-queue></music-queue>
  </section>
</music-app>
```

With the top-down approach, the root component begins a chain of component
injection and rendering that continues until the initial state of the app is
ready. Each component goes through its own rendering process, independent of
others.

#### Rendering in Series

Breaking it down step by step, as soon as the `<music-app>` component is
injected into the DOM, it spawns, then builds, then loads. It is only **during**
the `build` event of `<music-app>` that `<music-queue>` begins its render
process. From `<music-queue>`'s perspective, it has access to the HTML that
`<music-app>` injected, but any other child components of `<music-app>` will not
have rendered yet.

So, if you wanted `<music-queue>` to be able to look upwards in the DOM and have
access to something specific from `<music-app>`, it is necessary to bind that
property during the `<music-app>` spawn process. Or, preferrably use the
[element factory](#programmatic-creation) to create the `<music-queue>` with
data pre-bound to it.

This design pattern is called rendering **in series**. Components may have
relationships and expectations of data availability.

However, it is not the nature of Web Components to wait for each other
to render. This behavior is implemented by Lowrider.js, and care must be taken
to use the hooks correctly.

#### Rendering in Parallel

The default behavior of Web Components is to render themselves with no concern
for other components in the DOM. This behaviour is encounted when inserting big
chunks of nested HTML *(fig 3)*; all components are spawned, built, and loaded
**in parallel**.

Follow the numbers to follow the order of events. Events surrounded by
tildes (`~`) denote a skipped event because Lowrider.js will think that the
component is using a cached state (beacuse of the existance of inner HTML).

It is important to understand that with parallel rendering, `(2-spawn)` does not
wait for `(1-spawn)` to **finish**. While `(2-spawn)` does technically **start**
after, it is happening on the same event loop tick.

```html
<!-- fig. 3: a chunk of HTML inserted into the DOM all at once -->

<zoo-animals>                                 (1-spawn), ~(7-build)~, (13-load)
    <zoo-enclosure>                           (2-spawn), ~(8-build)~, (14-load)
        <zoo-pond>                            (3-spawn), ~(9-build)~, (15-load)
          <zoo-fish name="Nemo"></zoo-fish>   (4-spawn),  (10-build), (16-load)
        </zoo-pond>
    </zoo-enclosure>

    <zoo-goat></zoo-goat>                     (5-spawn), (11-build), (17-load)
    <zoo-owl></zoo-owl>                       (6-spawn), (12-build), (18-load)
</zoo-animals>
```

So, `<zoo-animals>`, `<zoo-enclosure>`, and `<zoo-pond>` were considered cached
because they were inserted into the DOM with inner HTML. Had their `build`
events been triggered, new inner HTML would've been inserted, and we would've
lost `<zoo-fish>`'s name property.

### Slow Operations in the Build Step

Components often need to fetch data from an API or local storage, which can add
significant loading time to an `onBuild()` hook.

Lowrider.js is optimized for slow operations in `onBuild()`, and will skip the
build event alltogether when a component is considered to be loading from cache.
The efficacy of this optimization relies on the developer segmenting their code
into the hooks properly.

Since any component can, during its `onBuild()` hook, add arbitrary HTML to the
document, it's impossible to look downwards and know when the loading of any
individual component nest is complete until it is *actually* complete.

The recommended pattern for expensive components is to have the `onBuild()` hook
initialize the HTML in a loading state, then in the same hook, perform the
expensive queries. Once the HTML is inserted, finish the `onBuild()` hook by
removing the loading state.

Example:

```javascript
// in the component's inner HTML:
<p data-prop="listName"></p>

// in the component's onLoad() hook; this will insert "Playlist 1" into the DOM
this.props.listName = 'Playlist 1'
```

## Features

### Render

Lowrider.js provides a `render()` function that allows components to be rerendered.
Calling this is always technically a *re*render, and it will not remove the
instance from the DOM. This is to preserve event handlers and observers that may
have been attached to the element itself by external components.

Calling `render()` on a `lazy-render` component will automatically disable lazy
rendering since it's now rendered.

Attribute watchers created by `this.watchAttr()` will automatically be removed.

```javascript
myElement.render()
```

### Using the `props` Property

Lowrider.js components come with a property called `props`. This property is an
object that can be used for for one-way textual data binding with inner HTML.

Lowrider.js will ensure that props are applied properly when using the factory.

**Do not overwrite the `props` property itself, it is a special proxied
object.**

Under the hood, `render()` will call this instance's `onRemoved` hook, then
trigger the `spawn`, `build` (maybe), and `load` events.

### Build Determiner (`shouldBuild()`)

A component may need to implement custom logic to determine if it needs to
rebuild itself, or simply disable caching altogether, rather than rely on the
default "is there inner HTML?" behavior. Components can implement
`shouldRender()` to override Lowrider.js's default behavior.

Simply return true to proceed with triggering the `build` event (and therefore
the `onBuild()` hook), or return false to skip them.

```javascript
class StatusIndicator extends Lowrider {
  // disable caching by always performing the build on every render
  shouldBuild() {
    return true
  }
}
```

### Lazy Rendering

Lowrider.js can delay the rendering of a component until it's visible to the
user. To be considered visible, it must be in the viewport and it must not be
hidden (e.g., with CSS or covered by another Element). The observation is done
using the [Intersection Observer
API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
instead of expensive scroll listeners and `Element.getBoundingClientRect()`.

When a component is in lazy rendering mode, the `spawn` event will still trigger
like normal when the Element is inserted into the DOM. However, the rest of the
rendering (`build` and `load`) will be delayed until the Element enters the
viewport and is visible.

Lazy rendering is designed so that you don't need to move any code anywhere
(for example, into a `isVisible` callback). It can be enabled and disabled on
the fly, with no modification to the design of your component.

After the lazy render has completed, the Element will automatically stop observing
itself and remove the `lazy-render` attribute (if there is one).

The easiesy way to enable lazy rendering is to use the attribute. To disable it,
just remove the attribute.

```html
<my-component lazy-render></my-component>
```

Lazy rendering can also be enabled programmatically. This **must** be done in
your components `onSpawn()` hook.

```javascript
async onSpawn() {
  this.enableLazyRender()
}
```

It is not necessary to disable lazy rendering manually. It is done automatically
when the Element is removed from the DOM, when the lazy render is triggered, or
when the attribute is removed.

Nevertheless, it can still be done manually.

```javascript
async onSpawn() {
  this.disableLazyRender()
}
```

Lazy loading pro-tips:

- Traditionally, "lazy loading" refers to loading images when they are in
  view. Lowrider.js takes it a step further and delays the rendering of
  all component inner HTML, not just images.
- Because the entire component is delayed, it will be a 0px/0px sized DOM
  Element until it is render time. If you inject 1000 lazy-render Elements, they
  will still all render in parallel at the same time because they're all stacked
  on the same pixel in the viewport. For the best user experience, try to
  paginate data into small groups, have Elements initialize in a loading state
  that has some width/height, or make sure that prior Elements have rendered and
  pushed the page down enough that the user must scroll, causing Elements to
  come in one-by-one.

### Attribute Watching

```javascript
async onSpawn() {
  this.watchAttr(['some-attribute', 'class'], () => {
    console.log('A change was detected')
  })
}
```

*Caution!* Updating a watched attribute value in a watched attribute callback
will result in an infinite loop.

### Infinite Scroll

```javascript
async onSpawn() {
  this.supportInfiniteScroll(() => {
    console.log('user scrolled to near the bottom of this element')
  })
}
```

### Interacting State

User interaction detection lets the component know when the user is interacting
with it in ways that go beyond the native `focus` listener.

"Interacting state" is defined as:

- Left click or right click directly on the component Element or any child Element
- Pressing tab and landing directly on the component Element or any child Element

The Element will stay in the interacting state while the user continues to
interact with it, until the user stops. The class "interacting" is added to
the Element throughout the duration of the interaction.

This feature is useful for keeping a parent component in the "interacting" state
(visually, perhaps) while the user interacts with a child context menu or
something similar that requires changing Element focus.

```javascript
async onSpawn() {
  // registers event listeners
  this.supportInteractingState()

  // optionally programmatically enter "interacting" state
  this.enterInteractingState()
}
```

### Drop Area

Enable "drop zone" functionality for any Lowrider.js component. This will
allow the compoent to receive drops from outside of the web browser (e.g., the
user drags a file or folder from macOS Finder or Windows Explorer onto this
component).

This is not HTML5 drag-and-drop.

```javascript
async onSpawn() {
  // receive drops directly on this instance Element
  this.enableDropArea((event, data) => {
    console.log('Something was dropped')
  })
}

async onLoad() {
  // receive drops on a child Element instead
  this.enableDropArea(this.querySelector('.area'), (event, data) => {
    console.log('Something was dropped on the child Element')
  })
}
```

## Experimental Features

### Render Queueing

*Render queueing is currently an experimental feature.*

Render queueing is an advanced optimization that minimizes the impact of
rendering a large amount of components at once, specifically components that
trigger network requests.

Render queueing is much like lazy rendering - the component enters the DOM,
`spawn` is triggered, then it waits. Except, unlike lazy rendering, the
component doesn't wait to be visible in the viewport to render. It waits for its
turn in the queue.

Components that use render queueing, but **don't** also use lazy rendering, will
be added to the render queue as soon as they enter the DOM.

Components that use render queueing, and **do** also use lazy rendering, will
be added to the render queue as soon as they are visible in the viewport.

#### The Problem

Render queueing is designed to improve the rendering experience of components
that rely on network requests for their data, when it's necessary to insert many
at once.

When a large number of network-reliant components must be rendered at once, the
most seemingly straightforward method for reducing the impact of this operation
would be to throttle the speed of their DOM insertion. Perhaps even having them
render one after another.

This could be done by a parent component; but there are a few issues with this
approach in general. The parent component's complexity was just increased, the
throttling code cannot easily be shared with other components, and what happens
if suddenly new types of network-reliant components are introduced?

Not to mention the biggest problem of all... if a parent component is throttling
DOM insertions, then those components literally don't exist at all. They cannot
be counted or interacted with, but *should* exist since something told the
parent component to render them in the first place. Since there is no virtual
DOM, getting components into the DOM in a timely manner, but also not pounding
the network, is a critically important task.

And in general, it's a bad idea to have any one component be responsible for the
smooth rendering of another component. It creates an avoidable coupling.

#### The Solution

Lowrider.js offers render queueing as a solution for inserting any number of
network intensive components. Render queueing is very simple to use, requires no
restructuring of your component, and is compatable with lazy rendering.

The queues themselves are not bound to any single component in the DOM, and
instead are attached to the global `window` object.

To enable it, just use the attribute.

```html
<!-- use the default queue -->
<slow-component render-queue></slow-component>

<!-- use a named queue -->
<slow-component render-queue="some-pipeline"></slow-component>
```

There are also a few ways to use it programatically. For lazy rendering
compatability, add the attribute on spawn.

```javascript
async onSpawn() {
  this.setAttribute('render-queue')
}
```

There is also...

```javascript
someElement.addToRenderQueue()
```

#### Once it's in the Queue

Once a component has been added to the queue, it will get the class
`in-render-queue`. Queue's automatically detect when >=1 item is in the queue,
and the queue will begin processing items.

The queue runner triggers the `build` and `load` events of the first component
and waits for them to finish before removing the component from the queue and
moving on to the next item.

Once the queue is empty, the queue runner will pause and remain available for
future use until the end of the browser session. It is not possible to delete a
queue once it has been made.

#### Queue Blocking

Be wary of blocking the queue. For best results, separate queues by resource
endpoints.

For example, queueing components with slow internet requests in front of
components with quick local file reads would be very bad. Use one queue for
`http://foo.com/bar.txt` and another for `file://~/foo/bar.txt` (assuming Electron
environment).

#### Named Render Queues

Any name can be given to a render queue and that queue will be created on
demand. Queues are global and can be used by any Element in the DOM.

If no name is given, the name will be "default".

#### When to use Render Queues

Render queues are not needed in most cases. In fact, the main optimization that
render queueing offers is a reduction in the number of **simultaneous** requests
hitting your API. The optimization is felt mostly server side, not client side.

The browser can easily handle adding 100 new elements to the DOM; the issues
begin when those 100 elements require a few network API calls each, resulting in
large amount of queries hitting your API at once.

It is recommended to optimize using [lazy rendering](#lazy-rendering) first.
It is easier to use and more straightfoward.

If you find your lazily rendered components are still coming in too fast for
your API, then it's now a good time to try and use render queues. Ultimately,
your component will spend more time in a loading state since clearly there is a
bottleneck, but your components will hit your API one-by-one, instead of all at
once.

## Testing

You need `npm` and Node.js to run Lowrider.js tests.

To start an Express server that delivers the test suite to a browser, run:

```
$ npm run ./test/test-env.js
```

Then navigate to `http://localhost:3000` in any browser.

## License

Licensed under the Mozilla Public License 2.0.