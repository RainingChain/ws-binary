Binary WebSocket Wrapper
==================================================

`npm install` to install `express` and `websocket`.

`node app.js` to start the server than go to `localhost:4000/index.html`.

---

## Communication Pipeline Example:

- Raw data: `event=0, data={hitpoints:100,strength:123}`

- Schema Encoder:	`event=0, data=[100,123]`

- BinSON Encoder: `msg=[0, 133, 50, 10, 123, 120]`

- Message sent via binary websocket

- BinSON Decode: `event=0, data=[100,123]`

- Schema Decoder:	`event=0, {hitpoints:100,strength:123}`

---

## Shared data

The encoder and the schemas should be created in a shared file. (`shared.js` in this example)


