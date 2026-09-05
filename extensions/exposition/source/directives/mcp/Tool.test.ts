import assert from 'node:assert'
import { describe, it } from 'node:test'
import { Tool } from './Tool.js'
import { MCP } from './MCP.js'

describe('mcp:tool', () => {
  it('should take what the route states the tool is', () => {
    const tool = new Tool('The pots that are hot.', '/pots/hot')

    assert.strictEqual(tool.description, 'The pots that are hot.')
    assert.strictEqual(tool.title, undefined)
  })

  it('should take a title beside the description', () => {
    const tool = new Tool({ title: 'Hot pots', description: 'The pots that are hot.' }, '/pots')

    assert.strictEqual(tool.title, 'Hot pots')
    assert.strictEqual(tool.description, 'The pots that are hot.')
  })

  it('should not accept a mapping without a description', () => {
    assert.throws(() => new Tool({ title: 'Hot pots' }, '/pots'), /cannot be empty/)
  })

  it('should not accept an empty title', () => {
    assert.throws(() => new Tool({ title: ' ', description: 'A pot.' }, '/pots'),
      /a title cannot be empty/)
  })

  it('should not accept what it does not know', () => {
    assert.throws(() => new Tool({ description: 'A pot.', name: 'pots' }, '/pots'),
      /unknown 'name'/)
  })

  it('should not accept an empty description', () => {
    assert.throws(() => new Tool('  ', '/pots'), /cannot be empty/)
  })

  it('should not accept a value that is not one', () => {
    // `true` published a tool that stated nothing, back when an operation stated it instead
    assert.throws(() => new Tool(true, '/pots'), /the value is what the tool is/)
    assert.throws(() => new Tool(false, '/pots'), /the value is what the tool is/)
    assert.throws(() => new Tool(1, '/pots'), /the value is what the tool is/)
    assert.throws(() => new Tool(['A pot.'], '/pots'), /the value is what the tool is/)
  })

  it('should refuse a route no name can spell', () => {
    assert.throws(() => new Tool('A pot.', '/pots/a.b'), /no tool name can spell/)
    assert.throws(() => new Tool('A pot.', '/pots/:a.b'), /no tool name can spell/)

    // an underscore is what the convention keeps for itself
    assert.throws(() => new Tool('A pot.', '/pots/a_b'), /no tool name can spell/)
  })

  it('should name the route it refuses', () => {
    assert.throws(() => new Tool('A pot.', '/pots/a.b'), /'\/pots\/a\.b'/)
  })
})

describe('mcp:tool inheritance', () => {
  const family = new MCP()

  it('should take the nearest declaration', () => {
    const own = new Tool('Nearest.', '/pots')
    const inherited = new Tool('Furthest.', '/pots')

    assert.strictEqual(MCP.published([own, inherited])?.description, 'Nearest.')
  })

  it('should publish nothing where nothing is declared', () => {
    assert.strictEqual(MCP.published(undefined), null)
    assert.strictEqual(MCP.published([]), null)
  })

  it('should describe a method with what the route states', () => {
    const described = family.explain([new Tool('What the route is.', '/pots')], null as never,
      { description: 'What the operation is.' })

    assert.strictEqual(described.description, 'What the route is.')
  })

  it('should state nothing where nothing is declared', () => {
    assert.strictEqual(family.explain([], null as never, {}).description, undefined)
  })

  it('should refuse a directive it does not know', () => {
    assert.throws(() => family.create('resource', 'A pot.', null, '/pots'),
      /Unknown directive: mcp:resource/)
  })
})
