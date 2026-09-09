import { it } from 'node:test'
import assert from 'node:assert/strict'

import {
  permanent,
  codes,
  SystemException,
  RequestContractException,
  StateNotFoundException,
  StateConcurrencyException,
  TransmissionException,
  EndpointException,
  DuplicateException,
  Exception
} from '../source/exceptions.js'

it('should not call a failure it did not name permanent', () => {
  assert.equal(permanent(new SystemException(new Error('ECONNREFUSED'))), false)
  assert.equal(permanent(new Error('ECONNREFUSED')), false)
  assert.equal(permanent(undefined), false)
  assert.equal(permanent(null), false)
  assert.equal(permanent('nope'), false)
  assert.equal(permanent(new Exception(999, 'not ours')), false)
})

it('should call a request the contract refuses permanent', () => {
  assert.equal(permanent(new RequestContractException('input is required')), true)
  assert.equal(permanent(new DuplicateException()), true)
})

it('should tell an endpoint that is not there from a call nothing carried', () => {
  // one is a fact about the component, the other a moment in a deployment
  assert.equal(permanent(new EndpointException('no such thing')), true)
  assert.equal(permanent(new TransmissionException('all rejected')), false)
})

it('should name the ones worth trying again', () => {
  assert.equal(permanent(new StateNotFoundException()), false)
  assert.equal(permanent(new StateConcurrencyException()), false)
  assert.equal(permanent(new TransmissionException('all rejected')), false)
})

it('should read a reply exception as it travels, not only as a class', () => {
  // an exception crosses a binding as a value; what comes back is not an instance of anything
  assert.equal(permanent({ code: codes.RequestContract, message: '' }), true)
  assert.equal(permanent({ code: codes.Transmission, message: '' }), false)
})
