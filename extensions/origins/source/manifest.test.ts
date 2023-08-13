import { type Manifest, validate } from './manifest'

let manifest: Manifest

it('should not throw if valid', async () => {
  manifest = {
    one: 'http://localhost',
    two: null
  }

  expect(run).not.toThrow()
})

it('should throw if not a uri', async () => {
  manifest = {
    one: 'not a URI'
  }

  expect(run).toThrow('must match format')
})

it('should not throw on null manifest', async () => {
  manifest = null

  expect(run).not.toThrow()
})

function run (): void {
  validate(manifest)
}
