'use strict'

const { connect } = require('@toa.io/libraries/comq')
const { url } = require('../const')

let io
let interval

const INTERVAL = 1000

async function run () {
  io = await connect(url)

  console.log('Connected')

  interval = setInterval(emit, INTERVAL)

  process.on('SIGINT', exit)
}

async function emit () {
  const number = Math.round(Math.random() * 100)

  await io.emit('random_numbers', number)

  console.log(`Random number ${number} emitted`)
}

async function exit () {
  clearInterval(interval)

  await io.close()

  console.log('Disconnected')
}

run().then()
