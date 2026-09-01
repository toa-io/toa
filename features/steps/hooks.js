'use strict'

const stage = require('@toa.io/userland/stage')
const { directory } = require('@toa.io/filesystem')
const { Before, BeforeAll, After } = require('@cucumber/cucumber')

BeforeAll(() => {
  process.env.TOA_DEV = '1'

  // the outbox pumps on a tick; at the default five seconds a scenario would
  // end before it ran
  process.env.TOA_OUTBOX_INTERVAL ??= '100'

  // a replica reads nothing until it knows which lanes are its own, so recovery is only
  // observable with coordination running; it takes two agreeing intervals to hand out a pair
  process.env.TOA_ATOMICITY_REDIS ??= 'redis://localhost'
  process.env.TOA_ATOMICITY_INTERVAL ??= '150'
})

Before(
  /**
   * @this {toa.features.Context}
   */
  async function() {
    this.cwd = await directory.temp()
    this.containers = {}
  })

After(
  async function() {
    await stage.shutdown()
  })
