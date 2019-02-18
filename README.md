# Login Client
[![Build Status](https://travis-ci.com/gbv/login-client.svg?branch=master)](https://travis-ci.com/gbv/login-client)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme)

This repository offers a client to be used with [login-server](https://github.com/gbv/login-server).

## Table of Contents
- [Install](#install)
- [Usage](#usage)
- [Test](#test)
- [Maintainers](#maintainers)
- [Contribute](#contribute)
- [License](#license)

## Install
```bash
git clone https://github.com/gbv/login-client.git
cd login-client
npm install
```

## Build
[browserify](https://github.com/browserify/browserify) is used to create builds for the browser. These builds are available in the `build/` folder and will be created on each commit. The files can be included manually or using a CDN like [jsDelivr](https://www.jsdelivr.com):

```html
<script src="https://cdn.jsdelivr.net/gh/gbv/login-client/build/login-client.js"></script>
```

Or minified:
```html
<script src="https://cdn.jsdelivr.net/gh/gbv/login-client/build/login-client.min.js"></script>
```

After that, the class `LoginClient` can be used like shown below.

## Usage
```javascript
const LoginClient = require("gbv-login-client")
// Second parameter is an options object with properties:
// `ssl` (default: true), `retryMs` (default: 1000), `retryMsMax` (default: 10000), `retryMult` (default: 1.2)
let client = new LoginClient("login.example.com")
// Add event listeners
// Note: `event` always contains the property `event.type` which is the name of the event.
client.addEventListener("connect", event => {
  // Fires when the client successfully connected.
  // `event` is empty.
})
client.addEventListener("disconnect", event => {
  // Fires when the client disconnected.
  // `event` is empty.
})
client.addEventListener("login", event => {
  // Fires when the user has logged in.
  // `event.user` contains the user object.
})
client.addEventListener("logout", event => {
  // Fires when the user has logged out.
  // `event` is empty.
})
client.addEventListener("update", event => {
  // Fires when the user was updated.
  // `event.user` contains the updated user object.
})
client.addEventListener("providers", event => {
  // Fires when the providers were updated.
  // `event.providers` contains the updated providers list.
})
client.addEventListener("publicKey", event => {
  // Fires when the server's public key was updated.
  // `event.publicKey` contains the updated public key.
})
client.addEventListener("token", event => {
  // Fires when the token was updated.
  // `event.token` contains the updated token.
})
client.addEventListener("error", event => {
  // Fires when an error occurred.
  // `event.error` contains one of the following errors:
  // - NoInternetConnectionError
  // - ThirdPartyCookiesBlockedError
  // - ServerConnectionError
})
// (normally not used in production)
client.addEventListener("_sent", event => {
  // Fires when a message was sent through the WebSocket.
  // `event.message` contains the message that was sent.
})
// (normally not used in production)
client.addEventListener("_received", event => {
  // Fires when a message was received through the WebSocket.
  // `event.message` contains the message that was received.
})
// Connect
client.connect()
// Access properties
client.loggedIn
client.user
client.providers
client.connected
client.token
client.publicKey
```

## Test
```bash
npm test
```

## Maintainers
- [@stefandesu](https://github.com/stefandesu)
- [@nichtich](https://github.com/nichtich)

## Contribute
PRs accepted.

- Please run the tests before committing.
- Please do not skip the pre-commit hook when committing your changes.
- If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License
MIT © 2019 Verbundzentrale des GBV (VZG)
