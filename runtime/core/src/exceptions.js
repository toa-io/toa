import { swap } from '@toa.io/generic'

const codes = {
  System: 0,

  Contract: 200,
  RequestSyntax: 201,
  RequestContract: 202,
  RequestConflict: 203,
  ResponseContract: 211,
  EntityContract: 212,
  EntityGuard: 213,
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

class EntityGuardException extends ContractException {
  constructor (name, cause) { super(codes.EntityGuard, name, cause) }
}

// #region exports







// a module's exports are static, so the ones that follow a code are named rather
// than generated onto the namespace
function derive (name) {
  const classname = name + 'Exception'

  return class extends Exception {
    constructor (message, cause) {
      super(codes[name], message ? `${classname}: ${message}` : classname, cause)
    }

    static name = classname
  }
}

const RequestSyntaxException = derive('RequestSyntax')
const RequestConflictException = derive('RequestConflict')
const QuerySyntaxException = derive('QuerySyntax')
const StateException = derive('State')
const StateNotFoundException = derive('StateNotFound')
const StatePreconditionException = derive('StatePrecondition')
const StateConcurrencyException = derive('StateConcurrency')
const StateInitializationException = derive('StateInitialization')
const DuplicateException = derive('Duplicate')
const CommunicationException = derive('Communication')
const TransmissionException = derive('Transmission')

export const names = swap(codes)
// #endregion

export {
  Exception,
  SystemException,
  ContractException,
  RequestContractException,
  ResponseContractException,
  EntityContractException,
  EntityGuardException,
  RequestSyntaxException,
  RequestConflictException,
  QuerySyntaxException,
  StateException,
  StateNotFoundException,
  StatePreconditionException,
  StateConcurrencyException,
  StateInitializationException,
  DuplicateException,
  CommunicationException,
  TransmissionException,
  codes
}
