export default {
  import: ['./features/**/*.ts'],
  // as the root suite does, so that a scenario can be held back by tagging it
  tags: 'not @skip',
  failFast: true
}
