'use strict'

// TODO: redesign exceptions handling

class Exception {
  code
  message

  constructor (code = Exception.SYSTEM, error) {
    if (code instanceof Error) {
      if (process.env.KOO_ENV === 'dev') this.stack = code.stack

      error = code.message
      code = Exception.SYSTEM
    }

    if (typeof code === 'object') Object.assign(this, code)
    else {
      this.code = code

      if (typeof error === 'object' && error !== null) Object.assign(this, error)
      else this.message = error
    }
  }

  static SYSTEM = 0
  static TIMEOUT = 1
  static PRECONDITION = 10
  static QUERY = 11
  static POSTCONDITION = 20
  static STORAGE = 30
  static STORAGE_MISSED = 32
  static STORAGE_PRECONDITION = 32
  static STORAGE_POSTCONDITION = 33
  static TRANSMISSION = 40
  static EMISSION = 41

  // static name (code) {
  //   if (!this.name.names) {
  //     this.name.names = Object.fromEntries(Object.entries(Exception).map(
  //       ([name, code]) => [code, name]))
  //   }
  //
  //   return this.name.names[code]
  // }
}

exports.Exception = Exception
