const path = require('path')
const express = require('express')

const app = express()
const publicDir = path.normalize(__dirname + '/../')

console.log(publicDir) 

app.use(express.static(publicDir))

/**
 * Route: /
 * 
 * This page delivers the test suite to the browser.
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

console.log('Test server running')
app.listen(3000)