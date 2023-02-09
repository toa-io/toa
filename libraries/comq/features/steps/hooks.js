'use strict'

const { Before, AfterAll, BeforeAll } = require('@cucumber/cucumber')
const { connect } = require('@toa.io/libraries/comq')

/** @type {toa.comq.IO} */
let io

BeforeAll(async function () {
  io = await connect('amqp://developer:secret@localhost:5673')
})

Before(
  /**
   * @this {toa.comq.features.Context}
   */
  async function () {
    this.io ??= io
  })

AfterAll(async function () {
  await io?.close()
})
