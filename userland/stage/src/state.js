'use strict'

const state = {}

const reset = () => {
  Object.assign(state, {
    reset: reset,
    components: [],
    compositions: [],
    remotes: []
  })
}

reset()

/** @type {toa.stage.State} */
exports.state = state
