export const state = {}

const reset = () => {
  Object.assign(state, {
    reset,
    components: [],
    compositions: [],
    workloads: [],
    remotes: [],
    services: []
  })
}

reset()

/** @type {toa.stage.State} */
