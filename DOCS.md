## Functions

<dl>
<dt><a href="#connectedCallback">connectedCallback()</a></dt>
<dd><p>Fires when the custom element enters the document, whether cached or not.</p>
</dd>
<dt><a href="#disconnectedCallback">disconnectedCallback()</a></dt>
<dd><p>When the Element is removed from the document.</p>
</dd>
<dt><a href="#_newPropsProxiedObject">_newPropsProxiedObject()</a> ⇒ <code>object</code></dt>
<dd><p>Returns a new proxied object for use in this.props.</p>
</dd>
<dt><a href="#spawn">spawn([renderOpts])</a></dt>
<dd><p>Spawns the instance &quot;brains&quot;. The spawn event always triggers, regardless
of wehether the Element needs to also render.</p>
<ul>
<li>Usage:<ul>
<li>Invoke <code>.spawn()</code> when you only want to refresh the dynamic part of the
instance and not refresh the inner HTML.</li>
<li>This is usually not what you want to do... but it exists and is exposed.</li>
</ul>
</li>
</ul>
</dd>
<dt><a href="#build">build([renderOpts])</a></dt>
<dd><p>Renders the inner HTML of the Element instance.</p>
</dd>
<dt><a href="#load">load()</a></dt>
<dd><p>The load step.</p>
</dd>
<dt><a href="#shouldBuild">shouldBuild()</a></dt>
<dd><p>Determines whether this instance should render or not. This is determined
by checking if there is any child Element. If none exists, we must render.</p>
<p>This method can be overwritten by Elements that implement Lowrider.</p>
</dd>
<dt><a href="#render">render([opts])</a></dt>
<dd><p>Performs a render on an existing Element by calling the <code>onRemoved</code> handler
first, then <code>spawn()</code>, <code>build()</code>, and <code>load()</code> handlers. This will not
actually reinject the Element instance, which means that existing event
handlers on the component itself will be preserved.</p>
<p>Technically, this is always a <em>re</em>render, since one cannot call this
without the Element existing in the first place (as in, already rendered).</p>
</dd>
<dt><a href="#unlock">unlock()</a></dt>
<dd><p>Unlocks a web component.</p>
</dd>
<dt><a href="#watchAttr">watchAttr(attr)</a></dt>
<dd><p>Creates a mutation listener that watches for attribute changes</p>
</dd>
<dt><a href="#supportInfiniteScroll">supportInfiniteScroll(cb, viewSelector)</a> ⇒ <code>function</code></dt>
<dd><p>Enables support for infinite scroll on an Element instance by registering
<code>scroll</code> event listeners on a parent.</p>
<p>Automatically removes the event listener on element removal.</p>
</dd>
<dt><a href="#supportInteractingState">supportInteractingState(leftClickChildren)</a></dt>
<dd><p>This was implemented specifically for Hydra Media Center.</p>
<p>This function registers event listeners on the web component that help
determine when a user is interacting with it.</p>
<p>Any web component may enter an &quot;interacting&quot; state, which means the user
has either:</p>
<ul>
<li>Left clicked a specific child Element</li>
<li>Right clicked anywhere in the Element</li>
<li>Focused a child Element (typically by tabbing into it)</li>
</ul>
<p>When the listeners detect that the user is interacting with the web
component, they will invoke enterInteractingState() on it, which can also
be called manually.</p>
</dd>
<dt><a href="#enterInteractingState">enterInteractingState()</a></dt>
<dd><p>This was implemented specifically for Hydra Media Center.</p>
<p>When the listeners created by <code>supportInteractingState()</code> detect that the user is interacting
with the Element, this function will set the interacting state for the Element. This can also
be invoked manually.</p>
<p>An event listener will be added to the music-app that determines when the user is done
interacting with the Element. The Element remains in the interacting state while the user
uses the context-menu, or tabs between child Elements.</p>
</dd>
<dt><a href="#enableDropArea">enableDropArea([innerEl], onDrop)</a></dt>
<dd><p>Enables drop listeners on this instnace. This is for recieving drops from
outside of the Electron app, <strong>not</strong> HTML5 drag-n-drop.</p>
<p>Automatically toggles the class &quot;drop-hovering&quot; when the user is hoving
over the instance while dragging something with the mouse.</p>
</dd>
<dt><a href="#elementFactory">elementFactory(options)</a></dt>
<dd><p>Creates and returns an Element node of any type with pre-bound data. This
can be used to bind data to the Element instance before any lifecycle
events fire (including the internal <code>connectedCallback</code>). The factory is
typically used to create Elements that extend Lowrider.js, but can be used
to create any Element.</p>
<p>The name <code>elementFactory</code> means that this is the factory, not that this
function returns a factory function.</p>
<p>This returns a live Element node, that when inserted into the DOM, will
trigger all lifecycle events like normal, but will have the data bindings
available within it.</p>
<p>The main purpose of this is to create new Lowrider components that are
designed to spawn with a large dataset (too large for attributes, or cannot
be stringified).</p>
<p>If creating a custom element, that custom element must have already been
registered with the browser.</p>
</dd>
<dt><a href="#register">register(name, implementation)</a></dt>
<dd><p>Registers a custom Element with CustomElementRegistry.</p>
</dd>
</dl>

