'use strict'

const { connect } = require('@toa.io/libraries/comq')
const { url } = require('../const')

let io

async function run () {
  io = await connect(url)

  console.log('Connected to AMQP server')

  await io.reply('add_numbers', produce)

  console.log('Waiting for requests...')

  process.on('SIGINT', exit)
}

async function produce ({ a, b }) {
  console.log(`Request received with ${a} and ${b}`)

  return a + b
}

async function exit () {
  await io.close()

  console.log('Disconnected from AMQP server')
}

run().then()
