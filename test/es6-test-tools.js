export function output(msg) {
  let el = document.querySelector('#output')
  let current = el.innerHTML

  console.log(msg)
  
  el.innerHTML = `${current}${msg}`

  el.scrollTo(0, el.scrollHeight)
}