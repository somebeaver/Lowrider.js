/**
 * # Lowrider.js
 *
 * Lowrider.js is a web component class written for Hydra Media Center that aims
 * to simplify working with web components in a completely vanilla envrionment.
 * It does this by providing methods for managing a web components lifecycle and
 * state, which normalizes the behavior of all web components in your
 * application.
 *
 * Lowrider.js is not a framework. It only implements a small set of features
 * behind the scenes, but they are very important features that can be used as
 * the foundation for an application or framework.
 *
 * ## Component Lifecycle
 *
 * Working with a web components lifecycle is simplified by breaking down the
 * rendering process into a few distinct steps.
 *
 * 1. `spawn` - Always triggers when an Element instance is created in the
 *    document or `render()` is called.
 * 2. `build` - Builds the inner HTML. Expensive queries should be performed
 *    here. The results of this step are what's cached. Whether this step runs
 *    or not is determined by the instance's `shouldBuild()` method, which
 *    determines if this instance already has cached data and whether it should
 *    perform a full render. By default, it checks for the existance of any
 *    inner HTML.
 * 3. `load` - Triggered after all child Elements, *and their children*, have
 *    rendered, whether this Element was loaded from cache or not, and whether
 *    the build step ran or not.
 *
 * Lowrider.js's main benefit is that it will automatically manage these
 * lifecycle events for you, and only trigger the appropiate steps when
 * necessary. This makes it easy to separate web component code by what should
 * and shouldn't run every time the component is rendered, which means you're
 * writing better optimized components from the start. And since there is no
 * virtual DOM, Lowrider.js componets are very fast.
 *
 * ## Component State
 *
 * Managing component state is complicated by caching. While Lowrider.js does
 * not provide a built-in cache storage, it is prepared for you to cache your
 * components by saving their outerHTML property. When you cache a component
 * this way and reinject it, Lowrider.js will detect the existing innerHTML and
 * the `build` event will not trigger.
 *
 * Lowrider.js is designed for use with the light DOM.
 *
 * ## Usage example
 *
 * ```
 * import Lowrider from 'Lowrider'
 *
 * // create a class that extends the Lowrider class
 * class SongList extends Lowrider {
 *   // you can implement these methods
 *   onSpawn(renderOpts) {}
 *   onBuild(renderOpts) {}
 *   onLoad(renderOpts) {}
 *   onRemoved(renderOpts) {}
 *   shouldBuild() {}
 * }
 *
 * // register your custom Element with the browser
 * window.customElements.define('song-list', SongList)
 *
 * // inject the Element anywhere in your document body,
 * // it will automatically perform a full render, which
 * // begins by invoking your `onSpawn` method.
 * document.body.innerHTML = '<song-list></song-list>'
 *
 * // your component will automatically have these methods and properties,
 * // they are the public API of your Element instances.
 * // do not overwrite them (but you can if you know what you're doing)
 * let songListElement = document.querySelector('song-list')
 *
 * // since Elements automatically render upon injection in the DOM,
 * // calling `render()` is always technically a *re*render
 * songListElement.render(options) // you can give options to render()
 *
 * // you can trigger individual lifecycle steps if you want, but this
 * // isn't normally needed
 * songListElement.spawn()
 * songListElement.build()
 * songListElement.load()
 *
 * // watch certain attributes of this instance
 * songListElement.watchAttr(['id'])
 *
 * // enable infinite scroll on this instance
 * songListElement.supportInfiniteScroll()
 *
 * // "Interacting" state, implemented specifically for Hydra Media Center
 * songListElement.supportInteractingState()
 * songListElement.enterInteractingState()
 *
 * // one-way text binding with child Elements
 * songListElement.props.title = 'Hello'
 *```
 *
 * ## Using `props`
 *
 * Lowrider.js web components have a property called `props`. This property is
 * an object that can be used for for one-way data binding with inner HTML.
 *
 * **Do not overwrite the `props` property itself, it is a special proxied
 * object.**
 *
 * Example:
 *
 * ```
 * // in the inner HTML:
 * <p data-prop="listName"></p>
 *
 * // in the Element instance
 * this.props.listName = 'Playlist 1'
 * ```
 *
 * ## Detailed lifecycle breakdown
 *
 * #### `.onSpawn()`
 * - Usage:
 *   - The `spawn` event is the very first step in the rendering process. It is
 *     triggered immediately after the custom Element is inserted into the DOM,
 *     before the Element has been painted onto the screen. Your `onSpawn`
 *     method should be the "brains" of the Element, and can handle loading
 *     dynamic data that's required during the entire lifecycle of the Element.
 *     Inner HTML is not available in the spawn step.
 * - Solves these issues:
 *   - When loading a pre-rendered custom Element from cache, the instance will
 *     no longer have any dynamic data because the Element itself was removed
 *     from the DOM, which makes the browser erase it from memory. The spawn
 *     event should be used to reinitialize the dynamic data that your component
 *     needs.
 * - Tips:
 *   - Keep the spawn event as lightweight as possible because many of them will
 *     trigger at the same time if there are many instances of the Element in
 *     the DOM, even when loading from cache.
 *   - The `spawn` event should not create any new inner HTML (it will overwrite
 *     what may have been cached).
 *   - The `onSpawn` method can be used to register event handlers directly on
 *     the custom Element, to determine context, to load internal data, to
 *     register IPC listeners, MutationObservers, and more.
 * - Real life example:
 *   - If you were making a todo list application, this step could be used to
 *     register event listeners directly on the <todo-list> itself (**not** on
 *     child HTML), or to register an attribute observer. A simple todo app
 *     could completely omit this step.
 *
 * #### `.onBuild()`
 * - Usage:
 *   - The `build` event triggers after the `spawn` event. Your `onBuild` method
 *     should create the "body" of the instance by injecting child HTML. The
 *     HTML may come from a .html file on the local disk, from a XHR request, or
 *     may be statically typed within the class definition. This method should
 *     always perform a "fresh" build and overwrite any preexisting child HTML.
 *     Other Elements should be able to invoke your Lowrider `build()` method
 *     and the result should be a fresh build every time.
 * - Solves these issues:
 *   - When loading pre-rendered custom Elements from cache, it is necessary to
 *     maintain the state of the pre-rendered HTML. To do that, we must be able
 *     to block the Element from rendering when it's being loaded from cache.
 *     This is easy when the rendering logic is separate from all other logic.
 *     It also prevents needless XHR requests when we already have the data.
 * - Tips:
 *   - The `onBuild` method is the right place for the heaviest work of your
 *     component.
 * - Real life example:
 *   - A todo list application should definitely use this step to query the
 *     database for the contents of the todo list, and any other data that needs
 *     to be shown. It should also use this step to build the inner HTML and
 *     inject it into the DOM. These are the heaviest tasks of the todo list,
 *     and it's what we would want to be cached.
 *
 * #### `.onLoad()`
 * - Usage:
 *   - This is triggered after this instance, and all child Lowrider Elements
 *     have rendered (only when **all child custom Elements** extend Lowrider).
 * - Solves these issues:
 *   - One issue with web components and the light DOM is that when you use
 *     custom Element "A" to inject custom Element "B", code execution within
 *     "A" does not wait for "B" to render *its own inner HTML*. The top-level
 *     `connectedCallback()` of "B" will have executed, but any subsequent
 *     Promises or callbacks will still be executing. The `onLoad` callback
 *     fixes this and will only fire after child custom Elements have rendered
 *     *their* inner HTML. When all of your child custom Elements extend
 *     Lowrider, you can be sure that the entire chain of child Elements has
 *     rendered before "A"s `onLoad` triggers.
 * - Tips:
 *   - In general, web components should avoid registering event handlers on the
 *     contents of other web components. A DOM nodes concerns should be scoped
 *     to within its own component.
 * - Real life example:
 *   - A todo list application would use this step to register event handlers on
 *     its rendered inner HTML. They could be drag-n-drop handlers, clicks, or
 *     whatever else. This is the right time to interact with inner HTML.
 *
 * #### `onRemoved()`
 * - Usage:
 *   - This is triggered when the Element is removed from the DOM.
 * - Tips:
 *   - Use this to clean up any delegated event handlers, IPC listeners,
 *     EventEmitters, and MutationObservers.
 * - Real life example:
 *   - A todo list application would proabably omit this step (event handlers
 *     would be automatically removed when those nodes are removed), but could
 *     use this step to perform last second writes to the database to record
 *     user interaction.
 *
 * ## Dynamically creating live components (`Lowrider.elementFactory()`)
 *
 * Lowrider.js comes with a static method that can create web component
 * instances with data pre-bound to them. This is especially useful when you
 * have a parent-child relationship between two components, and the child is
 * designed to spawn with data from the parent that cannot be stringified
 * (functions, Element references, etc), or is too large to fit into an element
 * attribute when stringified.
 *
 * Usage:
 * ```
 * import Lowrider from 'Lowrider'
 *
 * // in the parent component, create a child component with pre-bound data
 * let childEl = Lowrider.elementFactory('child-element', {
 *   'bindings': {
 *     'speak': () => { console.log("Help I'm alive") }
 *   }
 * })
 *
 * // insert child, the lifecycle events will trigger for the first time
 * parentNode.appendChild(childEl)
 *
 * childEl.speak() // "Help I'm alive"
 * ```
 *
 * ## Common Pitfalls
 *
 * - Do not try to inject an "empty" component, then on the next line call it's
 *   `render(data)` function.
 *    - You are actually rendering twice, and even if you lock down your
 *      component to not render unless it has that custom `data` given through
 *      `render(data)`, you will run into issues when loading from the cache
 *      because the `render()` function is not called at all, so you won't have
 *      your custom `data`.
 *    - Since Lowrider components wait for their children to render, you will
 *      almost surely call `render(data)` before `onLoad()` triggers in the
 *      first render when the element was inserted, leaving your component
 *      partially rendered before rerendering, potentially creating an undesired
 *      state.
 *    - This anti-pattern is solved by the `Lowrider.elementFactory()`, which
 *      you can use to pre-bind your data to the component.
 * - It is easy to accidentially create infinite loops by watching an attribute
 *   that triggers a render, and in the render setting/updating that attribute.
 */
