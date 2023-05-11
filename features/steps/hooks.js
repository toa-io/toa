'use strict'

const stage = require('@toa.io/userland/stage')
const { directory } = require('@toa.io/filesystem')
const { Before, BeforeAll, After } = require('@cucumber/cucumber')

BeforeAll(() => {
  process.env.TOA_DEV = '1'
})

Before(
  /**
   * @this {toa.features.Context}
   */
  async function () {
    this.cwd = await directory.temp()
  })

After(
  async function () {
    await stage.shutdown()
  })
