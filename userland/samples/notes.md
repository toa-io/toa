# Toa developer notes

## Extending Replay

1. Update [`example`](../example). `toa replay` should either fail or throw exception.
2. Update `suite` [translation](./src/.suite/translate.js).
3. Add [feature](./features). It should fail.
4. Add [boot extension](/runtime/boot/src/extensions).
5. Ensure feature is passing.
6. Ensure example is passing `toa replay`.
