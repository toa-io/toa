import { nameVariable } from './env'
import type { Dependency, Variable, Variables } from '@toa.io/operations'

export class Deployment {
  private readonly id: string
  private readonly annotation: URIMap

  public constructor (id: string, annotation: URIMap) {
    this.id = id
    this.annotation = annotation
  }

  public export (requests: Request[]): Dependency {
    const variables: Variables = {}

    for (const request of requests)
      variables[request.label] = this.createVariables(request.selectors)

    return { variables }
  }

  private createVariables (selectors: string[]): Variable[] {
    return selectors.map(this.createVariable.bind(this))
  }

  private createVariable (selector: string): Variable {
    const name = nameVariable('TOA', this.id, selector)
    const values = this.resolve(selector)
    const value = values.join(' ')

    return { name, value }
  }

  private resolve (selector: string): string[] {
    if (selector in this.annotation) return this.annotation[selector]

    const segments = selector.split('.')

    while (segments.pop() !== undefined) {
      const current = segments.join('.')

      if (current in this.annotation) return this.annotation[current]
    }

    return this.annotation['.']
  }
}

export interface Request {
  label: string
  selectors: string[]
}

export type URIMap = Record<string, string[]>
