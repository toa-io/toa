# bridge

## Notes

You build the native side. It is reachable through two contracts the CLI cannot wire for you:

- **The message channel.** Your native host receives requests on `window.webkit.messageHandlers.bridge` and must post each reply/event back as a `window` `'bridge'` `CustomEvent` (a `Detail`). `available()` is `true` only inside such a host; in a plain browser `platform`/`version` are `null` and `semver()` is `false`, so gate any request on `available()` (a request fired with no host never gets a reply).
- **The detection markers** — change these to match your wrapper:
  - **Android package id** (`svc/bridge.ts`) — detected by `document.referrer.startsWith('android-app://com.example.twa')`. Replace the placeholder `com.example.twa` with your Trusted Web Activity package id.
  - **`PWAShell` UA marker** (`svc/bridge.ts`) — iOS is detected by a `PWAShell` token in `navigator.userAgent`, with the version parsed from `PWAShell/<version>`. Have your iOS WebView host append the same marker (`… PWAShell/1.2.3`), or change both regexes to your own.

## Usage

```ts
import { bridge } from '@/bridge'

if (bridge.platform === 'ios' && bridge.semver('>=1.2.0')) {
  if (await bridge.purchases.available()) {
    const products = await bridge.purchases.products(['premium_yearly'])
    // …drive a purchase, then bridge.purchases.finish(transactionID)
  }
}

bridge.transmission.onNotificationClick((n) => {
  if (n.action) location.assign(n.action)
})
```

## API

| Symbol                          | Description                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `bridge.platform`               | `'ios' \| 'android' \| null` — native host detected from UA / referrer; `null` in a browser. |
| `bridge.version`                | Native host version string parsed from the `PWAShell/<version>` UA marker, else `null`.      |
| `bridge.semver(pattern)`        | `true` when `version` satisfies the semver `pattern`; `false` when there is no native host.   |
| `bridge.available()`            | `true` when the native message handler is reachable in the current environment.              |
| `bridge.purchases`              | StoreKit operations: `available()`, `products(ids)`, `purchase(id, token)`, `restore()`, `manage()`, `finish(txId)`. |
| `bridge.transmission`           | Push channel: `address()`, `permission()`, `request()`, `delete()`, `onNotification(cb)`, `onNotificationClick(cb)`. |
| `on(key, cb)` / `send(label, args?)` | Low-level transport: subscribe to a reply id / event label, or fire-and-forget a message. |

Every `purchases`/`transmission` request resolves to its typed result **or** an `Error` (a native-side failure) — narrow with `instanceof Error` before use.
