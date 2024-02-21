import * as schemas from './schemas'

describe('workflow', () => {
  const ok = [
    { echo: 'hello world' },
    [{ echo: 'hello world' }, { ok: 'ok' }]
  ]

  const oh = [
    { echo: [] },
    { echo: 'hello world', ok: { not: 'ok' } }
  ]

  it.each(ok)('should be valid', (workflow) => {
    expect(() => schemas.workflow.validate(workflow)).not.toThrow()
  })

  it.each(oh)('should not be valid', (workflow) => {
    expect(() => schemas.workflow.validate(workflow)).toThrow()
  })
})
