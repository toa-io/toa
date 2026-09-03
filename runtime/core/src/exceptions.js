import { swap } from '@toa.io/generic'

export const codes = {
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
export class Exception {
  code
  message

  constructor (code, message, cause) {
    this.code = code
    this.message = message

    if (cause !== undefined)
      this.cause = cause
  }
}

export class SystemException extends Exception {
  stack

  constructor (error) {
    super(codes.System, error.message)

    if (error.stack !== undefined) this.stack = error.stack
  }
}

export class ContractException extends Exception {
  constructor (code, error, cause) {
    super(code || codes.Contract, typeof error === 'string' ? error : error?.message, cause)

    if (typeof error === 'object' && error !== null)
      for (const k of ['keyword', 'property', 'schema', 'path', 'params'])
        if (k in error)
          this[k] = error[k]
  }
}

export class RequestContractException extends ContractException {
  constructor (error, cause) { super(codes.RequestContract, error, cause) }
}

export class ResponseContractException extends ContractException {
  constructor (error, cause) { super(codes.ResponseContract, error, cause) }
}

export class EntityContractException extends ContractException {
  constructor (error, cause) { super(codes.EntityContract, error, cause) }
}

export class EntityGuardException extends ContractException {
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

export const RequestSyntaxException = derive('RequestSyntax')
export const RequestConflictException = derive('RequestConflict')
export const QuerySyntaxException = derive('QuerySyntax')
export const StateException = derive('State')
export const StateNotFoundException = derive('StateNotFound')
export const StatePreconditionException = derive('StatePrecondition')
export const StateConcurrencyException = derive('StateConcurrency')
export const StateInitializationException = derive('StateInitialization')
export const DuplicateException = derive('Duplicate')
export const CommunicationException = derive('Communication')
export const TransmissionException = derive('Transmission')

export const names = swap(codes)
// #endregion