export default class Lowrider extends HTMLElement {
  /**
   * Fires when the custom element enters the document, whether cached or not.
   */
  async connectedCallback() {
    this.locked = this.hasAttribute('locked')

    if (this.locked) return

    this.debug = 0
    this.consoleColor = '#f05ee4'
    this.interactingClassName = 'interacting'

    this.spawned = false
    this.built = false
    this.rendered = false

    // if a 'props' object was given to the element factory, this will preserve
    // it before creating a proxied object
    this.__preservedProps = this.props
    this.props = this._newPropsProxiedObject()

    if (this.debug) {
      console.log(`%cLowrider connectedCallback for:`, `color:${this.consoleColor};`)
      console.log(this)
    }

    // always remove the interacting class in case it was cached
    this.classList.remove(this.interactingClassName)

    // trigger spawn, which triggers the implemented onSpwan()
    await this.spawn()

    // only trigger build if we have to
    if (await this.shouldBuild()) {
      await this.build()
    }

    // wait one tick for any injected child web components to render
    setTimeout(async () => {
      await this.load()
    }, 0)

    this.rendered = true
  }

  /**
   * When the Element is removed from the document.
   */
  disconnectedCallback() {
    if (this.locked) return

    // if the user enabled infinite scroll support, automatically remove the
    // registered scroll listeners
    if (this._supportedInfiniteScrollEventListener) {
      this._supportedInfiniteScrollParent.removeEventListener('scroll', this._supportedInfiniteScrollEventListener)
    }

    if ('onRemoved' in this) {
      this.onRemoved()
    }
  }

