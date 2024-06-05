import { Component } from './component'

export class Remote extends Component {
  explain: (endpoint: string) => Explanation
}

interface Explanation {
  input: object | null
  output: object | null
  errors?: string[]
}
