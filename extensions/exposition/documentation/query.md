# Query mapping

## TL;DR

```yaml
criteria?: string
selectors: string[] | null
sort?: string
omit?: [integer]
limit?: [integer]
projection?: [string]
```

```yaml
# manifest.toa.yaml

name: pots
namespace: tea

exposition:
  /hot:
    GET:
      endpoint: enumerate
      query:
        criteria: state==hot
    /top10:
      GET:
        endpoint: enumerate
        query:
          criteria: state==hot
          sort: rank:desc
          limit: 10
  /latest:
    GET:
      endpoint: observe
      query:
        sort: timestamp:desc
        limit: 1
```

Undefined `query` denies any query arguments in requests.

`POST` method mapping cannot have `query` declaration.

## Criteria

Search critaria in [RSQL](https://github.com/jirutka/rsql-parser) format.

The `criteria` property is considered as *open* when it ends with a `;`, allowing the combination of
request query criteria using `and` logic.
Otherwise, criteria property is *closed*, that is, doesn't allow `criteria` in a request query.

```yaml
# manifest.toa.yaml

name: dummy

exposition:
  /:
    GET:
      endpoint: observe
      query:
        criteria: state==hot; # open criteria
```

```http
GET /dummies/?criteria=rank==5
```

The request example above will result in an operation call with the following Request:

```yaml
query:
  criteria: state==hot;rank=5
```

### Path variables

Path variables are prepended to the `criteria` request query parameter using logial AND,
except for the [`POST` method](#post-method).

Given the following declaration:

```yaml
# manifest.toa.yaml

name: dummies

exposition:
  /:type:
    GET:
      endpoint: observe
      query:
        criteria: state==hot; # open criteria
```

and the following request:

```http request
GET /dummies/cool/?criteria=rank==5
```

Operation call will have the following query criteria:

```yaml
criteria: state==hot;type==cool;rank=5
```

### POST method

`POST` method semantically used to create a new entity instance, that is, calling a Transition
without Query.
Thus, path variables are added to the request input.

Given the following declaration:

```yaml
# manifest.toa.yaml

name: dummies

exposition:
  /:type:
    POST: transit
```

and the following request:

```http request
POST /dummies/cool/
content-type: application/yaml

input:
  rank: 5
```

Operation call will have the following input:

```yaml
type: cool
rank: 5
```

> In case of conflict, path variables override input properties.

## Omit, limit

`omit` and `limit` properties can declare their default values and allowed boundaries:

```yaml
limit:
  value: 10
  range: [1, 100]
```

If `range` is not specified, then the `value` is constat.
If no `value` is specified, then the lower boundary of the `range` is considered the default value.
Both of these cases have consice shortcuts:

```yaml
omit: 10
limit: [10, 100]
```

Default values for `omit` and `limit` are:

```yaml
omit: [0, 1000]
limit: [10, 100]
```

## Sort

The `sort` query property defines the result order of Observations within an `objects` scope
(enumeration).
It comprises an ordered set of sorting statements delimited by semicolons.
Each statement consists of an entity property name with an optional sorting direction suffix:
`:asc`for ascending or `:desc` for descending.

```yaml
sort: rank # ascending by default
```

```yaml
sort: rank:asc
```

```yaml
sort: rank:desc;timestamp:asc
```

If `sort` value ends with a semicolon `;` then the sorting is considered *open*
and can be extended using request query `sort` argument.

```yaml
sort: rank:desc; # open sort
```

Having the above `sort` declaration, the following request will result in an operation call
with `rank:desc;timestamp:asc` sort:

```http
GET /dummies/?sort=timestamp:asc
```

## Selectors

The `selectors` query property contains a semicolon-separated list of Entity properties allowed for
a client to use in the `criteria` and `sort` query parameters.

`null` value means that all Entity properties are allowed.

```yaml
selectors: rank;timestamp
```

## Projection

A list of Entity properties to be included in the Observation result, delimited by a comma.

```yaml
projection: id;title;timestamp
```
