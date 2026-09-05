import { Storage } from './storage.js'

export class Factory {
  storage (_) {
    return new Storage()
  }
}
