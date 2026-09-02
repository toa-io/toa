import { mock } from 'node:test'

// this module defines the replacement, so it still sees the real one
import * as original from '../src/state.js'

const reset = mock.fn(() => original.state.reset())
const state = { ...original.state, reset }

export { state }
