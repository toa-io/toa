# Toa Tomato

Create BDD with TDD. Primitive mocking library
for [cucumber.js](https://github.com/cucumber/cucumber-js).

> ![Important](https://img.shields.io/badge/Important-red)<br/>
> Please note that this was originally created for internal use within
> the [Toa project](https://github.com/toa-io/toa), and as such may not fully meet your specific
> needs
> or requirements.

## Usage with Jest

```javascript
const tomato = require('@toa.io/tomato')
const mock = { tomato }

jest.mock('@cucumber/cucumber', () => mock.tomato)

require('my-step-definitions')

const step = tomato.steps.Given('we have something')

it('should set foo to the context', () => {
  const context = {}

  step.call(context)

  expect(context.foo).toBeDefined()
})
```

## Acronyms

`tomato.steps` exposes keywords as [acronyms](types/steps.d.ts) (`Gi`, `Wh`, etc.) to prevent IDE
code completion duplication.

```javascript
const step = tomato.steps.Gi('we have something')
```
