import freeze from 'deep-freeze'

/**
 * Standard operation input/output
 */
export default class IO {
  input = {}
  output = {}
  error = {}

  constructor () {
    Object.freeze(this)
    Object.seal(this)
  }

  close () {
    freeze(this.input)
  }
}
