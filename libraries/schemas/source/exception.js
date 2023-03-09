'use strict'

class Exception extends TypeError {
  keyword
  schema
  property
  path

  /**
   * @param {toa.schemas.Error} error
   */
  constructor (error) {
    super(error.message)

    const { message, ...rest } = error

    Object.assign(this, rest)
  }
}

exports.Exception = Exception
