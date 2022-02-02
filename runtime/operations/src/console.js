'use strict'

const ora = require('ora')

class Console {
  #indicate

  #spinner = null

  constructor (indicate = true) {
    this.#indicate = indicate
  }

  async task (label, task) {
    this.#label(label)
    let result

    try {
      result = await task()

      this.#success()
    } catch (e) {
      this.#fail()
      throw e
    }

    return result
  }

  async sequence (label, sequence) {
    const length = sequence.length
    const results = []

    try {
      for (let i = 0; i < length; i++) {
        this.#label(label, i + 1, length)

        const result = await sequence[i]()

        results.push(result)
      }

      this.#success()
    } catch (e) {
      this.#fail()
      throw e
    }

    return results
  }

  #label (text, iteration, length) {
    if (this.#indicate === false) return

    if (iteration !== undefined) text += ` [${iteration}/${length}]`

    if (this.#spinner === null) this.#spinner = ora(text).start()
    else this.#spinner.text = text
  }

  #success () {
    if (this.#spinner === null) return

    this.#spinner.succeed()
    this.#spinner = null
  }

  #fail () {
    if (this.#spinner === null) return

    this.#spinner.fail()
    this.#spinner = null
  }
}

exports.Console = Console
