import * as http from '@toa.io/http'
import { binding } from 'cucumber-tsflow'

@binding()
export class Captures extends http.Captures {}
