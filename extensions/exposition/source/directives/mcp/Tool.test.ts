import assert from 'node:assert'
import { describe, it } from 'node:test'
import { Tool } from './Tool.js'
import { MCP } from './MCP.js'

describe('mcp:tool', () => {
  it('should take the operation description', () => {
    const tool = new Tool(true, '/pots')

    assert.strictEqual(tool.published, true)
    assert.strictEqual(tool.description, undefined)
  })

  it('should take the description declared', () => {
    const tool = new Tool('The pots that are hot.', '/pots/hot')

    assert.strictEqual(tool.published, true)
    assert.strictEqual(tool.description, 'The pots that are hot.')
  })

  it('should publish nothing', () => {
    assert.strictEqual(new Tool(false, '/pots').published, false)
  })

  it('should not accept an empty description', () => {
    assert.throws(() => new Tool('  ', '/pots'), /cannot be empty/)
  })

  it('should not accept a value that is neither', () => {
    assert.throws(() => new Tool(1, '/pots'), /a description, or whether/)
  })

  it('should refuse a route no name can spell', () => {
    assert.throws(() => new Tool(true, '/pots/a.b'), /no tool name can spell/)
    assert.throws(() => new Tool(true, '/pots/:a.b'), /no tool name can spell/)

    // an underscore is what the convention keeps for itself
    assert.throws(() => new Tool(true, '/pots/a_b'), /no tool name can spell/)
  })

  it('should not refuse a route it does not publish', () => {
    assert.doesNotThrow(() => new Tool(false, '/pots/a.b'))
  })

  it('should name the route it refuses', () => {
    assert.throws(() => new Tool(true, '/pots/a.b'), /'\/pots\/a\.b'/)
  })
})

describe('mcp:tool inheritance', () => {
  const family = new MCP()

  it('should take the nearest declaration', () => {
    const own = new Tool('Nearest.', '/pots')
    const inherited = new Tool('Furthest.', '/pots')

    assert.strictEqual(MCP.published([own, inherited])?.description, 'Nearest.')
  })

  it('should let a method opt out of what the node declared', () => {
    assert.strictEqual(MCP.published([new Tool(false, '/pots'), new Tool(true, '/pots')]), null)
  })

  it('should publish nothing where nothing is declared', () => {
    assert.strictEqual(MCP.published(undefined), null)
    assert.strictEqual(MCP.published([]), null)
  })

  it('should describe a method with what the route says', () => {
    const described = family.explain([new Tool('What the route is.', '/pots')], null as never,
      { description: 'What the operation is.' })

    assert.strictEqual(described.description, 'What the route is.')
  })

  it('should leave the operation description where it declares none', () => {
    const described = family.explain([new Tool(true, '/pots')], null as never,
      { description: 'What the operation is.' })

    assert.strictEqual(described.description, 'What the operation is.')
  })

  it('should refuse a directive it does not know', () => {
    assert.throws(() => family.create('resource', true, null, '/pots'),
      /Unknown directive: mcp:resource/)
  })
})
