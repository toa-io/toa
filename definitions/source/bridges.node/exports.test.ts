import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { exports } from './exports.ts'

const read = (text: string, file = 'module.js'): ReturnType<typeof exports> => exports(file, text)

describe('ES modules', () => {
  it('reads a declaration exported where it is written', () => {
    const bound = read('export async function transition(input, object, context) {}')

    assert.deepStrictEqual(bound.get('transition'), {
      kind: 'function',
      declared: 'transition',
      params: ['input', 'object', 'context']
    })
  })

  it('reads a specifier by the name it is exported as', () => {
    const bound = read('const meter = (input) => input\nexport { meter as computation }')

    assert.deepStrictEqual(bound.get('computation'), {
      kind: 'function',
      declared: undefined,
      params: ['input']
    })
  })

  it('reads a default export with the name it declares', () => {
    const bound = read('export default function transition(_, changeset) {}')

    assert.deepStrictEqual(bound.get('default'), {
      kind: 'function',
      declared: 'transition',
      params: ['_', 'changeset']
    })
  })

  it('reads a class with its methods', () => {
    const bound = read('export class Transition {\n  execute(input, object) {}\n  run() {}\n}')

    assert.deepStrictEqual(bound.get('Transition'), {
      kind: 'class',
      declared: 'Transition',
      methods: { execute: ['input', 'object'], run: [] }
    })
  })

  it('reads what is not written as a function or a class as other', () => {
    const bound = read('export const computation = wrap(fn)\nexport const NAME = "x"')

    assert.deepStrictEqual(bound.get('computation'), { kind: 'other' })
    assert.deepStrictEqual(bound.get('NAME'), { kind: 'other' })
  })

  it('leaves a type export out', () => {
    const bound = read('export type Foo = string\nexport interface Bar {}', 'module.ts')

    assert.equal(bound.size, 0)
  })

  it('names no parameter that is a pattern or a rest', () => {
    const bound = read('export function computation({ a }, ...rest) {}')

    assert.deepStrictEqual(bound.get('computation')?.params, [undefined, undefined])
  })

  it('names a parameter with a default', () => {
    const bound = read('export const effect = (input, stream = null) => stream')

    assert.deepStrictEqual(bound.get('effect')?.params, ['input', 'stream'])
  })
})

describe('TypeScript', () => {
  it('reads through annotations', () => {
    const bound = read(
      'export async function transition(input: string, object: State): Promise<Reply> {}',
      'module.ts'
    )

    assert.deepStrictEqual(bound.get('transition')?.params, ['input', 'object'])
  })

  it('reads a class with private fields and typed methods', () => {
    const bound = read(
      'export class Computation {\n  #foo: string = ""\n  async mount(context: Context): Promise<void> {}\n  async execute(input: string): Promise<string> { return input }\n}',
      'module.ts'
    )

    assert.deepStrictEqual(bound.get('Computation')?.methods, {
      mount: ['context'],
      execute: ['input']
    })
  })

  it('names the file that does not parse', () => {
    assert.throws(() => read('export function (', 'broken.js'), /broken\.js/)
  })
})

describe('CommonJS', () => {
  it('reads module.exports', () => {
    const bound = read(
      'function computation(input) {}\nmodule.exports = { computation, other: () => 1 }',
      'module.cjs'
    )

    assert.deepStrictEqual(bound.get('computation'), {
      kind: 'function',
      declared: 'computation',
      params: ['input']
    })
    assert.deepStrictEqual(bound.get('other'), { kind: 'function', declared: undefined, params: [] })
  })

  it('reads exports.name and module.exports.name', () => {
    const bound = read(
      'exports.transition = function (input, object) {}\nmodule.exports.condition = () => true',
      'module.cjs'
    )

    assert.deepStrictEqual(bound.get('transition')?.params, ['input', 'object'])
    assert.equal(bound.get('condition')?.kind, 'function')
  })
})
