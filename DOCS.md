<a name="module_Lowrider"></a>

## Lowrider

* [Lowrider](#module_Lowrider)
    * _instance_
        * [.spawn([renderOpts])](#module_Lowrider+spawn)
        * [.build([renderOpts])](#module_Lowrider+build)
        * [.load()](#module_Lowrider+load)
        * [.shouldBuild()](#module_Lowrider+shouldBuild)
        * [.isUsingRenderQueue()](#module_Lowrider+isUsingRenderQueue)
        * [.addToRenderQueue()](#module_Lowrider+addToRenderQueue)
        * [.isUsingLazyRenderMode()](#module_Lowrider+isUsingLazyRenderMode)
        * [.enableLazyRender()](#module_Lowrider+enableLazyRender)
        * [.disableLazyRender()](#module_Lowrider+disableLazyRender)
        * [.render([opts])](#module_Lowrider+render)
        * [.unlock()](#module_Lowrider+unlock)
        * [.watchAttr(attr)](#module_Lowrider+watchAttr)
        * [.supportInfiniteScroll(cb, viewSelector)](#module_Lowrider+supportInfiniteScroll) ⇒ <code>function</code>
        * [.supportInteractingState()](#module_Lowrider+supportInteractingState)
        * [.enterInteractingState()](#module_Lowrider+enterInteractingState)
        * [.enableDropArea([innerEl], onDrop)](#module_Lowrider+enableDropArea)
    * _static_
        * [.elementFactory()](#module_Lowrider.elementFactory)
        * [.register(name, implementation)](#module_Lowrider.register)

<a name="module_Lowrider+spawn"></a>

### lowrider.spawn([renderOpts])
Spawns event invoker. The spawn event always triggers, regardless of
wehether the Element needs to also render. Your class should implement
`onSpawn` to react to this.

**Kind**: instance method of [<code>Lowrider</code>](#module_Lowrider)  

| Param | Type | Description |
| --- | --- | --- |
| [renderOpts] | <code>\*</code> | Options to give to `onSpawn()`. |

<a name="module_Lowrider+build"></a>

### lowrider.build([renderOpts])
Build event invoker. Does not check `shouldBuild()`. Your class should
implement `onBuild` to react to this.

**Kind**: instance method of [<code>Lowrider</code>](#module_Lowrider)  

| Param | Type | Description |
| --- | --- | --- |
| [renderOpts] | <code>\*</code> | Options to give to `onBuild()`. |

<a name="module_Lowrider+load"></a>

### lowrider.load()
The load step. Your class should implement `onLoad` to react to this.

**Kind**: instance method of [<code>Lowrider</code>](#module_Lowrider)  
<a name="module_Lowrider+shouldBuild"></a>

### lowrider.shouldBuild()
Determines whether this instance should render or not. This is determined
by checking if there is any child Element. If none exists, we must render.

Your class may override this.

**Kind**: instance method of [<code>Lowrider</code>](#module_Lowrider)  
<a name="module_Lowrider+isUsingRenderQueue"></a>

### lowrider.isUsingRenderQueue()
Checks if this instance currently has render queueing enabled.

**Kind**: instance method of [<code>Lowrider</code>](#module_Lowrider)  
<a name="module_Lowrider+addToRenderQueue"></a>

### lowrider.addToRenderQueue()
Adds this Element to the render queue.

**Kind**: instance method of [<code>Lowrider</code>](#module_Lowrider)  
<a name="module_Lowrider+isUsingLazyRenderMode"></a>

### lowrider.isUsingLazyRenderMode()
Checks if this instance currently has lazy-render mode enabled.

**Kind**: instance method of [<code>Lowrider</code>](#module_Lowrider)  
<a name="module_Lowrider+enableLazyRender"></a>

### lowrider.enableLazyRender()
Enables lazy-render mode by creating an IntersectionObserver and observing
this Element. If you use the `lazy-render` attribute, or the `lazyRender =
true` property, you do not need to call this.

**Kind**: instance method of [<code>Lowrider</code>](#module_Lowrider)  
<a name="module_Lowrider+disableLazyRender"></a>

### lowrider.disableLazyRender()
Disables lazy-render mode by deleting the observers and ensuring that the
attribute is gone. This is normally handled automatically, so you don't
need to call this unless your intention is to disable the lazy render
callback before it has triggered.

**Kind**: instance method of [<code>Lowrider</code>](#module_Lowrider)  
<a name="module_Lowrider+render"></a>

### lowrider.render([opts])
Performs a render on an existing Element by calling the `onRemoved` handler
first, then `spawn()`, `build()`, and `load()` handlers. This will not
actually reinject the Element instance, which means that existing event
handlers on the component itself will be preserved.

Technically, this is always a *re*render, since one cannot call this
without the Element existing in the first place (as in, already rendered).

Calling `render()` will disable lazy-render if it's enabled, but not yet
rendered.

**Kind**: instance method of [<code>Lowrider</code>](#module_Lowrider)  

| Param | Type | Description |
| --- | --- | --- |
| [opts] | <code>\*</code> | Optionally give any argument, and that argument will be given to `onSpawn`, `onBuild`, and `onLoad`. |

<a name="module_Lowrider+unlock"></a>

### lowrider.unlock()
Unlocks a web component.

**Kind**: instance method of [<code>Lowrider</code>](#module_Lowrider)  
<a name="module_Lowrider+watchAttr"></a>

### lowrider.watchAttr(attr)
Creates a mutation listener that watches for attribute changes.

**Kind**: instance method of [<code>Lowrider</code>](#module_Lowrider)  

| Param | Type | Description |
| --- | --- | --- |
| attr | <code>string</code> \| <code>array</code> | Attribute name, or an array of attributes. |

<a name="module_Lowrider+supportInfiniteScroll"></a>

### lowrider.supportInfiniteScroll(cb, viewSelector) ⇒ <code>function</code>
Enables support for infinite scroll on an Element instance by registering
`scroll` event listeners on a parent.

Automatically removes the event listener on element removal.

**Kind**: instance method of [<code>Lowrider</code>](#module_Lowrider)  
**Returns**: <code>function</code> - Returns the scroll listener function, so that it can be
unregistered later.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cb | <code>function</code> |  | Callback function. |
| viewSelector | <code>string</code> | <code>&quot;body&quot;</code> | CSS selector for the element on which to attach the scroll listener. Defaults to `body`. |

<a name="module_Lowrider+supportInteractingState"></a>

### lowrider.supportInteractingState()
This function registers event listeners on the web component that help
determine when a user is interacting with it.

Any web component may enter an "interacting" state, which means the user
has either:

- Left clicked a specific child Element
- Right clicked anywhere in the Element
- Focused a child Element (typically by tabbing into it)

When the listeners detect that the user is interacting with the web
component, they will invoke enterInteractingState() on it, which can also
be called manually.

**Kind**: instance method of [<code>Lowrider</code>](#module_Lowrider)  

| Param | Type | Description |
| --- | --- | --- |
| [options.rightClickEls] | <code>Array</code> | Elements that accept right clicks for entering the interacting state. Defaults to the entire Lowrider Element. |
| [options.leftClickEls] | <code>Array</code> | Elements that accept left clicks for entering the interacting state. Defaults to all child "dot-menu" Elements (for Cardinal purposes). |

<a name="module_Lowrider+enterInteractingState"></a>

### lowrider.enterInteractingState()
When the listeners created by `supportInteractingState()` detect that the user is interacting
with the Element, this function will set the interacting state for the Element. This can also
be invoked manually.

An event listener will be added to the music-app that determines when the user is done
interacting with the Element. The Element remains in the interacting state while the user
uses the context-menu, or tabs between child Elements.

**Kind**: instance method of [<code>Lowrider</code>](#module_Lowrider)  
<a name="module_Lowrider+enableDropArea"></a>

### lowrider.enableDropArea([innerEl], onDrop)
Enables drop listeners on this instnace. This is for recieving drops from
outside of the Electron app, **not** HTML5 drag-n-drop.

Automatically toggles the class "drop-hovering" when the user is hoving
over the instance while dragging something with the mouse.

**Kind**: instance method of [<code>Lowrider</code>](#module_Lowrider)  

| Param | Type | Description |
| --- | --- | --- |
| [innerEl] | <code>Element</code> \| <code>function</code> | Optionally use a child Element instead of the entire Lowrider Element. Can also be the onDrop arg. |
| onDrop | <code>function</code> | Callback triggered when a drop is recievd. The callback will recieve the event as the first arg, and the dropped items as the second arg. |

<a name="module_Lowrider.elementFactory"></a>

### Lowrider.elementFactory()
Creates and returns an Element node of any type with pre-bound data. This
can be used to bind data to the Element instance before any lifecycle
events fire (including the internal `connectedCallback`). The factory is
typically used to create Elements that extend Lowrider.js, but can be used
to create any Element.

The name `elementFactory` means that this is the factory, not that this
function returns a factory function.

This returns a live Element node, that when inserted into the DOM, will
trigger all lifecycle events like normal, but will have the data bindings
available within it.

The main purpose of this is to create new Lowrider components that are
designed to spawn with a large dataset (too large for attributes, or cannot
be stringified).

If creating a custom element, that custom element must have already been
registered with the browser.

**Kind**: static method of [<code>Lowrider</code>](#module_Lowrider)  

| Param | Type | Description |
| --- | --- | --- |
| options.name | <code>string</code> | Required. Element tag name. |
| [options.attrs] | <code>object</code> | An object of attributes and their values to be set on the Element. |
| [options.bindings] | <code>object</code> | An object of keys and values to be bound to the Element. |

<a name="module_Lowrider.register"></a>

### Lowrider.register(name, implementation)
Registers a custom Element with CustomElementRegistry.

**Kind**: static method of [<code>Lowrider</code>](#module_Lowrider)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The Element tag, e.g., `custom-list`. |
| implementation | <code>object</code> | The class implementation of the Element. |

