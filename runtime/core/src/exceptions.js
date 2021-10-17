'use strict'

class Exception {
  code
  message

  constructor (code, message) {
    this.code = code
    this.message = message
  }
}

class SystemException extends Exception {
  stack

  constructor (error) {
    super(codes.System, error.message)

    if (error.stack !== undefined && process.env.KOO_ENV === 'dev') this.stack = error.stack
  }
}

class ContractException extends Exception {
  keyword
  property
  schema
  path

  constructor (code, error) {
    super(code || codes.Contract, error.message)

    this.keyword = error.keyword
    this.property = error.property
    this.schema = error.schema
    this.path = error.path
  }
}

class RequestContractException extends ContractException {
  constructor (error) { super(codes.RequestContract, error) }
}

class ResponseContractException extends ContractException {
  constructor (error) { super(codes.ResponseContract, error) }
}

class EntityContractException extends ContractException {
  constructor (error) { super(codes.EntityContract, error) }
}

const codes = {
  System: 0,
  NotImplemented: 10,

  Contract: 200,
  RequestContract: 201,
  ResponseContract: 202,
  EntityContract: 203,

  State: 300,
  StateNotFound: 302,
  StatePrecondition: 303,
  StateConcurrency: 304,

  Communication: 400,
  Transmission: 401
}

/// region exports
exports.Exception = Exception
exports.SystemException = SystemException
exports.RequestContractException = RequestContractException
exports.ResponseContractException = ResponseContractException
exports.EntityContractException = EntityContractException

for (const [name, code] of Object.entries(codes)) {
  const classname = name + 'Exception'

  if (exports[classname] === undefined) {
    exports[classname] = class extends Exception {constructor (message) { super(code, message) }}
  }
}

exports.codes = codes
/// endregion
