# RTD Query mapping

```yaml
criteria?: string
sort?: string
omit?: [integer]
limit?: [integer]
projection?: [string]
```

Query object declared with `query` key of an RTD Method is used as the `Request.query` argument for corresponding
operation calls. RTD Query extends [UI Query schema](#).

```yaml
# manifest.toa.yaml

name: pots
namespace: tea

exposition:
  /hot:
    GET:
      endpoint: select
      query:
        criteria: state==hot
    /top10:
      GET:
        endpoint: observe
        query:
          criteria: state==hot
          sort: rank:desc
          limit: 10
  /latest:
    GET:
      endpoint: observe
      query:
        sort: timestamp:decs
        limit: 1
```

`null` value of the `query` denies any query arguments in the request.

> `POST` method mapping cannot have `query` declaration other than `null`.

```yaml

## Criteria

The criteria property is considered as *open* when it ends with a `;`, allowing the combination of request query
criteria using `and` logic. Otherwise, criteria property is *closed*, that is, doesn't allow `criteria` in a request
query.

```yaml
# manifest.toa.yaml

name: dummy

exposition:
  /:
    endpoint: observe
    query:
      criteria: state==hot; # open criteria
```

```http
GET /dummies?criteria=rank==5
```

The request example above will result in an operation call with the following Request:

```yaml
query:
  criteria: state==hot;rank=5
```

See [Request Mapping](#requests-mapping) for details.

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

The `sort` query property defines the result order of the Observation with an `objects` scope (enumeration). It contains
an ordered set of sorting statements delimited by a comma. Each statement consists of an entity property name with an
optional sorting direction suffix (`:asc` or `:desc`).

```yaml
sort: 'rank' # ascending by default
```

```yaml
sort: 'rank:asc'
```

```yaml
sort: 'rank:desc,timestamp:asc'
```

## Projection

A list of Entity properties to be included in the Observation result, delimited by a comma.

```yaml
projection: id,title,timestamp
```
