import { TAGS } from '../../cucumber.tags.mjs'

export default {
  import: ['./features/**/*.ts'],
  tags: TAGS,
  failFast: true
}
