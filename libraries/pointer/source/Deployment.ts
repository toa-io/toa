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
    const variables: Variable[] = []
    const { key, references } = this.resolveRecord(selector)

    const protocol = new URL(references[0]).protocol

    if (insecureProtocols.includes(protocol))
      return []

    if (protocol in specialProtocols)
      return specialProtocols[protocol](references)

    for (const token of ['username', 'password']) {
      const varName = nameVariable(this.id, selector, token)
      const secretName = nameSecret(this.id, key)

      variables.push({
        name: varName,
        secret: {
          name: secretName,
          key: token
        }
      })
    }

    return variables
  }

  private resolveRecord (selector: string): AnnotationRecord {
    return resolveRecord(this.annotation, selector)
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

const specialProtocols: Record<string, (references: string[]) => Variable[]> = {
  'pubsub:': (references: string[]) => {
    const path = new URL(references[0]).pathname
    const [, , project] = path.split('/')
    const name = nameVariable('ORIGINS_PUBSUB_', project)

    return [{
      name,
      secret: {
        name: 'toa-origins-pubsub',
        key: project,
        optional: true
      }
    } satisfies Variable]
  }
}

export type URIMap = Record<string, string[]>
