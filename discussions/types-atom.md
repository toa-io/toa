# `context.atom` in generated types

## Design concept

Every component has `context.atom`. `toa types` writes that on the Context it generates, as it
already writes `env`, `name` and `instance`.

### Guarantees

1. After `toa types`, `context.atom` typechecks: `slots`, `meter` and `lock` are on the Context
   every component of the application shares, and a lock routine may read `signal.error`.
   *(runtime — today)*
2. Nothing is declared for it. It is not an extension, and a component that names none still
   has it.

**What is not promised**

3. `onassigned` on `context.atom`. The aspect the bridge puts there forwards `slots`, `meter`
   and `lock`. The standalone `Factory` atom is where `onassigned` is.
4. `region` on the generated Context. The runtime puts it there; this change does not.

### What a component author does differently

Nothing to declare. After `toa types`, `context.atom` is on the generated Context:

```typescript
const slots = context.atom.slots(128)
await context.atom.meter(['sam'], [1000])
await context.atom.lock('the ledger', async (signal) => {
  if (signal.aborted) throw signal.error
})
```

## The changes, by area

1. **`toa types`.** The Context module writes `Atom` and `atom: Atom` among the fields every
   component has — `env`, `name`, `instance`, `atom`, `local`, `remote`. The lock's signal is
   `AbortSignal & { error: Error }`, which is what redlock passes and what the atomicity readme
   reads.
2. **Documentation.** The CLI says the generated Context carries `atom`.

## Decisions

**`atom` is a field of the generated Context, not an extension contribution.** Fetch and telemetry
reach the generator because they are extensions that export `context()`. The atom is a system
aspect the bridge shortcuts onto the context. Treating it as an extension would be a second way
to say what the runtime already does by pushing the aspect at boot.

**`Atom` is written in the Context module, not imported from the Node bridge.** The generated
file is what an application typechecks; pulling `@toa.io/bridges.node` into it would ask every
application to resolve a package the CLI does not declare. The shape is the same the bridge
already names — `slots`, `meter` and `lock` — what the shortcut actually forwards. The
connector's own `Atom` also has `onassigned` and the connector lifecycle; that is not what a
component is given.

**The lock's signal carries `error`.** Redlock aborts with a reason on the signal, and the
readme throws `signal.error`. A plain `AbortSignal` does not have that field.

## Context

[`connectors/atomicity`](../connectors/atomicity/readme.md) is what `context.atom` is.
[`migrations/271`](../migrations/271.md) put it on every component.

## What happens today

The generator builds Context from `env`, `name`, `instance`, `local`, `remote`, and whatever
extensions contribute. The atom is a bridge shortcut, so it is missing from
`application/types/toa.d.ts`. The handwritten Context in the Node bridge already declares it.

## Stages

1. A scenario: `toa types` writes `atom` on the Context.
2. The generator writes it.
3. The CLI readme says so.

## Verification

- Every component's context has an atom — `features/cli/types.feature`

## Compatibility

Types only. A component that already called `context.atom` keeps doing so; TypeScript now sees
it. The runtime is unchanged.
