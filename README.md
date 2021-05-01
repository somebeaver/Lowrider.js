# Lowrider.js

*To see Lowrider.js in action, check out the
[Cardinal apps](https://cardinalapps.xyz).* 

**Lowrider.js** is a small ES6 JavaScript library that enhances [Web
Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components) and
makes them better building blocks in a completely vanilla environment. Specifically,
Lowrider.js implements a **[component lifecycle](#component-lifecycle)** that
makes web components more flexible and reusable, especially when using many
together to create complex UI's.

Lowrider.js also provides unopinionated functionality for building web based
applications, such as component state, component caching, HTML5
drag-and-drop, infinite scroll, content rendering, data binding, Element
creation, and more.

## Lifecycle

Lowrider.js web components begin existing at DOM insertion and stop existing at
DOM removal; everything that happens in between is the lifecycle. Understanding
and reacting to **[lifecycle events](#lifecycle-events)** with
**[hooks](#hooks)** is key to creating efficent Lowrider.js components.

Lifecycle events can only happen while the component exists in the DOM.
Lowrider.js's true power is in how it automatically manages these events to
**maintain component state**, **optimize rendering**, and **remove the need
for a virtual DOM**.

#### Lifecycle Events

0. *An instance of the web component (custom element) is inserted into the DOM.*
1. **`spawn`** - Immediately, the `spawn` event fires. The web component knows of
   its own existance and the document in which it lives.
2. **`build`** - Immediately after spawning is completed, the component enters the
   `build` lifecycle event. It should now build itself (i.e., query an
   API, inject inner HTML, spawn more components). This step is **skipped** when
   using a cached component.
3. **`load`** - One event loop tick after building is completed, the component
   enters the `load` lifecycle event. It can now manipulate its child
   HTML, and then should wait for user interaction or DOM removal.
4. **`removed`** - Final moments before the component is removed from the DOM **and
   memory**.

**Together, steps 1, 2, and 3 make up the "rendering process" that all
components immediately go through when inserted into the DOM.**

*Note:* Lowrider.js provides a `render()` method, but since web components
automatically render themselves upon DOM insertion, the method does not need to be
invoked unless you want to *re*render. More on the [render method](#render).

## Order of Events

Lowrider.js takes a top-down approach to UI rendering. No matter how deeply
nested in the HTML, each Lowrider.js component acts predictably and
consistently.

The following example shows the order in which lifecycle events fire when a
bunch of nested HTML is inserted at once. Follow the numbers to follow the order
of events. Events surrounded by `~` sqigglies denote a skipped event.

```html
<zoo-animals>                     (1-spawn), ~(7-build)~, (13-load)
    <zoo-enclosure>               (2-spawn), ~(8-build)~, (14-load)
        <zoo-pond>                (3-spawn), ~(9-build)~, (15-load)
          <zoo-fish></zoo-fish>   (4-spawn),  (10-build), (16-load)
        </zoo-pond>
    </zoo-enclosure>

    <zoo-goat></zoo-goat>         (5-spawn), (11-build), (17-load)
    <zoo-owl></zoo-owl>           (6-spawn), (12-build), (18-load)
</zoo-animals>
```

The main takeaways here are that:

1. Elements are rendered top-down, meaning that when at step `(1-spawn)`,
   `zoo-animals` should not look into its own HTML because its child components
   are not guarenteed to have rendered yet.
2. `build` events of components with existing HTML on DOM insertion are assumed
   to be using their cached contents from a prior build, so their `build`
   event is skipped so as to not overwirte the cache.
3. When two components have a parent-child relationship, the parent should create
   the child Element during its `onBuild()` hook, which ensures that the child's
   `onBuild()` hook can rely on the parent for data that was initialized earlier
   in the parent's rendering process.

#### Async Operations in the Build Step

Components often need to fetch data from an API or some sort of local storage,
which can add significant loading time to an `onBuild()` hook.

Lowrider.js is optimized for slow async operations in `onBuild()`. No matter how
long it takes to finish `onBuild()`, that component's `onLoad()` will always
come after, **and no other component will be blocked from rendering, including
child components that have already been inserted**.

Since any component can, during its `onBuild()` hook, add arbitrary HTML to the
document, it's impossible to look downwards and know when the loading of any
individual component nest is complete until it is *actually* complete (which is
still debateable).

## Hooks

Hooks are called by Lowrider.js when certain lifecycle events happen. Hooks
should always be async functions.

For each lifecycle event, there is a hook.

1. **`onSpawn`**
  - Use the onSpawn() hook to perform initial setup tasks with the upwards DOM and itself.
  - Example tasks: registering event handlers or mutation observers on itself;
    initial component setup.
  - **Do not** insert inner HTML, do not look downward in the DOM, do not perform
    expensive tasks.
  - **Do** keep this hook as lightweight as possible.
2. **`onBuild`**
  - Use the onBuild() hook to perform the heavy lifting of the component's
    rendering process. This step is skipped when the component is loaded with
    cached internals. Doing this will maintain component state.
  - Example tasks: fetch remote data; big loops.
  - **Do not** initialize new internal properties.
  - **Do** overwrite inner HTML on each build.
3. **`onLoad`**
  - Use the onLoad() hook to perform after-build tasks and to interact with
    child HTML and components. This hook should be designed to work with the
    component in any state, as the component may have been loaded with cached
    contents
  - Example tasks: event handlers on child web componets, trigger animations,
    analyze and react to built state.
4. **`onRemoved`**
  - Use the onRemoved() hook to react to a removal event. The removal cannot be
    stopped. The component will be removed from the DOM and from memory.
  - Example tasks: remove event listeners, save data.

## Registering Components

Registering a Lowrider.js component is no different than with vanilla Web
Components, except that it uses the `Lowrider.register()` static method to do
so. Your class must always extend Lowrider.

```javascript
import Lowrider from 'Lowrider.js'

// the humble beginnings of all Lowrider.js components
Lowrider.register('my-element', class MyElement extends Lowrider {
  async onSpawn() {}
  async onBuild() {}
  async onLoad() {}
  async onRemoved() {}
})
```

Components only need to be registered once, then can be used in the DOM. Trying
to register a component that was already registered will result in an error.

## Creating Component Instances

Once a web component has been registered with the document, instances of it can
be created. Typically, this is done by inserting it into the DOM, and doing so
will trigger the rendering process.

Elements can be inserted naked, with attributes, and/or with inner HTML. When an Element
is inserted with inner HTML, Lowrider.js assumes it is being loaded with cached
content, and the **build** event will **not** trigger.

Statically typed Elements can cover 99% of use cases, but are limited by the
fact that HTML attributes can only hold a maximum amount of stringified data.

### Statically Typed Creation

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

As such, it's not possible to pass a function reference to `<my-element>` that
it has access to on spawn. To solve this, Lowrider.js components can also be
created programatically using the the static method `Lowrider.elementFactory()`.
This method can be used to attach arbitrary data to the Element before it even
spawns.

### Programmatic Creation with Lowrider.elementFactory()

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
can also be used to create standard HTML Elements (`div`, `span`, etc).

## Caching

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
unopinionated UI router for single-page applications written by the same author,
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

## Using the `props` Property

Lowrider.js components come with a property called `props`. This property is an
object that can be used for for one-way textual data binding with inner HTML.

Lowrider.js will ensure that props are be applied properly when using the factory.

**Do not overwrite the `props` property itself, it is a special proxied
object.**

Example:

```javascript
// in the component's inner HTML:
<p data-prop="listName"></p>

// in the component's onLoad() hook; this will insert "Playlist 1" into the DOM
this.props.listName = 'Playlist 1'
```

## Other Features

### Render

Lowrider.js provides a render function that allows components to be rerendered.
Calling this is always technically a *re*render, and it will not remove the
instance from the DOM. This is to preserve event handlers and observers that may
have been attached to the element itself by external components.

```javascript
myElement.render()
```

Under the hood, `render()` will call this instance's `onRemoved` hook, then
trigger the `spawn`, `build` (maybe), and `load` events (which triggers their hooks).

### Build Determiner (`shouldBuild()`)

Sometimes, a component may need to implement custom logic to determine if it
needs to rebuild itself or not. Lowrider.js components can implement
`shouldRender()` to override the default behavior.

Simply return true to proceed with triggering the `build` event (and therefore
the `onBuild()` hook), or return false to skip the event and hook.

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

### Attribute Watching

```javascript
async onSpawn() {
  this.watchAttr(['some-attribute', 'class'], () => {
    console.log('A change was detected')
  })
}
```

*Caution!* Calling `render()` in a watched attribute will result in an infinite
loop.

### Infinite Scroll

```javascript
async onSpawn() {
  this.supportInfiniteScroll(() => {
    console.log('user scrolled to near the bottom of this element')
  })
}
```

### "Interacting" State

"Interacting" state was designed specifically for the [Cardinal
apps](https://cardinalapps.xyz), and it lets the component know when the user is
interacting with it (i.e., clicked inside it; tabbed into it; right clicked it).

Lowrider.js will automatically add the class "interacting" when the user is
interacting with the instance.

```javascript
async onSpawn() {
  // registers event listeners
  this.supportInteractingState()

  // programmatically enter "interacting" state
  this.enterInteractingState()
}
```

### Drop Area

Enable "drop receiver" functionality any Lowrider.js component. This will allow
the compoent to receive drops from outside of the web browser (e.g., the user
drags a file or folder from macOS Finder or Windows Explorer onto this
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