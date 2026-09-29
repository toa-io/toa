# Durable tasks

```yaml
operations:
  workflow:
    durable: true
```

- Can be called only with `task: true`
- Wraps the `context` (proxy?)
- Records all responses/values to it's storage
- Exceptions will cause runtime to retry the task
- Before run, `durable` reads previous results from storage and proxy returns them

## Questions

**What is saved?**

- any context `invocations`?

**Same element of the context is called multiple times**

- rely on access/call order? what about non-deterministic order?
- hash of the arguments?