<a name="connectedCallback"></a>

## connectedCallback()
Fires when the custom element enters the document, whether cached or not.

**Kind**: global function  
<a name="disconnectedCallback"></a>

## disconnectedCallback()
When the Element is removed from the document.

**Kind**: global function  
<a name="_newPropsProxiedObject"></a>

## \_newPropsProxiedObject() ⇒ <code>object</code>
Returns a new proxied object for use in this.props.

**Kind**: global function  
<a name="spawn"></a>

## spawn([renderOpts])
Spawns the instance "brains". The spawn event always triggers, regardless
of wehether the Element needs to also render.

- Usage:
  - Invoke `.spawn()` when you only want to refresh the dynamic part of the
    instance and not refresh the inner HTML.
  - This is usually not what you want to do... but it exists and is exposed.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| [renderOpts] | <code>\*</code> | Options to give to `onSpawn()`. |

<a name="build"></a>

## build([renderOpts])
Renders the inner HTML of the Element instance.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| [renderOpts] | <code>\*</code> | Options to give to `onBuild()`. |

<a name="load"></a>

## load()
The load step.

**Kind**: global function  
<a name="shouldBuild"></a>

## shouldBuild()
Determines whether this instance should render or not. This is determined
by checking if there is any child Element. If none exists, we must render.

This method can be overwritten by Elements that implement Lowrider.

**Kind**: global function  
<a name="render"></a>

## render([opts])
Performs a render on an existing Element by calling the `onRemoved` handler
first, then `spawn()`, `build()`, and `load()` handlers. This will not
actually reinject the Element instance, which means that existing event
handlers on the component itself will be preserved.

Technically, this is always a *re*render, since one cannot call this
without the Element existing in the first place (as in, already rendered).

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| [opts] | <code>\*</code> | Optionally give any argument, and that argument will be given to `onSpawn`, `onBuild`, and `onLoad`. |

<a name="unlock"></a>

## unlock()
Unlocks a web component.

**Kind**: global function  
<a name="watchAttr"></a>

## watchAttr(attr)
Creates a mutation listener that watches for attribute changes

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| attr | <code>string</code> \| <code>array</code> | Attribute name, or an array of attributes. |

<a name="supportInfiniteScroll"></a>

## supportInfiniteScroll(cb, viewSelector) ⇒ <code>function</code>
Enables support for infinite scroll on an Element instance by registering
`scroll` event listeners on a parent.

Automatically removes the event listener on element removal.

**Kind**: global function  
**Returns**: <code>function</code> - Returns the scroll listener function, so that it can be
unregistered later.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cb | <code>function</code> |  | Callback function. |
| viewSelector | <code>string</code> | <code>&quot;body&quot;</code> | CSS selector for the element on which to attach the scroll listener. Defaults to `body`. |

<a name="supportInteractingState"></a>

## supportInteractingState(leftClickChildren)
This was implemented specifically for Hydra Media Center.

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

**Kind**: global function  
**Paran**: <code>Element</code> [interactionEl] - Use this child Element instead of the
the entire component as the listener for left/right clicks.  

| Param | Type | Description |
| --- | --- | --- |
| leftClickChildren | <code>array</code> | An array of CSS selectors for child Elements that, when clicked, make this instance enter an interacting state. For example, the user may be allowed to left click on the child images of this instance, but when they click on a specific button should be considered interacting. |

<a name="enterInteractingState"></a>

## enterInteractingState()
This was implemented specifically for Hydra Media Center.

When the listeners created by `supportInteractingState()` detect that the user is interacting
with the Element, this function will set the interacting state for the Element. This can also
be invoked manually.

An event listener will be added to the music-app that determines when the user is done
interacting with the Element. The Element remains in the interacting state while the user
uses the context-menu, or tabs between child Elements.

**Kind**: global function  
<a name="enableDropArea"></a>

## enableDropArea([innerEl], onDrop)
Enables drop listeners on this instnace. This is for recieving drops from
outside of the Electron app, **not** HTML5 drag-n-drop.

Automatically toggles the class "drop-hovering" when the user is hoving
over the instance while dragging something with the mouse.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| [innerEl] | <code>Element</code> \| <code>function</code> | Optionally use a child Element instead of the entire Lowrider Element. Can also be the onDrop arg. |
| onDrop | <code>function</code> | Callback triggered when a drop is recievd. The callback will recieve the event as the first arg, and the dropped items as the second arg. |

<a name="elementFactory"></a>

## elementFactory(options)
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

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | Options object: - `name` - (required) The element name (`div`, `span`, `custom-element`) - `attrs - An object of attributes and their values to be set on the   Element. - `bindings` - An object of keys and values to be bound to the Element. |

<a name="register"></a>

## register(name, implementation)
Registers a custom Element with CustomElementRegistry.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The Element tag, e.g., `custom-list`. |
| implementation | <code>object</code> | The class implementation of the Element. |