  /**
   * Spawns the instance "brains". The spawn event always triggers, regardless
   * of wehether the Element needs to also render.
   * 
   * - Usage:
   *   - Invoke `.spawn()` when you only want to refresh the dynamic part of the
   *     instance and not refresh the inner HTML.
   *   - This is usually not what you want to do... but it exists and is exposed.
   * 
   * @param {*} [renderOpts] - Options to give to `onSpawn()`.
   */
  async spawn(renderOpts) {
    if (this.locked) return

    // if the extender defined an onSpawn method, trigger it
    if ('onSpawn' in this) {
      let onSpawnReturn = await this.onSpawn(renderOpts)

      if (onSpawnReturn === false) {
        this.spawned = false
        return false
      }
    }

    this.spawned = true
    return true
  }

  /**
   * Renders the inner HTML of the Element instance.
   * 
   * @param {*} [renderOpts] - Options to give to `onBuild()`.
   */
  async build(renderOpts) {
    if (this.locked) return

    let onBuildReturn

    // if the extender defined an onBuild method
    if ('onBuild' in this) {
      onBuildReturn = await this.onBuild(renderOpts)

      // if onBuild returned false, this.built stays false
      if (onBuildReturn === false) {
        this.built = false
      } else {
        this.built = true
      }
    }

    return onBuildReturn
  }

