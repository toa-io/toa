'use strict'

const stage = {}

const reset = () => {
  Object.assign(stage, {
    reset: reset,
    components: [],
    compositions: [],
    remotes: []
  })
}

reset()

/** @type {toa.userland.staging.Stage} */
exports.stage = stage
