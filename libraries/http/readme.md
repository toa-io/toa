# HTTP

Text-level http client.

Combination of [http-parser-js](https://github.com/creationix/http-parser-js)
and Fetch API

`request(http: string): string`

Perform an HTTP request.

> `Request-URI` must be passed in the `absoluteURI`
> form [[5.1.2]](https://datatracker.ietf.org/doc/html/rfc2616#section-5.1.2).

## CLI

```shell
$ npm i -g @toa.io/http
$ http
GET https://google.com/ HTTP/1.1
```
