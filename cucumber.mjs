// A configuration written as a module states one profile: the default export is
// the profile itself rather than a map of them.
import { TAGS } from './cucumber.tags.mjs'

export default {
  import: ['./features/**/*.js'],
  tags: TAGS,
  failFast: true
}
