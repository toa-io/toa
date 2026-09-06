import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { AsnParser } from '@peculiar/asn1-schema'
import { ECDSASigValue } from '@peculiar/asn1-ecc'

/**
 * Verifying a passkey ends in reading an ECDSA signature, and the ASN.1 classes are
 * registered by decorators in a map the module holds. A package of them without an
 * `exports` map answers the CommonJS build to an `import`, and its classes land in a
 * different map than the parser reads — so every authentication fails with
 * `Cannot get schema for 'ECDSASigValue' target`, and nothing else says why.
 *
 * Imported here as the component imports it, because that is the whole of the fault: the
 * same parse succeeds under `require` and fails under `import`.
 */
describe('webauthn asn.1', () => {
  it('should read a signature the way an authentication does', () => {
    // SEQUENCE { INTEGER 1, INTEGER 1 } — the shape, which is all this is about
    const signature = Buffer.from('3006020101020101', 'hex')

    const value = AsnParser.parse(signature, ECDSASigValue)

    assert.ok(value.r instanceof ArrayBuffer)
    assert.ok(value.s instanceof ArrayBuffer)
  })
})
