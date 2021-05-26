# Lowrider.js

*To see Lowrider.js in action, check out the
[Cardinal apps](https://cardinalapps.xyz).* 

**Lowrider.js** is a small dependency-free ES6 JavaScript library that enhances
[Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components) by
implementing a **[lifecycle](#lifecycle)** that **makes it easy to manage their
state** in single-page applications.

Lowrider.js also provides unopinionated functionality for building applications:
 - State for Web Components
 - HTML drag and drop
 - File drag and drop (drop zone)
 - Attribute watching
 - Infinite scroll
 - User interaction detection
 - Singletons
 - And more

## API Reference

A reference of all public Lowrider.js methods is available in
**[DOCS.md](DOCS.md)**.

## Terminology

"Component", when referring to a DOM Element, always means a DOM Element that
extends the `Lowrider` class. When referring to Web Components in general, "web
component" is always used.

"Element" (capitalized) always refers to an `Element` instance (DOM node);
"element" (lowercase) refers to DOM elements in general.

## Concepts

Lowrider.js's features revolve around one main concept: the component lifecycle.
Certain things can only happen at certain stages of a component's lifecycle; so
understanding the lifecycle is key to writing efficent Lowrider.js components.

### Lifecycle

Lowrider.js web components begin existing at DOM insertion and stop existing at
DOM removal; everything that happens in between is the lifecycle. Reacting to
**[lifecycle events](#lifecycle-events)** with **[hooks](#hooks)** is how
Lowrider.js components come to life.

Lifecycle events can only happen while the component exists in the DOM, and
Lowrider.js's true power is in how it automatically manages these events to
**maintain component state**, **optimize rendering**, and **remove the need for
a virtual DOM**.

#### Lifecycle Events

0. *An instance of the component (custom element that extends Lowrider) is inserted into the DOM.*
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

### Order of Events / Rendering in Series vs. Parallel

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
ready.

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
[element factory](#programmatic-creation) to create the Element with data
pre-bound to it.

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

### Hooks

Hooks are called by Lowrider.js when certain lifecycle events happen. Hooks
should always be `async` functions, or if not, must return a `Promise`. Have the
hook return false to stop rendering the component.

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
    component in any state, as the component may have been loaded with cached
    contents.
  - Example tasks: manipulating inner HTML.
4. **`onRemoved`**
  - Use the onRemoved() hook to react to a removal event. The removal cannot be
    stopped. The component will be removed from the DOM and from memory. Does
    **not** trigger when the user closes the browser.
  - Example tasks: removing event listeners.

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

### Registering Components

Registering a Lowrider.js component is no different than with vanilla Web
Components, except that it uses the `Lowrider.register()` static method to do
so. Your class must always extend Lowrider.

```javascript
import Lowrider from 'Lowrider.js'

// everything that a Lowrider.js component needs
Lowrider.register('my-element', class MyElement extends Lowrider {
  async onSpawn() {}
  async onBuild() {}
  async onLoad() {}
  async onRemoved() {}
})
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

Creating new component instances programatically using
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
childEl.speak()
```

The factory is designed to be used to create Lowrider.js components, but
can also be used to create standard HTML Elements (`div`, `span`, etc) with
custom properties.

### Caching

Since web components cannot exist outside of the DOM, the components themselves
cannot be tasked with caching their own contents. Instead, that responsibility
typically falls to the UI's router, a purpose built module, or simply the
browser if there is no single-page application context.

Lowrider.js is flexible and can work with anything that can stringify HTML. As
long as the component author utilizes the lifecycle hooks properly, Lowrider.js
components can dissappear from the DOM and memory, then reappear as if they
never left at all. Of course, while they're gone, their code won't execute.

Lowrider.js was designed for use with
[router.js](https://github.com/somebeaver/router.js), an open source
unopinionated UI router for single-page applications written by the same developer,
and optimized for use with Lowrider.js.

#### But Really, Where Does the State Go?

If the component is removed from memory, how can it come back in the same state?
The answer is a mix of Lowrider.js features and component authoring patterns.

The job of the caching module is to preserve a component by saving its
`outerHTML` property. It's crucial to save its attributes and its inner HTML.
Together, they *are* the state, and a properly authored component should be able
to initialize itself using that state, or from scratch. It is up to the
developer to ensure that they don't create any important Element object
properties that get lost when the instance is removed; instead, make sure those
things are saved as attributes.

Note that Lowrider.js is not tested for use with the shadow DOM.

### Using the `props` Property

Lowrider.js components come with a property called `props`. This property is an
object that can be used for for one-way textual data binding with inner HTML.

Lowrider.js will ensure that props are applied properly when using the factory.

**Do not overwrite the `props` property itself, it is a special proxied
object.**

Example:

```javascript
// in the component's inner HTML:
<p data-prop="listName"></p>

// in the component's onLoad() hook; this will insert "Playlist 1" into the DOM
this.props.listName = 'Playlist 1'
```

### Other Features

#### Render

Lowrider.js provides a `render()` function that allows components to be rerendered.
Calling this is always technically a *re*render, and it will not remove the
instance from the DOM. This is to preserve event handlers and observers that may
have been attached to the element itself by external components.

```javascript
myElement.render()
```

Under the hood, `render()` will call this instance's `onRemoved` hook, then
trigger the `spawn`, `build` (maybe), and `load` events (which triggers their hooks).

#### Build Determiner (`shouldBuild()`)

A component may need to implement custom logic to determine if it needs to
rebuild itself or not, or simply disable caching altogether. Lowrider.js
components can implement `shouldRender()` to override the default behavior.

Simply return true to proceed with triggering the `build` event (and therefore
the `onBuild()` hook), or return false to skip them.

Note that the `spawn` and `load` events cannot be skipped.

```javascript
class StatusIndicator extends Lowrider {
  shouldBuild() {
    if (statusHasChangedSinceLastBuild) {
      return true
    } else {
      return false
    }
  }
}
```

#### Attribute Watching

```javascript
async onSpawn() {
  this.watchAttr(['some-attribute', 'class'], () => {
    console.log('A change was detected')
  })
}
```

*Caution!* Updating a watched attribute value in a watched attribute callback
will result in an infinite loop.

#### Infinite Scroll

```javascript
async onSpawn() {
  this.supportInfiniteScroll(() => {
    console.log('user scrolled to near the bottom of this element')
  })
}
```

#### "Interacting" State

"Interacting" state was designed specifically for the [Cardinal
apps](https://cardinalapps.xyz), and it lets the component know when the user is
interacting with it (e.g., clicked inside it; tabbed into it; right clicked it).

Lowrider.js will automatically add the class "interacting" when the user is
interacting with the instance.

```javascript
async onSpawn() {
  // registers event listeners
  this.supportInteractingState()

  // optionally programmatically enter "interacting" state
  this.enterInteractingState()
}
```

#### Drop Area

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

## Testing

You need `npm` and Node.js to run Lowrider.js tests.

To start an Express server that delivers the test suite to a browser, run:

```
$ npm run ./test/test-env.js
```

Then navigate to `http://localhost:3000` in any browser.

## License

Licensed under the Mozilla Public License 2.0.