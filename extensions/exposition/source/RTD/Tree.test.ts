import { generate } from 'randomstring'
import { Tree } from './Tree'
import { remotes } from './Context.mock'
import type * as syntax from './syntax'

let tree: Tree

const foo: syntax.Node = {
  GET: {
    namespace: generate(),
    component: generate(),
    endpoint: generate(),
    type: 'observation'
  }
}

const definition: syntax.Node = {
  '/foo': foo
}

beforeEach(() => {
  tree = new Tree(definition, remotes)
})

it('should match context resources', async () => {
  expect(tree.match('/foo')).not.toBeNull()
  expect(tree.match('/bar')).toBeNull()
})

it('should merge branches', async () => {
  const branch: syntax.Branch = {
    namespace: generate(),
    component: generate(),
    node: {
      '/': { GET: foo.GET }
    }
  }

  tree.merge(branch)

  const path = `/${branch.namespace}/${branch.component}`
  const node = tree.match(path)

  expect(node).not.toBeNull()
})
