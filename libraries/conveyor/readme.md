# Conveyor

Concurrently precesses batched units with the best possible throughput.

## TL;DR

```javascript
const conveyor = new Conveyor(processor, options)
const response = await conveyor.process(unit)
```

See [types](types/conveyor.d.ts).

---

## Options

<dl>
<dt><code>lines</code></dt>
<dd><code>number</code> of concurrent processor calls, default <code>2</code>

It is assumed that a common use case of Conveyor is to handle remote processing, i.e. database
calls. In the worst case of having single synchronization point (commit queue), two lines allows
to avoid RTT delays. This parameter may become adaptive in future versions.
</dd>
<dt><code>capacity</code></dt>
<dd><code>number</code> maximum amount of batched units, default <code>1000</code>

`CapacityException` will be thrown if `capacity` is exceeded, thus must be prevented by other
mechanisms. See [operation concurrency limit](#).
</dd>
</dl>

## Batching

Units are batched while all lines are *busy*, that is awaiting processor's response.

## Processor

Amount of results must match amount of given units. `ProcessorException` will be thrown otherwise.