  /**
   * The load step.
   */
  async load() {
    if ('onLoad' in this) {
      this.onLoad()
    }
    
    // if props were preserved earlier in the render process, apply them now
    if (typeof this.__preservedProps === 'object' && this.__preservedProps !== null) {
      for (let [key, value] of Object.entries(this.__preservedProps)) {
        this.props[key] = value
      }
    }
  }

  /**
   * Determines whether this instance should render or not. This is determined
   * by checking if there is any child Element. If none exists, we must render.
   * 
   * This method can be overwritten by Elements that implement Lowrider.
   */
  async shouldBuild() {
    if (this.locked) return false

    return this.firstElementChild === null
  }

  /**
   * Calls the `onRemoved` handler first, then performs a full render, which
   * triggers the `onSpawn`, `onBuild`, and `onLoad` handlers. This will not
   * actually reinject the Element instance, which means that existing event
   * handlers on the component itself will be preserved.
   * 
   * Note: since this calls `onRemoved` first, the name 'render' for this may seem
   * counterintuitive, becuause 'render' implies a fresh creation, but this only
   * works when there's an old instance to *re*render. 
   * 
   * @param {*} [opts] - Optionally give any argument, and that argument will be
   * given to `onSpawn`, `onBuild`, and `onLoad`.
   */
  async render(opts) {
    if (this.locked) return

    if ('onRemoved' in this) {
      await this.onRemoved()
    }

    await this.spawn(opts)
    await this.build(opts)

    setTimeout(() => {
      if ('onLoad' in this) {
        this.onLoad(opts)
      }
    }, 0)

    this.rendered = true
  }

  /**
   * Creates a mutation listener that watches for attribute changes
   * 
   * @param {(string|array)} attr - Attribute name, or an array of attributes.
   */
  watchAttr(attr, cb) {
    if (this.locked) return

    // maybe wrap attr in array
    if (!Array.isArray(attr)) attr = [attr]

    let observer = new MutationObserver((mutations) => {
      cb(mutations)
    })
    
    observer.observe(this, {
      'attributes': true,
      'attributeOldValue': true,
      'attributeFilter': attr
    })

    return observer
  }

  /**
   * Enables support for infinite scroll on an Element instance by registering
   * `scroll` event listeners on a parent.
   * 
   * Automatically removes the event listener on element removal.
   *
   * @param {Function} cb - Callback function.
   * @param {string} viewSelector - CSS selector for the element on which to
   * attach the scroll listener. Defaults to `body`.
   * @returns {Function} Returns the scroll listener function, so that it can be
   * unregistered later.
   */
  supportInfiniteScroll(cb, viewSelector = 'body', bottomOffset = 600) {
    const view = document.querySelector(viewSelector)

    let boundCb = cb.bind(this)

    // save a reference, so that we can unregister the listener on element removal
    let delegated = (event) => {
      if (this.getBoundingClientRect().bottom <= view.getBoundingClientRect().bottom + bottomOffset) {
        boundCb()
      }
    }

    view.addEventListener('scroll', delegated)
  }
  
