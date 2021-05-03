<a name="Lowrider.module_js"></a>

## js

* [js](#Lowrider.module_js)
    * _instance_
        * [.spawn([renderOpts])](#Lowrider.module_js+spawn)
        * [.build([renderOpts])](#Lowrider.module_js+build)
        * [.load()](#Lowrider.module_js+load)
        * [.shouldBuild()](#Lowrider.module_js+shouldBuild)
        * [.render([opts])](#Lowrider.module_js+render)
        * [.unlock()](#Lowrider.module_js+unlock)
        * [.watchAttr(attr)](#Lowrider.module_js+watchAttr)
        * [.supportInfiniteScroll(cb, viewSelector)](#Lowrider.module_js+supportInfiniteScroll) ⇒ <code>function</code>
        * [.supportInteractingState(leftClickChildren)](#Lowrider.module_js+supportInteractingState)
        * [.enterInteractingState()](#Lowrider.module_js+enterInteractingState)
        * [.enableDropArea([innerEl], onDrop)](#Lowrider.module_js+enableDropArea)
    * _static_
        * [.elementFactory()](#Lowrider.module_js.elementFactory)
        * [.register(name, implementation)](#Lowrider.module_js.register)

<a name="Lowrider.module_js+spawn"></a>

### js.spawn([renderOpts])
Spawns event invoker. The spawn event always triggers, regardless of
wehether the Element needs to also render. Your class should implement
`onSpawn` to react to this.

**Kind**: instance method of [<code>js</code>](#Lowrider.module_js)  

| Param | Type | Description |
| --- | --- | --- |
| [renderOpts] | <code>\*</code> | Options to give to `onSpawn()`. |

<a name="Lowrider.module_js+build"></a>

### js.build([renderOpts])
Build event invoker. Does not check `shouldBuild()`. Your class should
implement `onBuild` to react to this.

**Kind**: instance method of [<code>js</code>](#Lowrider.module_js)  

| Param | Type | Description |
| --- | --- | --- |
| [renderOpts] | <code>\*</code> | Options to give to `onBuild()`. |

<a name="Lowrider.module_js+load"></a>

### js.load()
The load step. Your class should implement `onLoad` to react to this.

**Kind**: instance method of [<code>js</code>](#Lowrider.module_js)  
<a name="Lowrider.module_js+shouldBuild"></a>

### js.shouldBuild()
Determines whether this instance should render or not. This is determined
by checking if there is any child Element. If none exists, we must render.

Your class may override this.

**Kind**: instance method of [<code>js</code>](#Lowrider.module_js)  
<a name="Lowrider.module_js+render"></a>

### js.render([opts])
Performs a render on an existing Element by calling the `onRemoved` handler
first, then `spawn()`, `build()`, and `load()` handlers. This will not
actually reinject the Element instance, which means that existing event
handlers on the component itself will be preserved.

Technically, this is always a *re*render, since one cannot call this
without the Element existing in the first place (as in, already rendered).

**Kind**: instance method of [<code>js</code>](#Lowrider.module_js)  

| Param | Type | Description |
| --- | --- | --- |
| [opts] | <code>\*</code> | Optionally give any argument, and that argument will be given to `onSpawn`, `onBuild`, and `onLoad`. |

<a name="Lowrider.module_js+unlock"></a>

### js.unlock()
Unlocks a web component.

**Kind**: instance method of [<code>js</code>](#Lowrider.module_js)  
<a name="Lowrider.module_js+watchAttr"></a>

### js.watchAttr(attr)
Creates a mutation listener that watches for attribute changes.

**Kind**: instance method of [<code>js</code>](#Lowrider.module_js)  

| Param | Type | Description |
| --- | --- | --- |
| attr | <code>string</code> \| <code>array</code> | Attribute name, or an array of attributes. |

<a name="Lowrider.module_js+supportInfiniteScroll"></a>

### js.supportInfiniteScroll(cb, viewSelector) ⇒ <code>function</code>
Enables support for infinite scroll on an Element instance by registering
`scroll` event listeners on a parent.

Automatically removes the event listener on element removal.

**Kind**: instance method of [<code>js</code>](#Lowrider.module_js)  
**Returns**: <code>function</code> - Returns the scroll listener function, so that it can be
unregistered later.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cb | <code>function</code> |  | Callback function. |
| viewSelector | <code>string</code> | <code>&quot;body&quot;</code> | CSS selector for the element on which to attach the scroll listener. Defaults to `body`. |

<a name="Lowrider.module_js+supportInteractingState"></a>

### js.supportInteractingState(leftClickChildren)
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

**Kind**: instance method of [<code>js</code>](#Lowrider.module_js)  
**Paran**: <code>Element</code> [interactionEl] - Use this child Element instead of the
the entire component as the listener for left/right clicks.  

| Param | Type | Description |
| --- | --- | --- |
| leftClickChildren | <code>array</code> | An array of CSS selectors for child Elements that, when clicked, make this instance enter an interacting state. For example, the user may be allowed to left click on the child images of this instance, but when they click on a specific button should be considered interacting. |

<a name="Lowrider.module_js+enterInteractingState"></a>

### js.enterInteractingState()
When the listeners created by `supportInteractingState()` detect that the user is interacting
with the Element, this function will set the interacting state for the Element. This can also
be invoked manually.

An event listener will be added to the music-app that determines when the user is done
interacting with the Element. The Element remains in the interacting state while the user
uses the context-menu, or tabs between child Elements.

**Kind**: instance method of [<code>js</code>](#Lowrider.module_js)  
<a name="Lowrider.module_js+enableDropArea"></a>

### js.enableDropArea([innerEl], onDrop)
Enables drop listeners on this instnace. This is for recieving drops from
outside of the Electron app, **not** HTML5 drag-n-drop.

Automatically toggles the class "drop-hovering" when the user is hoving
over the instance while dragging something with the mouse.

**Kind**: instance method of [<code>js</code>](#Lowrider.module_js)  

| Param | Type | Description |
| --- | --- | --- |
| [innerEl] | <code>Element</code> \| <code>function</code> | Optionally use a child Element instead of the entire Lowrider Element. Can also be the onDrop arg. |
| onDrop | <code>function</code> | Callback triggered when a drop is recievd. The callback will recieve the event as the first arg, and the dropped items as the second arg. |

<a name="Lowrider.module_js.elementFactory"></a>

### js.elementFactory()
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

**Kind**: static method of [<code>js</code>](#Lowrider.module_js)  

| Param | Type | Description |
| --- | --- | --- |
| options.name | <code>string</code> | Required. Element tag name. |
| [options.attrs] | <code>object</code> | An object of attributes and their values to be set on the Element. |
| [options.bindings] | <code>object</code> | An object of keys and values to be bound to the Element. |

<a name="Lowrider.module_js.register"></a>

### js.register(name, implementation)
Registers a custom Element with CustomElementRegistry.

**Kind**: static method of [<code>js</code>](#Lowrider.module_js)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The Element tag, e.g., `custom-list`. |
| implementation | <code>object</code> | The class implementation of the Element. |

