import { Component } from './component.js'

export class Remote extends Component {
  explain (endpoint: string): Promise<Explanation>
}

interface Explanation {
  description?: string
  input: Schema | null
  output: Schema | null
  errors?: string[]
}

interface Schema {
  type: string
  properties: {
    [key: string]: Schema
  }
}