  /**
   * This was implemented specifically for Hydra Media Center.
   *
   * This function registers event listeners on the web component that help
   * determine when a user is interacting with it.
   *
   * Any web component may enter an "interacting" state, which means the user
   * has either:
   *
   * - Left clicked a specific child Element
   * - Right clicked anywhere in the Element
   * - Focused a child Element (typically by tabbing into it)
   *
   * When the listeners detect that the user is interacting with the web
   * component, they will invoke enterInteractingState() on it, which can also
   * be called manually.
   *
   * @paran {Element} [interactionEl] - Use this child Element instead of the
   * the entire component as the listener for left/right clicks.
   * @param {array} leftClickChildren - An array of CSS selectors for child
   * Elements that, when clicked, make this instance enter an interacting state.
   * For example, the user may be allowed to left click on the child images of
   * this instance, but when they click on a specific button should be
   * considered interacting.
   */
  supportInteractingState(options = {}) {
    if (!('rightClickEls' in options)) options.rightClickEls = [this]
    if (!('leftClickEls' in options)) options.leftClickEls = [...Array.from(this.querySelectorAll('dot-menu'))]

    // on RIGHT MOUSEDOWN of right clickable Elements, enter interacting state
    if (options.rightClickEls.length) {
      for (let el of options.rightClickEls) {
        el.addEventListener('mousedown', (event) => {
          if (event.which === 3) {
            this.enterInteractingState()
          }
        })
      }
    }

    // on LEFT MOUSEDOWN of specific children (if there are any), enter interacting state
    if (options.leftClickEls.length) {
      for (let el of options.leftClickEls) {
        el.addEventListener('mousedown', (event) => {
          if (event.which === 1) {
            this.enterInteractingState()
          }
        })
      }
    }

    // on FOCUS of certain child Elements, enter interacting state.
    let focusableChildren = Array.from(this.querySelectorAll('a, button, [tabindex="0"]'))

    if (focusableChildren.length) {
      for (let childFocusableEl of focusableChildren) {
        childFocusableEl.addEventListener('focus', (event) => {
          this.enterInteractingState()
        })
      }
    }
  }

