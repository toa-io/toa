# Puh

**Pu**re low-level **h**ttp client.

Combination of [http-parser-js](https://github.com/creationix/http-parser-js)
and [node-fetch](https://github.com/node-fetch/node-fetch)

> The methods below assume that a `Request-URI` is passed in the `absoluteURI`
> form [[5.1.2]](https://datatracker.ietf.org/doc/html/rfc2616#section-5.1.2).

`request(http: string): string`

Perform an HTTP request.

## CLI

```shell
$ npm i -g @toa.io/puh
$ puh
GET https://google.com/ HTTP/1.1
```
