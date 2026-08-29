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

  return { foo: 'bar' }
}

exports.transition = transition
```

Exported function's name defines operation `type` property, thus must be one of:
`transition`, `observation`, or `assignment`. Second (state) argument name must be `object`,
`objects`, or `changeset` as it defines operation's `scope`.

Following function signature defines operation of `observation` type with `objects` scope.

```javascript
// operations/set.js

function observation (input, objects) {
  // ...
}
```

See [Operation properties](#).

### Class

#### Example

```javascript
// operations/transit.js

class Transition {
  #context

  async mount (context) {
    this.#context = context
  }

  execute (input, object) {
    // ...

    return { foo: 'bar' }
  }
}

exports.Transition = Transition
```

Exported class name must be one of: `Transition`, `Observation`, or `Assignment`, as it defines
operation's `type`. Class must implement [Algorithm interface](./types/operations.d.ts).
Second (state) argument name of the `execute` method must be `object`, `objects`, or `changeset` as
it defines operation's `scope`.

### Factory

```javascript
class ObjectTransitionFactory {
  async create () {
    // ...
  }
}

exports.ObjectTransitionFactory = ObjectTransitionFactory
```

Exported class name must follow the pattern: `{Subject}{Type}Factory`, where `Subject` and `Type`
defines operation's `scope` and `type` respectively. Class must
implement [Algorithm Factory interface](#).

> Factory class name examples: `ObjectTransitionFactory`, `ObjectsObservationFactory`,
> `ChangesetAssignmentFactory`.

### Storing Context

> Algorithm definition should store reference to the `context` object without copying its value
> type variables as they may change over operation lifetime.

## Run Commands

Modules in the `rc` directory of the component root run once per component lifetime, outside any
operation. A module must export at least one of three phases, and may export several.

```javascript
// rc/providers.js

async function preflight (context) {
  context.state.providers = await connect(context)
}

async function dispose (context) {
  await release(context.state.providers)
}

module.exports = { preflight, dispose }
```

| Phase       | When                                                                            |
|-------------|---------------------------------------------------------------------------------|
| `preflight` | on connection, before operations are served                                     |
| `settle`    | on connection, once the component can call its own operations (`context.local`) |
| `dispose`   | on disconnection, after the component has stopped serving                       |

`dispose` is the counterpart of `preflight`: what a component opened there is released here. It runs
before the context it is given is disconnected, so a component can still reach its remotes while
releasing — but nothing calls it into the component any more, so it must not expect its own
operations to answer.

Anything a component leaves open holds the process: a `toa compose` exits when the last handle is
released, and a feature suite that boots a composition in its own process does the same. Background
work a component starts and does not await — a stream it drives, a client it keeps — belongs in
`dispose`.
