import Lowrider from '../index.js'
import { output } from './es6-test-tools.js' 

// register a few test components
Lowrider.register('test-element-1', class TestElement1 extends Lowrider {
  onSpawn() {output(`<p><span class="te _1"></span> onSpawn() ${window.testStartTime - performance.now()}</p>`)}
  onBuild() {output(`<p><span class="te _1"></span> onBuild() ${window.testStartTime - performance.now()}</p>`)}
  onLoad() {output(`<p><span class="te _1"></span> onLoad() ${window.testStartTime - performance.now()}</p>`)}
  shouldBuild() {return true}
})
Lowrider.register('test-element-2', class TestElement2 extends Lowrider {
  onSpawn() {output(`<p><span class="te _2"></span> onSpawn() ${window.testStartTime - performance.now()}</p>`)}
  onBuild() {output(`<p><span class="te _2"></span> onBuild() ${window.testStartTime - performance.now()}</p>`)}
  onLoad() {output(`<p><span class="te _2"></span> onLoad() ${window.testStartTime - performance.now()}</p>`)}
  shouldBuild() {return true}
})
Lowrider.register('test-element-3', class TestElement3 extends Lowrider {
  onSpawn() {output(`<p><span class="te _3"></span> onSpawn() ${window.testStartTime - performance.now()}</p>`)}
  onBuild() {
    return new Promise((r) => {
      setTimeout(() => {
        output(`<p><span class="te _3"></span> onBuild() ${window.testStartTime - performance.now()}</p>`)
        r()
      }, 1500)
    })
  }
  onLoad() {output(`<p><span class="te _3"></span> onLoad() ${window.testStartTime - performance.now()}</p>`)}
  shouldBuild() {return true}
})
Lowrider.register('test-element-4', class TestElement4 extends Lowrider {
  onSpawn() {output(`<p><span class="te _4"></span> onSpawn() ${window.testStartTime - performance.now()}</p>`)}
  onBuild() {output(`<p><span class="te _4"></span> onBuild() ${window.testStartTime - performance.now()}</p>`)}
  onLoad() {output(`<p><span class="te _4"></span> onLoad() ${window.testStartTime - performance.now()}</p>`)}
  shouldBuild() {return true}
})

function begin() {
  output('<h3>Running all tests in Lowrider.js test suite</h3>')

  window.testStartTime = performance.now()

  testOrderOfEvents()
}

function testOrderOfEvents() {
  output('<h4>Test #1: Lifecycle, order of events</h4>')
  output(`<em>There are a few main things to look for here:</em>
          <ul>
            <li><em><span class="te _4"></span>'s onSpawn() should come before <span class="te _3"></span>'s</span>'s onSpawn()</em></li>
          </ul>`)

  let html = /*html*/`
    <div id="order-of-events" class="test">
      <test-element-1>
        <test-element-2>
          <test-element-4></test-element-4>
        </test-element-2>
        <test-element-3></test-element-3>
      </test-element-1>
    </div>`

  document.querySelector('#runner').insertAdjacentHTML('afterbegin', html)

  // since Lowrider's load event always waits a whole tick before ending, wait
  // 100ms here which should pretty much guarentee the test is done. 
  setTimeout(() => {
    output('<strong>Test #1 complete</strong>')
  }, 100)
}

begin()