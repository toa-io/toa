import { TAGS } from '../../cucumber.tags.mjs'

export default {
  paths: ['features/**/*.feature'],
  import: ['./features/**/*.ts'],
  tags: TAGS,
  failFast: true
}
