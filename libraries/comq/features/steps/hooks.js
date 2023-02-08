'use strict'

const { Before, AfterAll } = require('@cucumber/cucumber')
const { connect } = require('@toa.io/libraries/comq')

/** @type {toa.comq.IO} */
let io

Before(
  /**
   * @this {toa.comq.features.Context}
   */
  async function () {
    this.io ??= await connect('amqp://developer:secret@localhost:5673')

    io = this.io
  })

AfterAll(async function () {
  await io?.close()
})
