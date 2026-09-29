import { it } from 'node:test'
import assert from 'node:assert/strict'
import { deployment } from './deployment.ts'

it('should deploy the journal as a service of its own', () => {
  const [service] = deployment().services!

  assert.equal(service.group, 'continuity')
  assert.equal(service.name, 'journal')
  assert.deepStrictEqual(service.components, ['continuity-journal'])
})
