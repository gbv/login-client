# Login Client
[![Test and build](https://github.com/gbv/login-client/actions/workflows/test-and-build.yml/badge.svg)](https://github.com/gbv/login-client/actions/workflows/test-and-build.yml)
[![GitHub package version](https://img.shields.io/github/package-json/v/gbv/login-client.svg?label=version)](https://github.com/gbv/login-client)
[![NPM package name](https://img.shields.io/badge/npm-gbv--login--client-blue.svg)](https://www.npmjs.com/package/gbv-login-client)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme)

This repository offers a JavaScript client to be used with [login-server].

[login-server]: https://github.com/gbv/login-server

## Table of Contents  <!-- omit in toc -->
- [Install](#install)
- [Build](#build)
- [Usage](#usage)
  - [Cross-domain usage](#cross-domain-usage)
  - [v0 Compatibility](#v0-compatibility)
- [Test](#test)
- [Maintainers](#maintainers)
- [Publish](#publish)
- [Contribute](#contribute)
- [License](#license)

## Install
```bash
npm install gbv-login-client
```

To include login-client via a CDN, see below.

## Build
```bash
git clone https://github.com/gbv/login-client.git
cd login-client
npm install
npm run build
```

[esbuild](https://esbuild.github.io/) is used to create builds for the browser. These are published to npm and can be used via a CDN like [jsDelivr](https://www.jsdelivr.com):

[![](https://data.jsdelivr.com/v1/package/npm/gbv-login-client/badge?style=rounded)](https://www.jsdelivr.com/package/npm/gbv-login-client)

```html
<script src="https://cdn.jsdelivr.net/npm/gbv-login-client@1/dist/gbv-login-client.js"></script>
```

Note: Always specify at least the major version number to avoid breaking your application. Also, it is recommended to use the full path in case you need to load the source maps for debugging.

## Usage

An instance of class `LoginClient` provides methods to listen for events such
as login and logout, as soon as login client has been connected to login
server. Login is initiated by following a link to
[login endpoint of login server](https://github.com/gbv/login-server#get-login).

The lists of events and error types are also exported. See below for
usage examples and [login-client-vue](https://github.com/gbv/login-client-vue) for
a wrapper for web applications written in Vue 3:

```javascript
// CJS
const { LoginClient, events, errors } = require("gbv-login-client")
// ES6
import { LoginClient, events, errors } from "gbv-login-client"
// Browser
const { LoginClient, events, errors } = GLC

// Second parameter is an options object with properties:
// `ssl` (default: true), `retryMs` (default: 1000), `retryMsMax` (default: 30000), `retryMult` (default: 1.2), `pingInterval` (default: 10000)
let client = new LoginClient("login.example.com")

// Add event listeners
// Note: `event` always contains the property `event.type` which is the name of the event.
client.addEventListener(events.connect, event => {
  // Fires when the client successfully connected.
  // `event` is empty.
})
client.addEventListener(events.disconnect, event => {
  // Fires when the client disconnected.
  // `event` is empty.
})
client.addEventListener(events.login, event => {
  // Fires when the user has logged in.
  // `event.user` contains the user object.
})
client.addEventListener(events.logout, event => {
  // Fires when the user has logged out.
  // `event` is empty.
})
client.addEventListener(events.update, event => {
  // Fires when the user was updated.
  // `event.user` contains the updated user object.
})
client.addEventListener(events.providers, event => {
  // Fires when the providers were updated.
  // `event.providers` contains the updated providers list.
})
client.addEventListener(events.about, event => {
  // Fires when the server's about information was updated.
  // `event` contains the information (e.g. `event.publicKey`).
})
client.addEventListener(events.token, event => {
  // Fires when the token was updated.
  // `event.token` contains the updated token,
  // `event.expiresIn` contains the number of seconds the token will expire in.
})
client.addEventListener(events.error, event => {
  // Fires when an error occurred.
  // `event.error` contains one of the following errors:
  // - errors.NoInternetConnectionError
  // - errors.ThirdPartyCookiesBlockedError
  // - errors.ServerConnectionError
})
// (normally not used in production)
client.addEventListener(events._sent, event => {
  // Fires when a message was sent through the WebSocket.
  // `event.message` contains the message that was sent.
})
// (normally not used in production)
client.addEventListener(events._received, event => {
  // Fires when a message was received through the WebSocket.
  // `event.message` contains the message that was received.
})
// Alternatively, you can set an event listener for `null` which receives all events:
client.addEventListener(null, event => {
  switch (event.type) {
    case events.connect:
      // ...
      break
    default:
      // ...
  }
})

// Connect to login server
client.connect()

// Access properties
client.loggedIn
client.user
client.providers
client.connected
client.token
client.decodedToken // Decoded, but not verified!
client.about

// Change the user name at login server
client.setName("New Name")

// Static properties
LoginClient.events    // Object with available events (usage see above)
LoginClient.errors    // Object with available error classes
LoginClient.jwtDecode // Access to jwtDecode function

// If you eventually want to disconnect from login server (fires disconnect event one last time):
client.disconnect()
```

The [login-server] contains a more comprehensive example at its `/api` endpoint. See [its source code](https://github.com/gbv/login-server/blob/master/views/api.ejs) for details.

### Cross-domain usage
Access via login-client to a login server at another domain must be enabled by
both server and client. The login-server must explicitly allow domains via its
setting `ALLOWED_ORIGINS`. Access from the client may still be restricted
because most web browsers block cross-domain cookies by default as tracking
protection. In this case login-server emits a `ThirdPartyCookiesBlockedError`
event. Applications should then show an appropriate message telling users how
to add an exception in privacy settings of their browser to allow third-party
cookies (or disable enhanced tracking protection) for the application.

### v0 Compatibility
gbv-login-client v1 changed how it is exported and therefore it needs to be included differently.

```js
// CommonJS
// Previously: const LoginClient = require("gbv-login-client")
// Now:
const { LoginClient } = require("gbv-login-client")
// or: const LoginClient = require("gbv-login-client").LoginClient
```

```js
// ES6
// Previously: import LoginClient from "gbv-login-client"
// Now:
import { LoginClient } from "gbv-login-client"
```

```js
// Browser
// Previously the class was globally available under `LoginClient`.
// Now the module is available under `GLC` with `LoginClient` as one of its members. To easily make previous code compatible:
const { LoginClient } = GLC
```

Note that `events` and `errors` can also be imported directly, but are still available as members of `LoginClient`.

## Test
```bash
npm test
```

## Maintainers
- [@stefandesu](https://github.com/stefandesu)
- [@nichtich](https://github.com/nichtich)

## Publish
To publish a new version on npm after committing your changes, make sure you committed/merged all your changes to `dev` successfully and then run:

```bash
npm run release:patch
# or for minor release:
# npm run release:minor
# or for major release:
# npm run release:major
```

A new version will be published to npm automatically via GitHub Actions.

## Contribute
PRs accepted.

- Please implement your changes based on the current `dev` branch.
- Please run the tests before committing.
- Please do not skip the pre-commit hook when committing your changes.
- If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License
MIT © 2022- Verbundzentrale des GBV (VZG)
