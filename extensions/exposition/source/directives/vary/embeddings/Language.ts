import assert from 'node:assert'
import Negotiator from 'negotiator'
import type { Properties } from '../Properties'
import type { Embedding } from './Embedding'
import type { Input } from '../../../io'

export class Language implements Embedding {
  public resolve (input: Input, properties: Properties): string | undefined {
    assert.ok(properties.languages !== undefined,
      'Supported languages are not defined. Use `vary:languages` directive.')

    assert.ok(properties.languages.length > 0,
      'List of supported languages is empty.')

    const negotiator = new Negotiator(input)
    const language = negotiator.language(properties.languages) ?? properties.languages[0]

    input.pipelines.response.push((response) => {
      response.headers ??= new Headers()
      response.headers.set('content-language', language)
      response.headers.append('vary', 'accept-language')
    })

    return language
  }
}
