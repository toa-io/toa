'use strict'

const state = {}

const reset = () => {
  Object.assign(state, {
    reset,
    components: [],
    compositions: [],
    remotes: [],
    services: []
  })
}

reset()

/** @type {toa.stage.State} */
exports.state = state
