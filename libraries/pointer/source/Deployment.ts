import { nameVariable, nameSecret } from './naming'
import { resolveRecord } from './resolve'
import type { Variables, Variable } from '@toa.io/operations'

export class Deployment {
  private readonly id: string
  private readonly annotation: URIMap

  public constructor (id: string, annotation: URIMap) {
    this.id = id
    this.annotation = annotation
  }

  public export (requests: Request[]): Variables {
    const variables: Variables = {}

    for (const request of requests)
      variables[request.group] = this.createVariables(request.selectors)

    return variables
  }

  private createVariables (selectors: string[]): Variable[] {
    const variables: Variable[] = []

    for (const selector of selectors) {
      const variable = this.createVariable(selector)
      const secrets = this.createSecrets(selector)

      variables.push(variable, ...secrets)
    }

    return variables
  }

  private createVariable (selector: string): Variable {
    const name = nameVariable(this.id, selector)
    const { references } = this.resolveRecord(selector)
    const value = references.join(' ')

    return { name, value }
  }

  private createSecrets (selector: string): Variable[] {
    const varialbes: Variable[] = []
    const { key, references } = this.resolveRecord(selector)

    if (this.insecure(references)) return []

    for (const token of ['username', 'password']) {
      const varName = nameVariable(this.id, selector, token)
      const secretName = nameSecret(this.id, key)

      varialbes.push({
        name: varName,
        secret: {
          name: secretName,
          key: token
        }
      })
    }

    return varialbes
  }

  private resolveRecord (selector: string): AnnotationRecord {
    return resolveRecord(this.annotation, selector)
  }

  private insecure (references: string[]): boolean {
    const reference = references[0]
    const url = new URL(reference)

    return insecureProtocols.includes(url.protocol)
  }
}

export interface Request {
  group: string
  selectors: string[]
}

export interface AnnotationRecord {
  key: string
  references: string[]
}

const insecureProtocols = ['http:', 'https:', 'redis:']

export type URIMap = Record<string, string[]>
