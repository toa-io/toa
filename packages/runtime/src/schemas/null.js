'use strict'

class Null {
  fit (value) {
    const result = { ok: value === null }

    if (!result.ok) { result.oh = { message: ERROR } }

    return result
  }

  defaults () {
    return null
  }
}

const ERROR = 'Cannot set property of null'

exports.Null = Null
