/**
 * @module Lowrider
 */
 export default class Lowrider extends HTMLElement {
  /**
   * Fires when the custom element enters the document, whether cached or not.
   * 
   * @ignore
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

    // all attribute observers are saved here, so they can be automatically
    // disconnected on DOM removal
    this.attrObservers = []

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

    // if lazy-render mode was set with an attr or a property, attach observers
    // and stop rendering now
    if (this.isUsingLazyRenderMode()) {
      this.enableLazyRender()
      return
    }

    // when NOT using lazy-render, proceed with normal rendering

    if (this.isUsingRenderQueue()) {
      this.addToRenderQueue()
    } else {
      this._finishRender()
    }
  }

  /**
   * When the Element is removed from the document.
   * 
   * @ignore
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
   * Spawns event invoker. The spawn event always triggers, regardless of
   * wehether the Element needs to also render. Your class should implement
   * `onSpawn` to react to this.
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
   * Build event invoker. Does not check `shouldBuild()`. Your class should
   * implement `onBuild` to react to this.
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
   * The load step. Your class should implement `onLoad` to react to this.
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
   * Your class may override this.
   */
  async shouldBuild() {
    if (this.locked) return false

    return this.firstElementChild === null
  }

  /**
   * Returns a new proxied object for use in this.props. 
   * 
   * @returns {object}
   * @ignore
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
   * Lowrider needs globals for some features like the render-queue's. This
   * method will ensure that the globals exist. Globals will only be inited if
   * any Lowrider instance uses a feature that depends on them.
   * 
   * @ignore
   */
  _ensureGlobals() {
    if (!('LowriderGlobals' in window)) {
      window.LowriderGlobals = {
        'renderQueues': {}
      }
    }
  }

  /**
   * Checks if this instance currently has render queueing enabled.
   */
  isUsingRenderQueue() {
    return this.hasAttribute('render-queue')
  }

  /**
   * Inserts a new render queue object with the given name into the Lowrider
   * globals.
   *
   * the queue object contains an array for the queue, a flag that lets us know
   * if the queue is currently running, and the queue itself.
   *
   * The runner is stored in the global so that no single component instance
   * (Element) gets stuck with running the runner.
   * 
   * @param {string} name
   * @ignore
   */
  _createRenderQueue(name) {
    if (name in window.LowriderGlobals.renderQueues) {
      throw new Error(`Render queue ${name} already exists`)
    }

    console.log(`Creating render queue ${name}`)

    window.LowriderGlobals.renderQueues[name] = {
      'queue': [],
      'running': false,
      'runner': async () => {
        if (window.LowriderGlobals.renderQueues[name].running) {
          console.log('cant run twice, normal')
          return
        }

        window.LowriderGlobals.renderQueues[name].running = true
        let queue = window.LowriderGlobals.renderQueues[name].queue

        // as long as there are items in the queue, work with the first one
        // then remove it from the queue
        while (queue.length) {
          let item = queue[0]

          item.classList.remove('in-render-queue')
          await item._finishRender()
          queue.splice(0, 1)

          console.log(`render queue ${name} rendered item`)
        }

        window.LowriderGlobals.renderQueues[name].running = false
        console.log(`Render queue ${name} cleared!`)
      }
    }
  }

  /**
   * Adds this Element to the render queue.
   */
  addToRenderQueue() {
    this._ensureGlobals()

    // if no render queue name is given, use the generic one
    let name = this.getAttribute('render-queue') || 'default'

    // maybe init empty queue object
    if (!(name in window.LowriderGlobals.renderQueues)) {
      this._createRenderQueue(name)
    }

    window.LowriderGlobals.renderQueues[name].queue.push(this)

    this.classList.add('in-render-queue')

    setTimeout(() => {
      this._runRenderQueue(name)
    }, 0)
  }

  /**
   * Begins running a render queue if it not already running. It is safe to call
   * this over and over.
   * 
   * @param {string} name - Render queue name.
   * @ignore
   */
   _runRenderQueue(name) {
    if (!(name in window.LowriderGlobals.renderQueues)) throw new Error(`Render queue ${name} does not exist`)

    // queue is already running
    if (window.LowriderGlobals.renderQueues[name].running) return

    // this loop will continue until the queue has completely rendered
    window.LowriderGlobals.renderQueues[name].runner()
   }

  /**
   * Checks if this instance currently has lazy-render mode enabled.
   */
  isUsingLazyRenderMode() {
    return this.hasAttribute('lazy-render')
  }

  /**
   * Enables lazy-render mode by creating an IntersectionObserver and observing
   * this Element. If you use the `lazy-render` attribute, or the `lazyRender =
   * true` property, you do not need to call this.
   **/
  enableLazyRender() {
    if ('_intersectionObserver' in this && this._intersectionObserver instanceof IntersectionObserver) {
      throw new Error('Already observing visibility')
    }

    // create an observer that watches for the removal of the lazy-render attr
    this._lazyRenderAttrWatcher = this.watchAttr('lazy-render', (changes) => {
      if (this.isUsingLazyRenderMode()) {
        this.disableLazyRender()
      }
    })

    // create an observer that watches for when this element becomes visible.
    // note that since Lowrider components will not have rendered any HTML at
    // this point, the isVisible entry property will always be false (because
    // DOM node is 0x0 px). However, we can still know if it's time to render by
    // using the isIntersecting property, which lets us know if the element is
    // now intersecting the viewport and not hidden.
    this._intersectionObserver = new IntersectionObserver(async (entries, observer) => {
      if (!entries[0].isIntersecting) {
        return
      }

      //console.log('component is intersecting viewport', entries)

      // disable lazy rendering now that is has triggered
      this.disableLazyRender()

      if (this.isUsingRenderQueue()) {
        this.addToRenderQueue()
      } else {
        this._finishRender()
      }
    })
    this._intersectionObserver.observe(this)
  }

  /**
   * Disables lazy-render mode by deleting the observers and ensuring that the
   * attribute is gone. This is normally handled automatically, so you don't
   * need to call this unless your intention is to disable the lazy render
   * callback before it has triggered.
   */
  disableLazyRender() {
    if (!('_intersectionObserver' in this) || !(this._intersectionObserver instanceof IntersectionObserver)) {
      throw new Error('Must be observing visibility')
    }

    this._lazyRenderAttrWatcher.disconnect()
    this._lazyRenderAttrWatcher = null

    this._intersectionObserver.disconnect()
    this._intersectionObserver = null

    if (this.hasAttribute('lazy-render')) {
      this.removeAttribute('lazy-render')
    }
  }

  /**
   * The build and load steps are coupled together with this method, with the
   * load step happening one tick after.
   * 
   * When using lazy-rendering, a component will be spawned, but the build and
   * load steps will be put on hold until the component is visible. When it is,
   * it will call this.
   * 
   * The connectedCallback() also uses this.
   * 
   * @ignore
   */
  _finishRender() {
    // one promise to reolve when the entire component has rendered
    return new Promise(async (renderResolve) => {
      // only trigger build if we have to
      if (await this.shouldBuild()) {
        await this.build()
      }

      // wait one tick so that inner HTML has been inserted into the DOM
      setTimeout(async () => {
        await this.load()
        this.rendered = true

        renderResolve(true)
      }, 0)
    })
  }

  /**
   * Performs a render on an existing Element by calling the `onRemoved` handler
   * first, then `spawn()`, `build()`, and `load()` handlers. This will not
   * actually reinject the Element instance, which means that existing event
   * handlers on the component itself will be preserved.
   *
   * Technically, this is always a *re*render, since one cannot call this
   * without the Element existing in the first place (as in, already rendered).
   *
   * Calling `render()` will disable lazy-render if it's enabled, but not yet
   * rendered.
   *
   * @param {*} [opts] - Optionally give any argument, and that argument will be
   * given to `onSpawn`, `onBuild`, and `onLoad`.
   */
  async render(opts) {
    if (this.locked) return

    // if render() is manually invoked before the lazy-render triggered, we can
    // disable the lazy rendering. do this before awaiting anything here.
    if (this.isUsingLazyRenderMode()) {
      this.disableLazyRender()
    }

    // remove all attribute observers
    if (this.attrObservers.length) {
      for (let observer of this.attrObservers) {
        observer.disconnect()
      }

      this.attrObservers = []
    }

    this.rendered = false

    if ('onRemoved' in this) {
      await this.onRemoved()
    }

    await this.spawn(opts)

    // note that we don't call shouldBuild() here, this will always overwrite
    // the inner HTML
    await this.build(opts)

    setTimeout(() => {
      this.load(opts)
    }, 0)

    this.rendered = true

    return true
  }

  /**
   * Unlocks a web component.
   */
  unlock() {
    this.locked = false
    this.removeAttribute('locked')
  }

  /**
   * Creates a mutation listener that watches for attribute changes.
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

    this.attrObservers.push(observer)

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
   * @param {Array} [options.rightClickEls] - Elements that accept right clicks
   * for entering the interacting state. Defaults to the entire Lowrider Element.
   * @param {Array} [options.leftClickEls] - Elements that accept left clicks
   * for entering the interacting state. Defaults to all child "dot-menu"
   * Elements (for Cardinal purposes).
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
   * When the listeners created by `supportInteractingState()` detect that the user is interacting
   * with the Element, this function will set the interacting state for the Element. This can also
   * be invoked manually.
   * 
   * An event listener will be added to the music-app that determines when the user is done
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
      document.querySelector('music-app').removeEventListener('mouseup', parentEl._checkIfDoneInteracting)
      document.querySelector('music-app').removeEventListener('keyup', parentEl._checkIfDoneInteracting)
      parentEl.classList.remove(this.interactingClassName)
      parentEl._checkIfDoneInteracting = null

      if (this.debug) {
        console.log('%cdone interacting with', `color:${this.consoleColor}`)
        console.log(parentEl)
      }
    }

    // enter interacting state by adding a class and registering event handlers
    parentEl.classList.add(this.interactingClassName)
    document.querySelector('music-app').addEventListener('mouseup', parentEl._checkIfDoneInteracting)
    document.querySelector('music-app').addEventListener('keyup', parentEl._checkIfDoneInteracting)
  }

  /**
   * Enables drop listeners on this instnace. This is for recieving drops from
   * outside of the Electron app, **not** HTML5 drag-n-drop.
   * 
   * Automatically toggles the class "drop-hovering" when the user is hoving
   * over the instance while dragging something with the mouse.
   * 
   * @param {(Element|function)} [innerEl] - Optionally use a child Element
   * instead of the entire Lowrider Element. Can also be the onDrop arg.
   * @param {function} onDrop - Callback triggered when a drop is recievd. The
   * callback will recieve the event as the first arg, and the dropped items as
   * the second arg.
   */
  enableDropArea(innerEl, onDrop) {
    let el = this
    let onDropCb

    if (innerEl instanceof Element) {
      el = innerEl
      onDropCb = onDrop
    } else {
      onDropCb = innerEl
    }

    el.addEventListener('dragover', (event) => {
      event.preventDefault()
    })

    el.addEventListener('dragenter', (event) => {
      event.preventDefault()
      el.classList.add('drop-hovering')
    })

    el.addEventListener('dragleave', (event) => {
      event.preventDefault()
      el.classList.remove('drop-hovering')
    })

    el.addEventListener('drop', (event) => {
      let droppedItems = event.dataTransfer.files
  
      el.classList.remove('drop-hovering')
      
      if (typeof onDropCb === 'function') {
        onDropCb(event, droppedItems)
      }
    })
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
   * @param {string} options.name - Required. Element tag name.
   * @param {object} [options.attrs] - An object of attributes and their values
   * to be set on the Element.
   * @param {object} [options.bindings] - An object of keys and values to be
   * bound to the Element.
   * @static
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

  /**
   * Registers a custom Element with CustomElementRegistry.
   * 
   * @param {string} name - The Element tag, e.g., `custom-list`.
   * @param {object} implementation - The class implementation of the Element.
   * @static
   */
  static register(name, implementation) {
    if (window.customElements.get(name) !== undefined) {
      console.warn(`Custom Element ${name} is already defined`)
      return
    }

    window.customElements.define(name, implementation)
  }
}