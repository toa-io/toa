import assert from 'node:assert'
import { describe, it } from 'node:test'
import { Help } from './Help.js'
import { Family } from './Family.js'
import { Parameters } from './Parameters.js'

describe('help:method', () => {
  it('should read a bare value as the title, which is the short thing', () => {
    const help = new Help('method', 'Hot pots')

    assert.strictEqual(help.title, 'Hot pots')
    assert.strictEqual(help.description, undefined)
  })

  it('should take a description beside it', () => {
    const help = new Help('method', {
      title: 'Hot pots',
      description: 'The pots that are too hot to pour.'
    })

    assert.strictEqual(help.title, 'Hot pots')
    assert.strictEqual(help.description, 'The pots that are too hot to pour.')
  })

  it('should take a description alone', () => {
    const help = new Help('method', { description: 'Every pot there is.' })

    assert.strictEqual(help.title, undefined)
    assert.strictEqual(help.description, 'Every pot there is.')
  })

  it('should not accept one that says nothing', () => {
    assert.throws(() => new Help('method', {}), /says nothing/)
  })

  it('should not accept what it does not know', () => {
    assert.throws(() => new Help('method', { summary: 'A pot.' }), /'summary'/)
  })

  it('should not accept an empty value', () => {
    assert.throws(() => new Help('method', { title: ' ' }), /title cannot be empty/)
    assert.throws(
      () => new Help('method', { description: ' ' }),
      /description cannot be empty/
    )
  })

  it('should not accept a value that is not one', () => {
    assert.throws(() => new Help('method', ['a']), /the value is a title/)
  })
})

describe('help:node', () => {
  it('should read the value as the title', () => {
    const help = new Help('node', 'Pots')

    assert.strictEqual(help.title, 'Pots')
    assert.strictEqual(help.description, undefined)
  })

  it('should take a description beside it, as a method does', () => {
    const help = new Help('node', { title: 'Pots', description: 'What is brewing.' })

    assert.strictEqual(help.title, 'Pots')
    assert.strictEqual(help.description, 'What is brewing.')
  })
})

describe('help', () => {
  const help = new Family()

  it('should not be inherited: a node describes itself, not what is under it', () => {
    assert.strictEqual(help.inherited, false)
  })

  it('should take the nearest declaration of each subject', () => {
    const directives = [
      new Help('method', 'Nearest'),
      new Help('node', 'Resource'),
      new Help('method', 'Further')
    ]

    assert.strictEqual(Family.method(directives)?.title, 'Nearest')
    assert.strictEqual(Family.node(directives)?.title, 'Resource')
  })

  it('should say nothing where nothing is declared', () => {
    assert.strictEqual(Family.method(undefined), null)
    assert.strictEqual(Family.node([]), null)
  })

  it('should describe a method with what the route states', () => {
    const directives = [new Help('method', { title: 'Hot', description: 'Too hot.' })]

    assert.deepStrictEqual(help.explain(directives, null as never, { errors: ['NO'] }), {
      errors: ['NO'],
      title: 'Hot',
      description: 'Too hot.'
    })
  })

  it('should leave a method the node describes alone', () => {
    // what the resource is, is not what one of its methods is
    const directives = [new Help('node', 'Pots')]

    assert.deepStrictEqual(help.explain(directives, null as never, {}), {})
  })

  it('should refuse a directive it does not know', () => {
    assert.throws(() => help.create('resource', 'Pots'), /Unknown directive/)
  })
})

describe('help:route', () => {
  it('should describe a variable the template names', () => {
    const stated = new Parameters('route', { id: 'The pot' }, '/pots/:id')

    assert.deepStrictEqual(stated.parameters, { id: { title: 'The pot' } })
  })

  it('should take a description beside it', () => {
    const stated = new Parameters(
      'route',
      { id: { title: 'The pot', description: 'Which pot to pour.' } },
      '/pots/:id'
    )

    assert.deepStrictEqual(stated.parameters.id, {
      title: 'The pot',
      description: 'Which pot to pour.'
    })
  })

  it('should keep what the template names, which is what may be answered anew', () => {
    const stated = new Parameters('route', { id: 'The pot' }, '/pots/:id')

    assert.deepStrictEqual(stated.variables, ['id'])
  })

  it('should not check a name, because the template is not what says them all', () => {
    // `map:segments` answers a variable under the property it fills, and that name is
    // nowhere in the template
    const stated = new Parameters('route', { pot: 'The pot' }, '/pots/:id')

    assert.deepStrictEqual(stated.parameters, { pot: { title: 'The pot' } })
  })

  it('should name the rest of a path as the template writes it', () => {
    const stated = new Parameters('route', { '**': 'What is left' }, '/files/**')

    assert.deepStrictEqual(stated.parameters, { '**': { title: 'What is left' } })
  })
})

describe('help:query', () => {
  it('should describe a parameter, which no template names', () => {
    const stated = new Parameters('query', { since: 'From when' }, '/pots')

    assert.deepStrictEqual(stated.parameters, { since: { title: 'From when' } })
  })

  it('should refuse a value that names nothing', () => {
    assert.throws(() => new Parameters('query', 'since', '/pots'), /names each parameter/)
  })

  it('should refuse one that says nothing', () => {
    assert.throws(
      () => new Parameters('query', { since: {} }, '/pots'),
      /help:query\.since: says nothing/
    )
  })
})

describe('help parameters', () => {
  const help = new Family()

  it('should say what a parameter is, where its schema is', () => {
    const directives = [
      new Parameters('route', { id: 'The pot' }, '/pots/:id'),
      new Parameters('query', { limit: { description: 'How many.' } }, '/pots/:id')
    ]

    const explained = help.explain(directives, null as never, {
      route: { id: { type: 'string' } as never },
      query: { limit: { type: 'integer' } as never }
    })

    assert.deepStrictEqual(explained.route, { id: { type: 'string', title: 'The pot' } })
    assert.deepStrictEqual(explained.query, {
      limit: { type: 'integer', description: 'How many.' }
    })
  })

  it('should leave a parameter the method does not take alone', () => {
    const directives = [new Parameters('query', { since: 'From when' }, '/pots')]

    assert.deepStrictEqual(help.explain(directives, null as never, {}), {})
  })

  it('should answer a route variable an operation does not declare', () => {
    // `:id` on an observation is taken by the query, so nothing else describes it
    const directives = [new Parameters('route', { id: 'The pot' }, '/pots/:id')]

    assert.deepStrictEqual(help.explain(directives, null as never, {}), {
      route: { id: { title: 'The pot' } }
    })
  })

  it('should describe a segment a mapping renamed, under the name it answers by', () => {
    const directives = [new Parameters('route', { a: 'Which one' }, '/echo/:first')]

    const explained = help.explain(directives, null as never, {
      route: { a: { type: 'string' } as never }
    })

    assert.deepStrictEqual(explained.route, { a: { type: 'string', title: 'Which one' } })
  })

  it('should not invent a parameter nothing answers', () => {
    const directives = [new Parameters('route', { typo: 'Nobody' }, '/echo/:first')]

    assert.deepStrictEqual(
      help.explain(directives, null as never, { route: { a: { type: 'string' } as never } }),
      { route: { a: { type: 'string' } } }
    )
  })
})
