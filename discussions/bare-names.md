# A component without a namespace is named by its name

## Design concept

A component that declares no namespace is written the way it is called: by its name. Wherever
an application names a component — in a Context, in a manifest, in a call it hands over — the
bare name is taken, and `default.<name>` stays what the runtime calls it.

### Guarantees

**Already so**

1. A call: `context.remote.<name>.<operation>`, `toa call <name>.<operation>`. _(today)_
2. A receiver: `<name>.<event>`. _(today)_
3. The Context's `configuration`: `<name>`. _(today)_

**With this change**

4. A composition lists it as `<name>`.
5. `evicted.components` names it as `<name>`.
6. `events` names its event as `<name>.<event>`.
7. A map of addresses keys it as `<name>`. The key is tried after `default.<name>` and before
   `default`.
8. `context.delay` takes `<name>.<operation>`.
9. `default.<name>` is taken in every one of these, as before.

**What is not promised**

10. What the runtime says is unchanged: an id in a log, a trail, an exception, a metric, a map,
    a label or the name of a realtime event is `default.<name>`.
11. A key of a map of addresses that is both a namespace and the name of a component without
    one stands for both.

### What a component author does differently

Writes no `default`:

```yaml
# context.toa.yaml
compositions:
  - name: edge
    components: [store.orders, pictures]

evicted:
  components: [pictures]

events:
  - accounts.created

mongodb:
  .: mongodb://localhost
  accounts: mongodb://accounts.mongo.example.com
```

```javascript
await context.delay('notifications.chase', { input }, { delay: 86_400_000 })
```

## The changes, by area

1. **Context** (`runtime/norm`). The ids of `compositions`, `evicted.components` and `events`
   are completed with `default` before the Context is validated.
2. **Pointer** (`libraries/pointer`). A selector in `default` is also looked up by what follows
   the namespace.
3. **Cadence** (`extensions/cadence`). An endpoint of two segments is in `default`.
4. **Documentation.** Deployment, compositions, the pointer and cadence readmes.

## Decisions

1. **What is written, not what is said.** An application writes a name where it has one to
   write, and that is where the namespace it never declared has no business. What the runtime
   prints identifies a component among all of them, in every process and every tool that reads
   it, and one form there is worth more than a shorter one.
2. **Realtime event names stay as they are.** A client subscribes to and receives
   `default.<component>.<label>`. It is a name the runtime says, on a wire clients already
   read; shortening it is a break for them and a separate decision.
3. **Completed at the door.** The Context's ids are completed where it is read, so nothing that
   reads a Context afterwards learns a second form.
4. **A shared key is not refused.** A namespace and a component without one may bear the same
   name; refusing a key for it would refuse Contexts that are unambiguous to their authors.

## What happens today

A composition, an eviction, an address key, a consumed event or a delayed call that names a
component without a namespace by its name alone is refused, as an unknown component or an id
that does not fit.

## Verification

1. A composition that lists a component without a namespace by its name deploys it.
2. `evicted.components` naming one by its name leaves it out.
3. `events` naming its event by `<name>.<event>` has it published.
4. A map of addresses keyed by its name gives it that address.
5. A call delayed to `<name>.<operation>` is made.

## Compatibility

Nothing that was taken is refused: `default.<name>` reads as before everywhere.
