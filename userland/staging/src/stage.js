'use strict'

const stage = {}

const reset = () => {
  Object.assign(stage, {
    reset: reset,
    components: []
  })
}

reset()

/** @type {toa.userland.staging.Stage} */
exports.stage = stage
