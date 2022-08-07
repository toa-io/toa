# Node.js Bridge

> Currently, Node.js bridge only
> supports [CommonJS modules](https://nodejs.org/api/modules.html#modules-commonjs-modules).

## Algorithm Definition

Operation's algorithms are defined as CommonJS modules in under `operations` directory in the
component root. Algorithm module must export a function which is Algorithm Function, Class or
Factory. Module file name without extension is an operation name (endpoint).

### Function

```javascript
// operations/create.js

function transition (input, object, context) {
  // ...

  return { output: { foo: 'bar' } }
}

exports.transition = transition
```

Return value must match [UCP Response](#). If return value is an object without neither `output`
nor `error` properties, then it is considered as the value of `output`.

Next two return values are equivalent.

```javascript
return { ok: 1 }

return { output: { ok: 1 } } 
```

Exported function's name defines operation `type` property, thus must be one of:
`transition`, `observation`, or `assignment`. Second (state) argument name must be `object`,
`objects`, or `changeset` as it defines operation's `subject`.

Following function signature defines operation of `observation` type with `objects` subject.

```javascript
// operations/set.js

function observation (input, objects) {
  // ...
}
```

See [Operation properties](#).

### Class

```javascript
// operations/transit.js

class Transition {
  constructor (context) {}

  execute (input, object) {
    // ...

    return { output: { foo: 'bar' } }
  }
}

exports.Transition = Transition
```

Exported class name must be one of: `Transition`, `Observation`, or `Assignment`, as it defines
operation's `type`. Class must implement [Algorithm interface](./types/operations.d.ts).
Second (state) argument name of the `execute` method must be `object`, `objects`, or `changeset` as
it defines operation's `subject`.

### Factory

```javascript
class ObjectTransitionFactory {
  constructor (context) {}

  create () {
    // ...
  }
}

exports.ObjectTransitionFactory = ObjectTransitionFactory
```

Exported class name must follow the pattern: `{Subject}{Type}Factory`, where `Subject` and `Type`
defines operation's `subject` and `type` respectively. Class must
implement [Algorithm Factory interface](types/operations.d.ts).

> Factory class name examples: `ObjectTransitionFactory`, `ObjectsObservationFactory`,
> `ChangesetAssignmentFactory`.

### Storing Context

> Algorithm definition should store reference to the `context` object without copying its value
> type variables as they may change over time.
