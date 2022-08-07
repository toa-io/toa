# Conveyor

## TL;DR

```javascript
const conveyor = new Conveyor(processor)
const response = await conveyor.process(unit)
```

See [types](types/conveyor.d.ts).

---

## Responsibility

Batches and sequentially processes units. Units are batched while processor's response is awaited.

## Processor

If processor returns an array of results `R[]`, then amount of results must match amount of given
units otherwise `ProcessorException` will be thrown. If processor returns `R` then it is returned
as a result for all processed units.

## Scaling Notice

> ![Important](https://img.shields.io/badge/Important-red)<br/>
> If Conveyor is used for batch insert into a database, scaling up instances of the corresponding
> component may result in **lower** overall request processing rate due to higher amount of
> database commits. 
