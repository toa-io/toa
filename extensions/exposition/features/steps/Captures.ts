import * as http from '@toa.io/agent'
import { binding } from 'cucumber-tsflow'

@binding()
export class Captures extends http.Captures {
}
