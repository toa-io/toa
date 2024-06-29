import { Component } from './component'

export class Remote extends Component {
  explain (endpoint: string): Promise<Explanation>
}

interface Explanation {
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
