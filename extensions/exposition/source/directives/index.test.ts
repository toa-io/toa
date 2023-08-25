import { load } from './index'

it('should load builtin families', async () => {
  const families = load()
  const names = families.map((family) => family.name)

  expect(names).toContain('dev')
})
