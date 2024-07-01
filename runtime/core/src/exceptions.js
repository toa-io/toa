'use strict'

const { swap } = require('@toa.io/generic')

const codes = {
  System: 0,

  Contract: 200,
  RequestSyntax: 201,
  RequestContract: 202,
  RequestConflict: 203,
  ResponseContract: 211,
  EntityContract: 212,
  QuerySyntax: 221,

  State: 300,
  StateNotFound: 302,
  StatePrecondition: 303,
  StateConcurrency: 304,
  StateInitialization: 305,
  Duplicate: 306,

  Communication: 400,
  Transmission: 401
}

/**
 * @implements {toa.core.Exception}
 */
class Exception {
  code
  message

  constructor (code, message, cause) {
    this.code = code
    this.message = message

    if (cause !== undefined)
      this.cause = cause
  }
}

class SystemException extends Exception {
  stack

  constructor (error) {
    super(codes.System, error.message)

    if (error.stack !== undefined) this.stack = error.stack
  }
}

class ContractException extends Exception {
  constructor (code, error, cause) {
    super(code || codes.Contract, typeof error === 'string' ? error : error?.message, cause)

    if (typeof error === 'object' && error !== null)
      for (const k of ['keyword', 'property', 'schema', 'path', 'params'])
        if (k in error)
          this[k] = error[k]
  }
}

class RequestContractException extends ContractException {
  constructor (error, cause) { super(codes.RequestContract, error, cause) }
}

class ResponseContractException extends ContractException {
  constructor (error, cause) { super(codes.ResponseContract, error, cause) }
}

class EntityContractException extends ContractException {
  constructor (error, cause) { super(codes.EntityContract, error, cause) }
}

// #region exports
exports.Exception = Exception
exports.SystemException = SystemException
exports.RequestContractException = RequestContractException
exports.ResponseContractException = ResponseContractException
exports.EntityContractException = EntityContractException

for (const [name, code] of Object.entries(codes)) {
  const classname = name + 'Exception'

  if (exports[classname] === undefined) {
    exports[classname] = class extends Exception {
      constructor (message, cause) {
        message = message
          ? `${classname}: ${message}`
          : classname

        super(code, message ?? classname, cause)
      }
    }
  }
}

exports.codes = codes
exports.names = swap(codes)
// #endregion
