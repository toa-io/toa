import { generate } from 'randomstring'
import { Node } from './Node'
import { createBranch } from './factory'
import * as syntax from './syntax'
import { context } from './Context.mock'

const { namespace, name } = context

const definition: syntax.Node = {
  '/': {}
}

let branch: Node

beforeEach(() => {
  jest.clearAllMocks()

  branch = createBranch(definition, context)
})

describe('own key', () => {
  it('should match own key', async () => {
    const match = branch.match([namespace])

    expect(match).not.toBeNull()
  })

  it('should not match key with different segment', async () => {
    const match = branch.match([namespace, generate()])

    expect(match).toBeNull()
  })

  it('should not match key with extra segment', async () => {
    const match = branch.match([namespace, name, generate()])

    expect(match).toBeNull()
  })

  it('should not match key with missing segment', async () => {
    const match = branch.match([name])

    expect(match).toBeNull()
  })

  it('should match placeholders', async () => {
    const definition: syntax.Node = {
      '/:user-id': {}
    }

    const branch = createBranch(definition, context)
    const match = branch.match([namespace, name, generate()])

    expect(match).not.toBeNull()
  })
})
