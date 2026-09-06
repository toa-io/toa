import assert from 'node:assert'
import { describe, it } from 'node:test'
import { Tool } from './Tool.js'
import { MCP } from './MCP.js'

describe('mcp:tool', () => {
  it('should publish a method', () => {
    assert.strictEqual(new Tool(true, '/pots/hot').published, true)
  })

  it('should withdraw one, because a declaration is inherited', () => {
    assert.strictEqual(new Tool(false, '/pots/hot').published, false)
  })

  it('should not accept what a tool is, which is `help:method`', () => {
    assert.throws(() => new Tool('The pots that are hot.', '/pots'), /`help:method`/)
    assert.throws(() => new Tool({ title: 'Hot pots' }, '/pots'), /`help:method`/)
  })

  it('should not accept a value that is not one', () => {
    assert.throws(() => new Tool(undefined, '/pots'), /whether the method is published/)
    assert.throws(() => new Tool(null, '/pots'), /whether the method is published/)
  })

  it('should refuse a route no name can spell', () => {
    assert.throws(() => new Tool(true, '/pots/v1.0'), /no tool name can spell/)
  })

  it('should name the route it refuses', () => {
    assert.throws(() => new Tool(true, '/pots/v1.0'), /'\/pots\/v1\.0'/)
  })

  it('should not ask a route it does not publish to be spellable', () => {
    assert.strictEqual(new Tool(false, '/pots/v1.0').published, false)
  })
})

describe('mcp:tool inheritance', () => {
  const mcp = new MCP()

  it('should take the nearest declaration', () => {
    const nearest = new Tool(false, '/pots')
    const further = new Tool(true, '/pots')

    assert.strictEqual(MCP.published([nearest, further]), false)
  })

  it('should publish nothing where nothing is declared', () => {
    assert.strictEqual(MCP.published(undefined), false)
    assert.strictEqual(MCP.published([]), false)
  })

  it('should refuse a directive it does not know', () => {
    assert.throws(() => mcp.create('tools', true, null, '/pots'), /Unknown directive/)
  })
})
