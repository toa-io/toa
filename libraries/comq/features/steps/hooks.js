'use strict'

const { Before, AfterAll, BeforeAll, setDefaultTimeout } = require('@cucumber/cucumber')
const { connect } = require('@toa.io/libraries/comq')

setDefaultTimeout(60 * 1000)

/** @type {comq.IO} */
let io

BeforeAll(async function () {
  io = await connect('amqp://developer:secret@localhost:5673')
})

Before(
  /**
   * @this {comq.features.Context}
   */
  async function () {
    this.io ??= io
  })

AfterAll(async function () {
  await io?.close()
})
