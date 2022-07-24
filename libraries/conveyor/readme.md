# Conveyor

## TL;DR

```javascript
const conveyor = new Conveyor(processor, options)
const response = await conveyor.process(unit)
```

See [types](types/conveyor.d.ts).

---

## Responsibility

Batches and sequentially processes units.

## Options

<dl>
<dt><code>capacity</code></dt>
<dd><code>number</code> maximum amount of batched units, default <code>1000</code>

`CapacityException` will be thrown if `capacity` is exceeded, thus must be prevented by other
mechanism. See [operation concurrency limit](#).
</dd>
</dl>

## Batching

Units are batched while processor's response is awaited.

## Processor

If processor returns an array of results `R[]`, then amount of results must match amount of given
units otherwise `ProcessorException` will be thrown. If processor returns `R` then it is returned
as a result for all processed units.

## Scaling Notice

> ![Important](https://img.shields.io/badge/Important-red)<br/>
> If Conveyor is used for batch insert into a database, scaling up instances of the corresponding
> component may result in **lower** overall request processing rate due to higher amount of
> database commits. 