  /**
   * This was implemented specifically for Hydra Media Center.
   * 
   * When the listeners created by `supportInteractingState()` detect that the user is interacting
   * with the Element, this function will set the interacting state for the Element. This can also
   * be invoked manually.
   * 
   * An event listener will be added to the fullsize-app that determines when the user is done
   * interacting with the Element. The Element remains in the interacting state while the user
   * uses the context-menu, or tabs between child Elements.
   */
  enterInteractingState() {
    let parentEl = this

    // do nothing if the Element is already in the interacting state. it is logical to expect the user
    // to interact again with something they're already interacting with, so this is not considered an error
    if (parentEl.classList.contains(this.interactingClassName)) return

    // this function gets saved in the the interacting Element, and gets used as a mouseup AND keyup
    // listener, and will determine when the user is done interacting with the Element. When that
    // determination is made, it will automatically delete all references to itself and remove all listeners.
    parentEl._checkIfDoneInteracting = (event) => {
      if (this.debug) {
        console.log('%cchecking if done interacting with', `color:${this.consoleColor}`)
        console.log(parentEl)
        console.log('%cmb or kb event', `color:${this.consoleColor}`)
        console.log(event)
      }

      // keyboard specific
      if (event instanceof KeyboardEvent) {
        // allow modifers
        if (event.key === 'Shift' || event.key === 'Alt' || event.key === 'Meta' || event.key === 'Control') return
        // event does not end interaction as long as the focus is still within a context-menu
        if (event.target.closest('context-menu')) return
        // event does not end interaction when pressing keys while focused within the block
        if (parentEl.contains(event.target)) return
      }

      // mouse specific
      if (event instanceof MouseEvent) {
        // event does not end interaction when user right clicks...
        if (event.which === 3) {
          // ...within the parent
          if (parentEl.contains(event.target)) return
          // ...or within context menus
          if (event.target.closest('context-menu')) return
        }

        // event does not end interaction when user left clicks...
        if (event.which === 1) {
          // ...on dot-menu's within the parent
          let dotMenu = parentEl.querySelector('dot-menu')
          if (dotMenu && dotMenu.contains(event.target)) return
        }
      }

      // allowed to interact with dropdown items within the context menu without exiting interacting state.
      // clicking other context menu items automatically closes the context menu and ends interaction state.
      if (event.target.matches('context-menu .dropdown-item') || event.target.matches('context-menu .dropdown-item > span')) {
        return
      }

      // event must have been outside the Element, exit the interacting state
      document.querySelector('fullsize-app').removeEventListener('mouseup', parentEl._checkIfDoneInteracting)
      document.querySelector('fullsize-app').removeEventListener('keyup', parentEl._checkIfDoneInteracting)
      parentEl.classList.remove(this.interactingClassName)
      parentEl._checkIfDoneInteracting = null

      if (this.debug) {
        console.log('%cdone interacting with', `color:${this.consoleColor}`)
        console.log(parentEl)
      }
    }

    // enter interacting state by adding a class and registering event handlers
    parentEl.classList.add(this.interactingClassName)
    document.querySelector('fullsize-app').addEventListener('mouseup', parentEl._checkIfDoneInteracting)
    document.querySelector('fullsize-app').addEventListener('keyup', parentEl._checkIfDoneInteracting)
  }

  /**
   * Unlocks a web component.
   */
  unlock() {
    this.locked = false
    this.removeAttribute('locked')
  }

  /**
   * Returns a new proxied object for use in this.props.
   * 
   * @returns {object}
   */
  _newPropsProxiedObject() {
    let newProxiedObject = {}

    let handlers = {
      'set': (target, key, newValue) => {
        target[key] = newValue

        for (let child of this.querySelectorAll(`[data-prop="${key}"]`)) {
          child.innerHTML = newValue
        }
        
        return true
      }
    }

    return new Proxy(newProxiedObject, handlers)
  }

  /**
   * Creates and returns an Element node of any type with pre-bound data. This
   * can be used to bind data to the Element instance before any lifecycle
   * events fire (including the internal `connectedCallback`). The factory is
   * typically used to create Elements that extend Lowrider.js, but can be used
   * to create any Element.
   *
   * The name `elementFactory` means that this is the factory, not that this
   * function returns a factory function.
   *
   * This returns a live Element node, that when inserted into the DOM, will
   * trigger all lifecycle events like normal, but will have the data bindings
   * available within it.
   *
   * The main purpose of this is to create new Lowrider components that are
   * designed to spawn with a large dataset (too large for attributes, or cannot
   * be stringified).
   *
   * If creating a custom element, that custom element must have already been
   * registered with the browser.
   *
   * @param {object} options - Options object:
   * - `name` - (required) The element name (`div`, `span`, `custom-element`)
   * - `attrs - An object of attributes and their values to be set on the
   *   Element.
   * - `bindings` - An object of keys and values to be bound to the Element.
   */
  static elementFactory(options) {
    let fragment = document.createDocumentFragment()
    let parent = document.createElement('div')

    fragment.appendChild(parent)

    parent.innerHTML = `<${options.name}></${options.name}>`
    let el = parent.firstElementChild

    if ('attrs' in options && typeof options.attrs === 'object') {
      for (let [attr, value] of Object.entries(options.attrs)) {
        if (typeof value !== 'string') {
          value = JSON.stringify(value)
        }

        el.setAttribute(attr, value)
      }
    }

    if ('bindings' in options && typeof options.bindings === 'object') {
      for (let [key, value] of Object.entries(options.bindings)) {
        el[key] = value
      }
    }

    return el
  }
}